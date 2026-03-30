"use client";

import { useDatabaseStore } from "@/stores/database-store";

export function CheckboxCell({
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
