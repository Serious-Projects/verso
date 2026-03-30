"use client";

import { Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { DatabaseProperty } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { Dropdown } from "../dropdown";
import { SelectTag } from "./select-tag";

export function MultiSelectCell({
  dbId,
  rowId,
  property,
  value,
}: {
  dbId: string;
  rowId: string;
  property: DatabaseProperty;
  value: string[] | null;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);
  const addSelectOption = useDatabaseStore((s) => s.addSelectOption);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const options = property.options ?? [];
  const selectedIds = value ?? [];
  const selectedOptions = options.filter((o) => selectedIds.includes(o.id));
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const toggleOption = useCallback(
    (optId: string) => {
      const next = selectedIds.includes(optId)
        ? selectedIds.filter((id) => id !== optId)
        : [...selectedIds, optId];
      updateCell(dbId, rowId, property.id, next);
    },
    [selectedIds, updateCell, dbId, rowId, property.id],
  );

  const handleCreateOption = useCallback(() => {
    if (!search.trim()) return;
    const colorIdx = options.length % SELECT_COLORS.length;
    const color = SELECT_COLORS[colorIdx].value;
    const newId = addSelectOption(dbId, property.id, search.trim(), color);
    if (newId) {
      updateCell(dbId, rowId, property.id, [...selectedIds, newId]);
    }
    setSearch("");
  }, [search, options.length, addSelectOption, updateCell, dbId, rowId, property.id, selectedIds]);

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      center={false}
      testId="multi-select-dropdown"
      trigger={
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="cell-multi-select"
          className="flex h-full w-full items-center gap-1 overflow-hidden px-2 py-1"
        >
          {selectedOptions.map((opt) => (
            <SelectTag key={opt.id} option={opt} />
          ))}
        </button>
      }
    >
      <div className="p-1.5">
        {selectedOptions.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {selectedOptions.map((opt) => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <SelectTag option={opt} />
                <button
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length === 0) handleCreateOption();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search or create..."
          className="w-full rounded-md bg-muted/40 px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground/40"
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        {filtered.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggleOption(opt.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
          >
            <SelectTag option={opt} />
            {selectedIds.includes(opt.id) && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
        {filtered.length === 0 && search.trim() && (
          <button
            type="button"
            onClick={handleCreateOption}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <Plus className="h-3.5 w-3.5" />
            Create &quot;{search.trim()}&quot;
          </button>
        )}
      </div>
    </Dropdown>
  );
}
