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
import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { BOARD_CARD_WIDTH } from "@/lib/constants";
import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseRow } from "@/types/database";
import { BoardColumn } from "./board-column";
import { processRows } from "./data-processing";
import { FilterSortBar } from "./filter-sort-bar";

interface BoardViewProps {
  database: Database;
}

export function BoardView({ database }: BoardViewProps) {
  const updateCell = useDatabaseStore((s) => s.updateCell);
  const addRow = useDatabaseStore((s) => s.addRow);

  const view = database.views.find((v) => v.id === database.activeViewId) ?? database.views[0];
  if (!view) return null;

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
        style={{ minWidth: columns.length * BOARD_CARD_WIDTH }}
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
