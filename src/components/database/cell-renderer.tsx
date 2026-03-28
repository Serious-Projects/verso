"use client";

import { Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { CellValue, DatabaseProperty, SelectOption } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { DatePicker } from "./date-picker";
import { Dropdown } from "./dropdown";

interface CellRendererProps {
  dbId: string;
  rowId: string;
  property: DatabaseProperty;
  value: CellValue;
}

export function CellRenderer({ dbId, rowId, property, value }: CellRendererProps) {
  switch (property.type) {
    case "title":
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <TextCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as string | null}
          type={property.type}
        />
      );
    case "number":
      return (
        <NumberCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as number | null}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell dbId={dbId} rowId={rowId} propertyId={property.id} value={value as boolean} />
      );
    case "select":
    case "status":
      return (
        <SelectCell dbId={dbId} rowId={rowId} property={property} value={value as string | null} />
      );
    case "multi_select":
      return (
        <MultiSelectCell
          dbId={dbId}
          rowId={rowId}
          property={property}
          value={value as string[] | null}
        />
      );
    case "date":
      return (
        <DateCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as string | null}
        />
      );
    default:
      return <span className="text-muted-foreground/40 text-xs">—</span>;
  }
}

// --- Text Cell ---
function TextCell({
  dbId,
  rowId,
  propertyId,
  value,
  type,
}: {
  dbId: string;
  rowId: string;
  propertyId: string;
  value: string | null;
  type: string;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, value]);

  const commit = useCallback(() => {
    updateCell(dbId, rowId, propertyId, draft || null);
    setEditing(false);
  }, [dbId, rowId, propertyId, draft, updateCell]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type === "email" ? "email" : type === "url" ? "url" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        data-testid={`cell-input-${type}`}
        className="h-full w-full bg-transparent px-2 py-1 text-sm outline-none"
      />
    );
  }

  const display = value ?? "";
  const isTitle = type === "title";

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      data-testid={`cell-${type}`}
      className={`h-full w-full cursor-text truncate px-2 py-1 text-left text-sm ${
        isTitle ? "font-medium" : ""
      } ${display ? "text-foreground" : "text-muted-foreground/30"}`}
    >
      {display || (isTitle ? "Untitled" : "")}
    </button>
  );
}

// --- Number Cell ---
function NumberCell({
  dbId,
  rowId,
  propertyId,
  value,
}: {
  dbId: string;
  rowId: string;
  propertyId: string;
  value: number | null;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value?.toString() ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, value]);

  const commit = useCallback(() => {
    const num = draft.trim() ? Number(draft) : null;
    updateCell(dbId, rowId, propertyId, num !== null && isNaN(num) ? null : num);
    setEditing(false);
  }, [dbId, rowId, propertyId, draft, updateCell]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        data-testid="cell-input-number"
        className="h-full w-full bg-transparent px-2 py-1 text-sm tabular-nums outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      data-testid="cell-number"
      className={`h-full w-full cursor-text truncate px-2 py-1 text-left text-sm tabular-nums ${
        value !== null ? "text-foreground" : "text-muted-foreground/30"
      }`}
    >
      {value !== null ? value : ""}
    </button>
  );
}

// --- Checkbox Cell ---
function CheckboxCell({
  dbId,
  rowId,
  propertyId,
  value,
}: {
  dbId: string;
  rowId: string;
  propertyId: string;
  value: boolean;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);

  return (
    <div className="flex h-full items-center justify-center px-2 py-1">
      <button
        type="button"
        onClick={() => updateCell(dbId, rowId, propertyId, !value)}
        data-testid="cell-checkbox"
        className={`flex h-4.5 w-4.5 items-center justify-center rounded-[5px] transition-all duration-200 ${
          value
            ? "bg-primary/90 text-primary-foreground shadow-sm"
            : "border border-border/60 hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        {value && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// --- Date Cell ---
function DateCell({
  dbId,
  rowId,
  propertyId,
  value,
}: {
  dbId: string;
  rowId: string;
  propertyId: string;
  value: string | null;
}) {
  const updateCell = useDatabaseStore((s) => s.updateCell);

  return (
    <DatePicker
      value={value}
      onChange={(v: string | null) => updateCell(dbId, rowId, propertyId, v)}
      testId="cell-date"
    />
  );
}

// --- Select Cell ---
function SelectCell({
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

// --- Multi-Select Cell ---
function MultiSelectCell({
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

// --- Shared: Select Tag ---
function SelectTag({ option }: { option: SelectOption }) {
  const colorDef = SELECT_COLORS.find((c) => c.value === option.color) ?? SELECT_COLORS[0];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${colorDef.bg} ${colorDef.text}`}
      data-testid="select-tag"
    >
      {option.label}
    </span>
  );
}
