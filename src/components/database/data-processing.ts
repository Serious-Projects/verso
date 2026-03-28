import type {
  CellValue,
  DatabaseProperty,
  DatabaseRow,
  DatabaseView,
  FilterOperator,
  FilterRule,
  SortRule,
} from "@/types/database";


function matchesFilter(
  cellValue: CellValue,
  filter: FilterRule,
  property: DatabaseProperty,
): boolean {
  const { operator, value: filterValue } = filter;

  // Empty checks — work for all types
  if (operator === "is_empty") {
    return cellValue === null || cellValue === "" || (Array.isArray(cellValue) && cellValue.length === 0);
  }
  if (operator === "is_not_empty") {
    return cellValue !== null && cellValue !== "" && !(Array.isArray(cellValue) && cellValue.length === 0);
  }

  // Checkbox — compare as boolean
  if (property.type === "checkbox") {
    const boolVal = cellValue === true;
    return operator === "equals" ? boolVal === (filterValue === "true") : true;
  }

  // Number
  if (property.type === "number") {
    const num = typeof cellValue === "number" ? cellValue : null;
    const filterNum = parseFloat(filterValue);
    if (num === null || isNaN(filterNum)) return false;
    switch (operator) {
      case "equals": return num === filterNum;
      case "does_not_equal": return num !== filterNum;
      case "greater_than": return num > filterNum;
      case "less_than": return num < filterNum;
      default: return true;
    }
  }

  // Select / Status — compare option ID
  if (property.type === "select" || property.type === "status") {
    const selected = (cellValue as string | null) ?? "";
    switch (operator) {
      case "equals": return selected === filterValue;
      case "does_not_equal": return selected !== filterValue;
      default: return true;
    }
  }

  // Multi-select — check if any selected option matches
  if (property.type === "multi_select") {
    const selectedIds = (cellValue as string[] | null) ?? [];
    switch (operator) {
      case "equals": return selectedIds.includes(filterValue);
      case "does_not_equal": return !selectedIds.includes(filterValue);
      default: return true;
    }
  }

  // Date — chronological comparison
  if (property.type === "date") {
    const cellDate = cellValue ? new Date((cellValue as string) + "T00:00:00").getTime() : NaN;
    const filterDate = filterValue ? new Date(filterValue + "T00:00:00").getTime() : NaN;
    if (isNaN(cellDate) || isNaN(filterDate)) return false;
    switch (operator) {
      case "equals": return cellDate === filterDate;
      case "does_not_equal": return cellDate !== filterDate;
      case "greater_than": return cellDate > filterDate;
      case "less_than": return cellDate < filterDate;
      default: return true;
    }
  }

  // Text-like (text, title, url, email, phone)
  const strVal = ((cellValue as string) ?? "").toLowerCase();
  const filterStr = filterValue.toLowerCase();
  switch (operator) {
    case "contains": return strVal.includes(filterStr);
    case "does_not_contain": return !strVal.includes(filterStr);
    case "equals": return strVal === filterStr;
    case "does_not_equal": return strVal !== filterStr;
    default: return true;
  }
}

export function applyFilters(
  rows: DatabaseRow[],
  filters: FilterRule[],
  properties: DatabaseProperty[],
): DatabaseRow[] {
  if (filters.length === 0) return rows;

  const propMap = new Map(properties.map((p) => [p.id, p]));

  return rows.filter((row) =>
    filters.every((filter) => {
      const prop = propMap.get(filter.propertyId);
      if (!prop) return true;
      return matchesFilter(row.cells[filter.propertyId], filter, prop);
    }),
  );
}


function compareCells(
  a: CellValue,
  b: CellValue,
  property: DatabaseProperty,
  optionLabelMap: Map<string, string>,
): number {
  const aEmpty = a === null || a === "" || (Array.isArray(a) && a.length === 0);
  const bEmpty = b === null || b === "" || (Array.isArray(b) && b.length === 0);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (property.type === "number") {
    return (a as number) - (b as number);
  }

  if (property.type === "checkbox") {
    return (a === true ? 1 : 0) - (b === true ? 1 : 0);
  }

  if (property.type === "select" || property.type === "status") {
    return (optionLabelMap.get(a as string) ?? "").localeCompare(optionLabelMap.get(b as string) ?? "");
  }

  if (property.type === "multi_select") {
    return (a as string[]).length - (b as string[]).length;
  }

  return String(a).localeCompare(String(b));
}

export function applySorts(
  rows: DatabaseRow[],
  sorts: SortRule[],
  properties: DatabaseProperty[],
): DatabaseRow[] {
  if (sorts.length === 0) return rows;

  const propMap = new Map(properties.map((p) => [p.id, p]));

  // Pre-build option label maps for O(1) lookups during sort
  const optionLabelMaps = new Map<string, Map<string, string>>();
  for (const prop of properties) {
    if (prop.options) {
      optionLabelMaps.set(prop.id, new Map(prop.options.map((o) => [o.id, o.label])));
    }
  }

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const prop = propMap.get(sort.propertyId);
      if (!prop) continue;
      const cmp = compareCells(a.cells[sort.propertyId], b.cells[sort.propertyId], prop, optionLabelMaps.get(prop.id) ?? new Map());
      if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}


export interface RowGroup {
  key: string;
  label: string;
  color: string;
  rows: DatabaseRow[];
}

export function applyGrouping(
  rows: DatabaseRow[],
  groupBy: string | undefined,
  properties: DatabaseProperty[],
): RowGroup[] | null {
  if (!groupBy) return null;

  const prop = properties.find((p) => p.id === groupBy);
  if (!prop) return null;

  if (prop.type === "checkbox") {
    const checked = rows.filter((r) => r.cells[groupBy] === true);
    const unchecked = rows.filter((r) => r.cells[groupBy] !== true);
    return [
      { key: "checked", label: "Checked", color: "green", rows: checked },
      { key: "unchecked", label: "Unchecked", color: "gray", rows: unchecked },
    ];
  }

  // Select / Status / Multi-select — group by option
  const options = prop.options ?? [];
  const groups: RowGroup[] = [];

  for (const opt of options) {
    const matching = rows.filter((row) => {
      const val = row.cells[groupBy];
      if (Array.isArray(val)) return val.includes(opt.id);
      return val === opt.id;
    });
    if (matching.length > 0) {
      groups.push({ key: opt.id, label: opt.label, color: opt.color, rows: matching });
    }
  }

  // Rows with no value
  const assignedIds = new Set(groups.flatMap((g) => g.rows.map((r) => r.id)));
  const unassigned = rows.filter((r) => !assignedIds.has(r.id));
  if (unassigned.length > 0) {
    groups.push({ key: "_none", label: "No value", color: "gray", rows: unassigned });
  }

  return groups;
}


export function processRows(
  rows: DatabaseRow[],
  view: DatabaseView,
  properties: DatabaseProperty[],
): { rows: DatabaseRow[]; groups: RowGroup[] | null } {
  let processed = applyFilters(rows, view.filters, properties);
  processed = applySorts(processed, view.sorts, properties);
  const groups = applyGrouping(processed, view.groupBy, properties);
  return { rows: processed, groups };
}
