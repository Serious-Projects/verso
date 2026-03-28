"use client";

import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { DatabaseProperty, PropertyType } from "@/types/database";
import { Dropdown, SubMenu } from "./dropdown";
import { PropertyIcon, PROPERTY_TYPE_LABELS } from "./property-icon";

const ADDABLE_TYPES: PropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "checkbox",
  "url",
  "email",
  "phone",
  "status",
];

interface ColumnHeaderProps {
  dbId: string;
  property: DatabaseProperty;
}

export function ColumnHeader({ dbId, property }: ColumnHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(property.name);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const updateProperty = useDatabaseStore((s) => s.updateProperty);
  const deleteProperty = useDatabaseStore((s) => s.deleteProperty);

  const inputRef = useRef<HTMLInputElement>(null);
  const isTitle = property.type === "title";

  useEffect(() => {
    if (renaming) {
      setNameVal(property.name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [renaming, property.name]);

  const commitRename = useCallback(() => {
    if (nameVal.trim()) {
      updateProperty(dbId, property.id, { name: nameVal.trim() });
    }
    setRenaming(false);
  }, [nameVal, updateProperty, dbId, property.id]);

  const handleChangeType = useCallback(
    (newType: PropertyType) => {
      updateProperty(dbId, property.id, {
        type: newType,
        options: newType === "select" || newType === "multi_select" || newType === "status" ? [] : undefined,
      });
      setShowTypeMenu(false);
      setMenuOpen(false);
    },
    [updateProperty, dbId, property.id],
  );

  return (
    <div className="group/col flex h-full items-center gap-1 px-2">
      <PropertyIcon type={property.type} />

      {renaming ? (
        <input
          ref={inputRef}
          type="text"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          data-testid="column-rename-input"
          className="min-w-0 flex-1 bg-transparent text-xs font-medium outline-none"
        />
      ) : (
        <Dropdown
          open={menuOpen && !isTitle}
          onOpenChange={(v) => { setMenuOpen(v); if (!v) setShowTypeMenu(false); }}
          width="w-52"
          testId="column-menu"
          className="min-w-0 flex-1"
          trigger={
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              data-testid={`column-header-${property.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-medium text-muted-foreground"
            >
              <span className="truncate">{property.name}</span>
              {!isTitle && (
                <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-0 group-hover/col:opacity-60 transition-opacity" />
              )}
            </button>
          }
        >
          <div className="p-1.5">
            {/* Rename */}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setRenaming(true); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              Rename
            </button>

            {/* Change type */}
            <SubMenu
              open={showTypeMenu}
              onOpenChange={setShowTypeMenu}
              testId="type-menu"
              trigger={
                <button
                  type="button"
                  onClick={() => setShowTypeMenu((v) => !v)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <PropertyIcon type={property.type} />
                  <span>Type: {PROPERTY_TYPE_LABELS[property.type]}</span>
                  <ChevronDown className="ml-auto h-3 w-3 text-muted-foreground/50" />
                </button>
              }
            >
              {ADDABLE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChangeType(t)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 ${
                    t === property.type ? "bg-muted/40 text-primary" : ""
                  }`}
                >
                  <PropertyIcon type={t} />
                  {PROPERTY_TYPE_LABELS[t]}
                </button>
              ))}
            </SubMenu>

            <div className="my-1 border-t border-border/30" />

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                deleteProperty(dbId, property.id);
                setMenuOpen(false);
              }}
              data-testid="column-delete"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete property
            </button>
          </div>
        </Dropdown>
      )}
    </div>
  );
}

// --- Add Column Button ---
export function AddColumnButton({ dbId }: { dbId: string }) {
  const [open, setOpen] = useState(false);
  const addProperty = useDatabaseStore((s) => s.addProperty);

  const handleAdd = useCallback(
    (type: PropertyType) => {
      addProperty(dbId, PROPERTY_TYPE_LABELS[type], type);
      setOpen(false);
    },
    [addProperty, dbId],
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      align="right"
      width="w-44"
      testId="add-column-menu"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid="add-column-btn"
          className="flex h-full items-center justify-center px-3 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
          title="Add a property"
        >
          +
        </button>
      }
    >
      <div className="p-1">
        {ADDABLE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleAdd(t)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
          >
            <PropertyIcon type={t} />
            {PROPERTY_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
