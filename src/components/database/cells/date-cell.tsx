"use client";

import { useDatabaseStore } from "@/stores/database-store";
import { DatePicker } from "../date-picker";

export function DateCell({
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
