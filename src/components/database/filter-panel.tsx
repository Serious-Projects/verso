"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useMemo } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type {
  DatabaseProperty,
  DatabaseView,
  FilterOperator,
  PropertyType,
} from "@/types/database";
import { PropertyIcon } from "./property-icon";
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

const CHECKBOX_OPS: OpConfig[] = [{ value: "equals", label: "Is" }];

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

interface FilterPanelProps {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}

export function FilterPanel({ dbId, view, properties }: FilterPanelProps) {
  const addFilter = useDatabaseStore((s) => s.addFilter);
  const removeFilter = useDatabaseStore((s) => s.removeFilter);
  const updateView = useDatabaseStore((s) => s.updateView);

  const filterableProps = useMemo(() => properties.filter((p) => p.type !== "title"), [properties]);

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
    (
      filterId: string,
      updates: { propertyId?: string; operator?: FilterOperator; value?: string },
    ) => {
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
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/50">No filters applied</p>
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
