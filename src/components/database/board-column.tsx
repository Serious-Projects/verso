"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import type { DatabaseProperty, DatabaseRow } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { BoardCard } from "./board-card";

export const COLUMN_BG: Record<string, string> = {
  gray: "bg-zinc-50/50 dark:bg-zinc-900/20",
  brown: "bg-amber-50/30 dark:bg-amber-950/15",
  orange: "bg-orange-50/30 dark:bg-orange-950/15",
  yellow: "bg-yellow-50/30 dark:bg-yellow-950/15",
  green: "bg-emerald-50/30 dark:bg-emerald-950/15",
  blue: "bg-blue-50/30 dark:bg-blue-950/15",
  purple: "bg-violet-50/30 dark:bg-violet-950/15",
  pink: "bg-pink-50/30 dark:bg-pink-950/15",
  red: "bg-red-50/30 dark:bg-red-950/15",
};

export const COLUMN_TOP_BORDER: Record<string, string> = {
  gray: "border-t-zinc-300 dark:border-t-zinc-600",
  brown: "border-t-amber-400 dark:border-t-amber-700",
  orange: "border-t-orange-400 dark:border-t-orange-600",
  yellow: "border-t-yellow-400 dark:border-t-yellow-600",
  green: "border-t-emerald-400 dark:border-t-emerald-600",
  blue: "border-t-blue-400 dark:border-t-blue-600",
  purple: "border-t-violet-400 dark:border-t-violet-600",
  pink: "border-t-pink-400 dark:border-t-pink-600",
  red: "border-t-red-400 dark:border-t-red-600",
};

export const BUTTON_FILL: Record<string, string> = {
  gray: "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
  brown:
    "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
  orange:
    "bg-orange-50 text-orange-500 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50",
  yellow:
    "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50",
  green:
    "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
  blue: "bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
  purple:
    "bg-violet-50 text-violet-500 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50",
  pink: "bg-pink-50 text-pink-500 hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50",
  red: "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
};

export interface BoardColumnProps {
  id: string;
  label: string;
  color: string;
  rows: DatabaseRow[];
  titleProp: DatabaseProperty | undefined;
  cardProps: DatabaseProperty[];
  allProperties: DatabaseProperty[];
  onAddCard: () => void;
  expanded?: boolean;
}

export function BoardColumn({
  id,
  label,
  color,
  rows,
  titleProp,
  cardProps,
  allProperties,
  onAddCard,
  expanded,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colorDef = SELECT_COLORS.find((c) => c.value === color) ?? SELECT_COLORS[0];
  const topBorder = COLUMN_TOP_BORDER[color] ?? "border-t-zinc-300 dark:border-t-zinc-600";

  return (
    <div
      ref={setNodeRef}
      className={`flex shrink-0 flex-col rounded-xl border-t-2 ${topBorder} transition-colors ${
        expanded ? "w-72" : "w-60"
      } ${isOver ? "ring-1 ring-primary/20" : ""} ${COLUMN_BG[color] ?? COLUMN_BG.gray}`}
      data-testid="board-column"
    >
      <div className="flex items-center gap-2 px-2.5 py-2.5">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${colorDef.bg} ${colorDef.text}`}
        >
          {label}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground/35">{rows.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-1.5 pb-2 min-h-16">
        {rows.map((row) => (
          <BoardCard
            key={row.id}
            row={row}
            color={color}
            titleProp={titleProp}
            cardProps={cardProps}
            allProperties={allProperties}
          />
        ))}
      </div>

      {/* Add card */}
      <button
        type="button"
        onClick={onAddCard}
        data-testid="board-add-card"
        className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors mx-1.5 mb-2 ${BUTTON_FILL[color] ?? BUTTON_FILL.gray}`}
      >
        <Plus className="h-3 w-3" />
        New
      </button>
    </div>
  );
}
