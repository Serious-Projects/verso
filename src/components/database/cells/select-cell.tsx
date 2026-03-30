"use client";

import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { DatabaseProperty } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { Dropdown } from "../dropdown";
import { SelectTag } from "./select-tag";

export function SelectCell({
  dbId,
  rowId,
  property,
  value,
}: {
  dbId: string;
  rowId: string;
  property: DatabaseProperty;
  value: string | null;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);
  const addSelectOption = useDatabaseStore((s) => s.addSelectOption);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const options = property.options ?? [];
  const selected = options.find((o) => o.id === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleCreateOption = useCallback(() => {
    if (!search.trim()) return;
    const colorIdx = options.length % SELECT_COLORS.length;
    const color = SELECT_COLORS[colorIdx].value;
    const newId = addSelectOption(dbId, property.id, search.trim(), color);
    if (newId) {
      updateCell(dbId, rowId, property.id, newId);
    }
    setOpen(false);
  }, [search, options.length, addSelectOption, updateCell, dbId, rowId, property.id]);

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      center={false}
      testId="select-dropdown"
      trigger={
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="cell-select"
          className="flex h-full w-full items-center px-2 py-1"
        >
          {selected ? <SelectTag option={selected} /> : null}
        </button>
      }
    >
      <div className="p-1.5">
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
            onClick={() => {
              updateCell(dbId, rowId, property.id, opt.id === value ? null : opt.id);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
          >
            <SelectTag option={opt} />
            {opt.id === value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
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
