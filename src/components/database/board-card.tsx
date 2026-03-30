"use client";

import { useDraggable } from "@dnd-kit/core";

import type { DatabaseProperty, DatabaseRow } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";

export const ACCENT_BORDER_COLORS: Record<string, string> = {
  gray: "border-l-zinc-400",
  brown: "border-l-amber-600",
  orange: "border-l-orange-500",
  yellow: "border-l-yellow-500",
  green: "border-l-emerald-500",
  blue: "border-l-blue-500",
  purple: "border-l-violet-500",
  pink: "border-l-pink-500",
  red: "border-l-red-500",
};

export interface BoardCardProps {
  row: DatabaseRow;
  color: string;
  titleProp: DatabaseProperty | undefined;
  cardProps: DatabaseProperty[];
  allProperties: DatabaseProperty[];
}

export function BoardCard({ row, color, titleProp, cardProps, allProperties }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: row.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const title = titleProp ? (row.cells[titleProp.id] as string) || "Untitled" : "Untitled";
  const accentBorder = ACCENT_BORDER_COLORS[color] ?? "border-l-zinc-400";

  const visibleProps = cardProps.filter((prop) => {
    const val = row.cells[prop.id];
    return (
      val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)
    );
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      data-testid="board-card"
      className={`group/card rounded-lg border border-border/10 border-l-2 ${accentBorder} bg-background cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-border/25 hover:shadow-md hover:-translate-y-px ${
        isDragging ? "opacity-25 scale-[0.97]" : "shadow-sm"
      }`}
    >
      {/* Title */}
      <div className="px-3 pt-2.5 pb-1">
        <p
          className={`text-[13px] font-medium leading-snug tracking-tight ${
            title === "Untitled" ? "text-muted-foreground/30 italic" : "text-foreground"
          }`}
        >
          {title}
        </p>
      </div>

      {/* Properties */}
      {visibleProps.length > 0 && (
        <div className="px-3 pb-2.5 pt-1 flex flex-wrap items-center gap-1.5">
          {visibleProps.map((prop) => (
            <CardPropertyValue
              key={prop.id}
              property={prop}
              value={row.cells[prop.id]}
              allProperties={allProperties}
            />
          ))}
        </div>
      )}

      {/* Empty card — just title padding */}
      {visibleProps.length === 0 && <div className="pb-1" />}
    </div>
  );
}

function CardPropertyValue({
  property,
  value,
  allProperties,
}: {
  property: DatabaseProperty;
  value: unknown;
  allProperties: DatabaseProperty[];
}) {
  if (property.type === "checkbox") {
    return value === true ? <span className="text-[10px] text-emerald-500">✓</span> : null;
  }

  if (property.type === "select" || property.type === "status") {
    const opt = (property.options ?? []).find((o) => o.id === value);
    if (!opt) return null;
    const colorDef = SELECT_COLORS.find((c) => c.value === opt.color) ?? SELECT_COLORS[0];
    return (
      <span
        className={`inline-flex items-center rounded-sm px-1 py-0.5 text-[10px] font-medium ${colorDef.bg} ${colorDef.text}`}
      >
        {opt.label}
      </span>
    );
  }

  if (property.type === "multi_select") {
    return (
      <>
        {((value as string[]) ?? []).map((optId) => {
          const opt = (property.options ?? []).find((o) => o.id === optId);
          if (!opt) return null;
          const colorDef = SELECT_COLORS.find((c) => c.value === opt.color) ?? SELECT_COLORS[0];
          return (
            <span
              key={optId}
              className={`inline-flex items-center rounded-sm px-1 py-0.5 text-[10px] font-medium ${colorDef.bg} ${colorDef.text}`}
            >
              {opt.label}
            </span>
          );
        })}
      </>
    );
  }

  if (property.type === "date") {
    return (
      <span className="text-[10px] text-muted-foreground/60">
        {new Date((value as string) + "T00:00:00").toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }

  // Text, number, url, email, phone
  return (
    <span className="text-[10px] text-muted-foreground/60 truncate max-w-32">{String(value)}</span>
  );
}
