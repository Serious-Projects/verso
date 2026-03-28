"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Maximize2, Minimize2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseProperty, DatabaseRow, SelectOption } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { processRows } from "./data-processing";
import { FilterSortBar } from "./filter-sort-bar";

interface BoardViewProps {
  database: Database;
}

export function BoardView({ database }: BoardViewProps) {
  const updateCell = useDatabaseStore((s) => s.updateCell);
  const addRow = useDatabaseStore((s) => s.addRow);

  const view = database.views.find((v) => v.id === database.activeViewId) ?? database.views[0];

  // Find the grouping property — prefer view.groupBy, fallback to first select/status column
  const groupProperty = useMemo(() => {
    if (view.groupBy) {
      return database.properties.find((p) => p.id === view.groupBy) ?? null;
    }
    return database.properties.find((p) => p.type === "select" || p.type === "status") ?? null;
  }, [database.properties, view.groupBy]);

  // Process rows through filter + sort pipeline (no grouping — board handles its own)
  const { rows: filteredRows } = useMemo(
    () => processRows(database.rows, { ...view, groupBy: undefined }, database.properties),
    [database.rows, database.properties, view],
  );

  // Build columns from the group property options
  const columns = useMemo(() => {
    if (!groupProperty) return [];
    const options = groupProperty.options ?? [];
    return [
      ...options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        color: opt.color,
        rows: filteredRows.filter((r) => r.cells[groupProperty.id] === opt.id),
      })),
      {
        id: "_none",
        label: "No status",
        color: "gray",
        rows: filteredRows.filter((r) => {
          const val = r.cells[groupProperty.id];
          return val === null || val === "" || val === undefined;
        }),
      },
    ];
  }, [groupProperty, filteredRows]);

  // Title property for card display
  const titleProp = database.properties.find((p) => p.type === "title");

  // Visible properties for card preview (exclude title and group property)
  const cardProps = useMemo(
    () =>
      database.properties
        .filter((p) => p.type !== "title" && p.id !== groupProperty?.id)
        .slice(0, 3),
    [database.properties, groupProperty],
  );

  // DnD
  const [draggedRow, setDraggedRow] = useState<DatabaseRow | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const row = filteredRows.find((r) => r.id === event.active.id);
      if (row) setDraggedRow(row);
    },
    [filteredRows],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedRow(null);
      const { active, over } = event;
      if (!over || !groupProperty) return;

      const rowId = active.id as string;
      const targetColId = over.id as string;

      // Determine the new value — "_none" means null
      const newValue = targetColId === "_none" ? null : targetColId;
      updateCell(database.id, rowId, groupProperty.id, newValue);
    },
    [groupProperty, updateCell, database.id],
  );

  const handleAddCard = useCallback(
    (columnId: string) => {
      const rowId = addRow(database.id);
      if (rowId && groupProperty && columnId !== "_none") {
        updateCell(database.id, rowId, groupProperty.id, columnId);
      }
    },
    [addRow, updateCell, database.id, groupProperty],
  );

  const [expanded, setExpanded] = useState(false);

  // Close expanded modal on Escape
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expanded]);

  if (!groupProperty) {
    return (
      <div
        className="flex items-center justify-center px-4 py-12 text-sm text-muted-foreground/50"
        data-testid="board-no-property"
      >
        Add a Select or Status column to use Board view
      </div>
    );
  }

  const boardContent = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`flex gap-4 px-4 pb-4 pt-2 ${expanded ? "min-h-[70vh] gap-6" : ""}`}
        style={{ minWidth: columns.length * 280 }}
      >
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            rows={col.rows}
            titleProp={titleProp}
            cardProps={cardProps}
            allProperties={database.properties}
            onAddCard={() => handleAddCard(col.id)}
            expanded={expanded}
          />
        ))}
      </div>

      <DragOverlay>
        {draggedRow && titleProp ? (
          <div className="w-60 rounded-lg border border-border/30 bg-background p-3 shadow-xl opacity-90">
            <p className="text-sm font-medium truncate">
              {(draggedRow.cells[titleProp.id] as string) || "Untitled"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  // Expanded full-screen modal
  if (expanded) {
    return createPortal(
      <div
        className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
        data-testid="board-expanded"
      >
        {/* Modal header */}
        <div className="flex items-center gap-3 border-b border-border/20 px-6 py-4">
          <span className="text-xl font-bold tracking-tight">
            {database.title || "Untitled Database"}
          </span>
          <div className="flex-1" />
          <FilterSortBar dbId={database.id} view={view} properties={database.properties} />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            data-testid="board-collapse-btn"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            Collapse
          </button>
        </div>
        {/* Board content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4">{boardContent}</div>
      </div>,
      document.body,
    );
  }

  // Inline board
  return (
    <div data-testid="board-view">
      <div className="flex items-center">
        <div className="flex-1">
          <FilterSortBar dbId={database.id} view={view} properties={database.properties} />
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          data-testid="board-expand-btn"
          className="mr-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <Maximize2 className="h-3 w-3" />
          Expand
        </button>
      </div>
      <div className="overflow-x-auto">{boardContent}</div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

function BoardColumn({
  id,
  label,
  color,
  rows,
  titleProp,
  cardProps,
  allProperties,
  onAddCard,
  expanded,
}: {
  id: string;
  label: string;
  color: string;
  rows: DatabaseRow[];
  titleProp: DatabaseProperty | undefined;
  cardProps: DatabaseProperty[];
  allProperties: DatabaseProperty[];
  onAddCard: () => void;
  expanded?: boolean;
}) {
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
      <div className="flex flex-col gap-2 px-1.5 pb-2 min-h-15">
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

const COLUMN_BG: Record<string, string> = {
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

const COLUMN_TOP_BORDER: Record<string, string> = {
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

const BUTTON_FILL: Record<string, string> = {
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

const ACCENT_BORDER_COLORS: Record<string, string> = {
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

function BoardCard({
  row,
  color,
  titleProp,
  cardProps,
  allProperties,
}: {
  row: DatabaseRow;
  color: string;
  titleProp: DatabaseProperty | undefined;
  cardProps: DatabaseProperty[];
  allProperties: DatabaseProperty[];
}) {
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
    <span className="text-[10px] text-muted-foreground/60 truncate max-w-30">{String(value)}</span>
  );
}
