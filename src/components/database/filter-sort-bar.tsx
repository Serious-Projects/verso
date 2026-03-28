"use client";

import {
  ArrowDownAZ,
  ArrowUpZA,
  Filter,
  Group,
  Plus,
  SortAsc,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type {
  DatabaseProperty,
  DatabaseView,
  FilterOperator,
  PropertyType,
} from "@/types/database";
import { Dropdown } from "./dropdown";
import { PropertyIcon, PROPERTY_TYPE_LABELS } from "./property-icon";
import { SelectInput } from "./select-input";


type OpConfig = { value: FilterOperator; label: string };

const COMMON_OPS: OpConfig[] = [
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];

const TEXT_OPS: OpConfig[] = [
  { value: "contains", label: "Contains" },
  { value: "does_not_contain", label: "Does not contain" },
  { value: "equals", label: "Equals" },
  { value: "does_not_equal", label: "Does not equal" },
  ...COMMON_OPS,
];

const NUMBER_OPS: OpConfig[] = [
  { value: "equals", label: "=" },
  { value: "does_not_equal", label: "≠" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  ...COMMON_OPS,
];

const SELECT_OPS: OpConfig[] = [
  { value: "equals", label: "Is" },
  { value: "does_not_equal", label: "Is not" },
  ...COMMON_OPS,
];

const CHECKBOX_OPS: OpConfig[] = [
  { value: "equals", label: "Is" },
];

function getOperatorsForType(type: PropertyType): OpConfig[] {
  switch (type) {
    case "number":
      return NUMBER_OPS;
    case "select":
    case "multi_select":
    case "status":
      return SELECT_OPS;
    case "checkbox":
      return CHECKBOX_OPS;
    default:
      return TEXT_OPS;
  }
}

function needsValueInput(op: FilterOperator): boolean {
  return op !== "is_empty" && op !== "is_not_empty";
}


interface FilterSortBarProps {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}

export function FilterSortBar({ dbId, view, properties }: FilterSortBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const openFilter = useCallback((v: boolean) => { setFilterOpen(v); if (v) { setSortOpen(false); setGroupOpen(false); } }, []);
  const openSort = useCallback((v: boolean) => { setSortOpen(v); if (v) { setFilterOpen(false); setGroupOpen(false); } }, []);
  const openGroup = useCallback((v: boolean) => { setGroupOpen(v); if (v) { setFilterOpen(false); setSortOpen(false); } }, []);

  const hasFilters = view.filters.length > 0;
  const hasSorts = view.sorts.length > 0;
  const hasGroup = !!view.groupBy;

  return (
    <div className="flex items-center gap-1 border-b border-border/20 px-4 py-1.5">
      <Dropdown
        open={filterOpen}
        onOpenChange={openFilter}
        width="w-80"
        testId="filter-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openFilter(!filterOpen)}
            data-testid="filter-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasFilters
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <Filter className="h-3 w-3" />
            Filter{hasFilters ? ` (${view.filters.length})` : ""}
          </button>
        }
      >
        <FilterPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>

      <Dropdown
        open={sortOpen}
        onOpenChange={openSort}
        width="w-72"
        testId="sort-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openSort(!sortOpen)}
            data-testid="sort-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasSorts
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <SortAsc className="h-3 w-3" />
            Sort{hasSorts ? ` (${view.sorts.length})` : ""}
          </button>
        }
      >
        <SortPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>

      <Dropdown
        open={groupOpen}
        onOpenChange={openGroup}
        width="w-56"
        testId="group-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openGroup(!groupOpen)}
            data-testid="group-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasGroup
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <Group className="h-3 w-3" />
            Group{hasGroup ? " (1)" : ""}
          </button>
        }
      >
        <GroupPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>
    </div>
  );
}


function FilterPanel({
  dbId,
  view,
  properties,
}: {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}) {
  const addFilter = useDatabaseStore((s) => s.addFilter);
  const removeFilter = useDatabaseStore((s) => s.removeFilter);
  const updateView = useDatabaseStore((s) => s.updateView);

  const filterableProps = useMemo(
    () => properties.filter((p) => p.type !== "title"),
    [properties],
  );

  const handleAdd = useCallback(() => {
    const prop = filterableProps[0];
    if (!prop) return;
    const ops = getOperatorsForType(prop.type);
    addFilter(dbId, view.id, {
      propertyId: prop.id,
      operator: ops[0].value,
      value: "",
    });
  }, [filterableProps, addFilter, dbId, view.id]);

  const handleUpdateFilter = useCallback(
    (filterId: string, updates: { propertyId?: string; operator?: FilterOperator; value?: string }) => {
      const newFilters = view.filters.map((f) => {
        if (f.id !== filterId) return f;
        const merged = { ...f, ...updates };
        if (updates.propertyId) {
          const prop = properties.find((p) => p.id === updates.propertyId);
          if (prop) {
            const ops = getOperatorsForType(prop.type);
            merged.operator = ops[0].value;
            merged.value = "";
          }
        }
        return merged;
      });
      updateView(dbId, view.id, { filters: newFilters });
    },
    [view.filters, view.id, dbId, updateView, properties],
  );

  return (
    <div className="p-2">
      {view.filters.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/50">
          No filters applied
        </p>
      ) : (
        <div className="space-y-1.5">
          {view.filters.map((filter) => {
            const prop = properties.find((p) => p.id === filter.propertyId);
            const ops = prop ? getOperatorsForType(prop.type) : TEXT_OPS;
            const showValue = needsValueInput(filter.operator);

            const propOptions = filterableProps.map((p) => ({
              value: p.id,
              label: p.name,
              icon: <PropertyIcon type={p.type} />,
            }));

            const opOptions = ops.map((op) => ({
              value: op.value,
              label: op.label,
            }));

            return (
              <div key={filter.id} className="flex items-center gap-1" data-testid="filter-row">
                <SelectInput
                  value={filter.propertyId}
                  options={propOptions}
                  onChange={(v) => handleUpdateFilter(filter.id, { propertyId: v })}
                  testId="filter-property"
                  width="w-32"
                />

                <SelectInput
                  value={filter.operator}
                  options={opOptions}
                  onChange={(v) => handleUpdateFilter(filter.id, { operator: v as FilterOperator })}
                  testId="filter-operator"
                  width="w-36"
                />

                {showValue && (
                  <FilterValueInput
                    prop={prop}
                    value={filter.value}
                    onChange={(v) => handleUpdateFilter(filter.id, { value: v })}
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeFilter(dbId, view.id, filter.id)}
                  data-testid="filter-remove"
                  className="shrink-0 rounded p-1 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        data-testid="add-filter-btn"
        className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground"
      >
        <Plus className="h-3 w-3" />
        Add filter
      </button>
    </div>
  );
}


function FilterValueInput({
  prop,
  value,
  onChange,
}: {
  prop: DatabaseProperty | undefined;
  value: string;
  onChange: (value: string) => void;
}) {
  if (prop?.type === "checkbox") {
    return (
      <SelectInput
        value={value || "true"}
        options={[
          { value: "true", label: "Checked" },
          { value: "false", label: "Unchecked" },
        ]}
        onChange={onChange}
        testId="filter-value"
        width="w-28"
      />
    );
  }

  if (prop?.type === "select" || prop?.type === "multi_select" || prop?.type === "status") {
    return (
      <SelectInput
        value={value}
        options={[
          { value: "", label: "Select..." },
          ...(prop.options ?? []).map((opt) => ({
            value: opt.id,
            label: opt.label,
          })),
        ]}
        onChange={onChange}
        testId="filter-value"
        width="w-32"
      />
    );
  }

  return (
    <input
      type={prop?.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value..."
      className="h-7 min-w-0 flex-1 rounded-md border border-border/30 bg-muted/20 px-2 text-xs outline-none placeholder:text-muted-foreground/30"
      data-testid="filter-value"
    />
  );
}


function SortPanel({
  dbId,
  view,
  properties,
}: {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}) {
  const addSort = useDatabaseStore((s) => s.addSort);
  const removeSort = useDatabaseStore((s) => s.removeSort);
  const updateView = useDatabaseStore((s) => s.updateView);

  const sortableProps = properties;

  const handleAdd = useCallback(() => {
    const usedIds = new Set(view.sorts.map((s) => s.propertyId));
    const prop = sortableProps.find((p) => !usedIds.has(p.id));
    if (!prop) return; // all properties already have a sort rule
    addSort(dbId, view.id, { propertyId: prop.id, direction: "asc" });
  }, [sortableProps, view.sorts, addSort, dbId, view.id]);

  const handleUpdateSort = useCallback(
    (sortId: string, updates: { propertyId?: string; direction?: "asc" | "desc" }) => {
      const newSorts = view.sorts.map((s) =>
        s.id === sortId ? { ...s, ...updates } : s,
      );
      updateView(dbId, view.id, { sorts: newSorts });
    },
    [view.sorts, view.id, dbId, updateView],
  );

  const propOptions = sortableProps.map((p) => ({
    value: p.id,
    label: p.name,
    icon: <PropertyIcon type={p.type} />,
  }));

  return (
    <div className="p-2">
      {view.sorts.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/50">
          No sorts applied
        </p>
      ) : (
        <div className="space-y-1.5">
          {view.sorts.map((sort) => (
            <div key={sort.id} className="flex items-center gap-1" data-testid="sort-row">
              <SelectInput
                value={sort.propertyId}
                options={propOptions}
                onChange={(v) => handleUpdateSort(sort.id, { propertyId: v })}
                testId="sort-property"
                width="w-36"
              />

              <button
                type="button"
                onClick={() => handleUpdateSort(sort.id, { direction: sort.direction === "asc" ? "desc" : "asc" })}
                data-testid="sort-direction"
                className="flex h-7 items-center gap-1 rounded-md border border-border/30 bg-muted/20 px-2 text-xs hover:bg-muted/40 transition-colors"
              >
                {sort.direction === "asc" ? (
                  <><ArrowDownAZ className="h-3 w-3" /> A→Z</>
                ) : (
                  <><ArrowUpZA className="h-3 w-3" /> Z→A</>
                )}
              </button>

              <button
                type="button"
                onClick={() => removeSort(dbId, view.id, sort.id)}
                data-testid="sort-remove"
                className="shrink-0 rounded p-1 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        data-testid="add-sort-btn"
        className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground"
      >
        <Plus className="h-3 w-3" />
        Add sort
      </button>
    </div>
  );
}


function GroupPanel({
  dbId,
  view,
  properties,
}: {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}) {
  const updateView = useDatabaseStore((s) => s.updateView);

  const groupableProps = properties.filter((p) =>
    ["select", "multi_select", "status", "checkbox"].includes(p.type),
  );

  return (
    <div className="p-2">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Group by
      </p>

      <button
        type="button"
        onClick={() => updateView(dbId, view.id, { groupBy: undefined })}
        data-testid="group-none"
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 ${
          !view.groupBy ? "bg-muted/30 text-primary font-medium" : "text-foreground/80"
        }`}
      >
        <X className="h-3 w-3 text-muted-foreground/40" />
        None
      </button>

      {groupableProps.map((prop) => (
        <button
          key={prop.id}
          type="button"
          onClick={() => updateView(dbId, view.id, { groupBy: prop.id })}
          data-testid={`group-by-${prop.name.toLowerCase().replace(/\s+/g, "-")}`}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 ${
            view.groupBy === prop.id ? "bg-muted/30 text-primary font-medium" : "text-foreground/80"
          }`}
        >
          <PropertyIcon type={prop.type} />
          {prop.name}
        </button>
      ))}

      {groupableProps.length === 0 && (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/40">
          Add a Select or Checkbox column to enable grouping
        </p>
      )}
    </div>
  );
}
