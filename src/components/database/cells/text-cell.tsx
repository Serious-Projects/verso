"use client";

import { useCallback } from "react";

import { useCellEditor } from "@/hooks/use-cell-editor";
import { useDatabaseStore } from "@/stores/database-store";

export function TextCell({
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

  const toDraft = useCallback(() => value ?? "", [value]);
  const onCommit = useCallback(
    (draft: string) => updateCell(dbId, rowId, propertyId, draft || null),
    [dbId, rowId, propertyId, updateCell],
  );

  const { editing, draft, setDraft, inputRef, startEditing, commit, handleKeyDown } =
    useCellEditor({ toDraft, onCommit });

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type === "email" ? "email" : type === "url" ? "url" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
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
      onClick={startEditing}
      data-testid={`cell-${type}`}
      className={`h-full w-full cursor-text truncate px-2 py-1 text-left text-sm ${
        isTitle ? "font-medium" : ""
      } ${display ? "text-foreground" : "text-muted-foreground/30"}`}
    >
      {display || (isTitle ? "Untitled" : "")}
    </button>
  );
}
