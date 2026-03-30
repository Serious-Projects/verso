"use client";

import type { SelectOption } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";

export function SelectTag({ option }: { option: SelectOption }) {
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
