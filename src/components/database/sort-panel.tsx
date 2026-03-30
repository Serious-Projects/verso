"use client";

import { ArrowDownAZ, ArrowUpZA, Plus, X } from "lucide-react";
import { useCallback } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { DatabaseProperty, DatabaseView } from "@/types/database";
import { PropertyIcon } from "./property-icon";
import { SelectInput } from "./select-input";

interface SortPanelProps {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}

export function SortPanel({ dbId, view, properties }: SortPanelProps) {
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
      const newSorts = view.sorts.map((s) => (s.id === sortId ? { ...s, ...updates } : s));
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
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/50">No sorts applied</p>
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
                onClick={() =>
                  handleUpdateSort(sort.id, {
                    direction: sort.direction === "asc" ? "desc" : "asc",
                  })
                }
                data-testid="sort-direction"
                className="flex h-7 items-center gap-1 rounded-md border border-border/30 bg-muted/20 px-2 text-xs hover:bg-muted/40 transition-colors"
              >
                {sort.direction === "asc" ? (
                  <>
                    <ArrowDownAZ className="h-3 w-3" /> A→Z
                  </>
                ) : (
                  <>
                    <ArrowUpZA className="h-3 w-3" /> Z→A
                  </>
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
