"use client";

import { useCallback } from "react";

import { useCellEditor } from "@/hooks/use-cell-editor";
import { useDatabaseStore } from "@/stores/database-store";

export function NumberCell({
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

  const toDraft = useCallback(() => value?.toString() ?? "", [value]);
  const onCommit = useCallback(
    (draft: string) => {
      const num = draft.trim() ? Number(draft) : null;
      updateCell(dbId, rowId, propertyId, num !== null && isNaN(num) ? null : num);
    },
    [dbId, rowId, propertyId, updateCell],
  );

  const { editing, draft, setDraft, inputRef, startEditing, commit, handleKeyDown } =
    useCellEditor({ toDraft, onCommit });

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        data-testid="cell-input-number"
        className="h-full w-full bg-transparent px-2 py-1 text-sm tabular-nums outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      data-testid="cell-number"
      className={`h-full w-full cursor-text truncate px-2 py-1 text-left text-sm tabular-nums ${
        value !== null ? "text-foreground" : "text-muted-foreground/30"
      }`}
    >
      {value !== null ? value : ""}
    </button>
  );
}
