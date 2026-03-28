"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseRow } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { CellRenderer } from "./cell-renderer";
import { AddColumnButton, ColumnHeader } from "./column-header";
import { processRows, type RowGroup } from "./data-processing";
import { FilterSortBar } from "./filter-sort-bar";

const columnHelper = createColumnHelper<DatabaseRow>();
const MIN_COL_WIDTH = 80;

interface TableViewProps {
  database: Database;
}

export function TableView({ database }: TableViewProps) {
  const addRow = useDatabaseStore((s) => s.addRow);
  const deleteRow = useDatabaseStore((s) => s.deleteRow);
  const resizeProperty = useDatabaseStore((s) => s.resizeProperty);

  const view = database.views[0];
  const tableRef = useRef<HTMLTableElement>(null);

  // Process data through filter → sort → group pipeline
  const { rows: processedRows, groups } = useMemo(
    () => processRows(database.rows, view, database.properties),
    [database.rows, database.properties, view],
  );

  const columns = useMemo(() => {
    const visibleProps = view
      ? database.properties.filter((p) => view.visiblePropertyIds.includes(p.id))
      : database.properties;

    return [
      columnHelper.display({
        id: "_actions",
        size: 32,
        header: () => null,
        cell: ({ row }) => (
          <div className="flex h-full items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => deleteRow(database.id, row.original.id)}
              data-testid="row-delete-btn"
              className="rounded p-0.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ),
      }),
      ...visibleProps.map((prop) =>
        columnHelper.accessor((row) => row.cells[prop.id], {
          id: prop.id,
          size: view?.propertyWidths[prop.id] ?? prop.width ?? 200,
          header: () => <ColumnHeader dbId={database.id} property={prop} />,
          cell: ({ row }) => (
            <CellRenderer
              dbId={database.id}
              rowId={row.original.id}
              property={prop}
              value={row.original.cells[prop.id]}
            />
          ),
        }),
      ),
      columnHelper.display({
        id: "_add_column",
        size: 44,
        header: () => <AddColumnButton dbId={database.id} />,
        cell: () => null,
      }),
    ];
  }, [database, view, deleteRow]);

  // Use processed (ungrouped) rows for the flat table
  const tableData = groups ? [] as DatabaseRow[] : processedRows;

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleResizeStart = useCallback(
    (propertyId: string, colIndex: number, startX: number, startWidth: number) => {
      const tableEl = tableRef.current;
      if (!tableEl) return;

      const cells: HTMLElement[] = [];
      const rows = tableEl.querySelectorAll("tr");
      rows.forEach((row) => {
        const cell = row.children[colIndex] as HTMLElement | undefined;
        if (cell) cells.push(cell);
      });

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      let finalWidth = startWidth;

      const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        finalWidth = Math.max(startWidth + delta, MIN_COL_WIDTH);
        const px = `${finalWidth}px`;
        for (let i = 0; i < cells.length; i++) {
          cells[i].style.width = px;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        resizeProperty(database.id, propertyId, finalWidth);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [database.id, resizeProperty],
  );

  const colCount = columns.length;

  return (
    <div className="w-full" data-testid="database-table">
      {/* Filter / Sort / Group toolbar */}
      <FilterSortBar dbId={database.id} view={view} properties={database.properties} />

      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border/30">
                {headerGroup.headers.map((header, colIndex) => {
                  const isResizable = header.id !== "_actions" && header.id !== "_add_column";
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        minWidth: header.id === "_actions" ? 32 : MIN_COL_WIDTH,
                      }}
                      className="relative h-8 border-r border-border/20 text-left font-normal last:border-r-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {isResizable && (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResizeStart(header.id, colIndex, e.clientX, header.getSize());
                          }}
                          className="absolute -right-0.5 top-0 z-10 h-full w-2 cursor-col-resize group/resize"
                          data-testid="column-resize-handle"
                        >
                          <div className="mx-auto h-full w-0.5 opacity-0 group-hover/resize:opacity-100 bg-primary/40 transition-opacity" />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body — grouped or flat */}
          <tbody>
            {groups ? (
              groups.map((group) => (
                <GroupSection
                  key={group.key}
                  group={group}
                  columns={columns}
                  colCount={colCount}
                />
              ))
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group/row border-b border-border/15 hover:bg-muted/20 transition-colors"
                  data-testid="database-row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="h-9 border-r border-border/15 last:border-r-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={() => addRow(database.id)}
        data-testid="add-row-btn"
        className="flex w-full items-center gap-2 border-b border-border/15 px-3 py-1.5 text-sm text-muted-foreground/50 hover:bg-muted/20 hover:text-muted-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>
    </div>
  );
}

// ─── Group section with collapsible rows ────────────────────────────────────

function GroupSection({
  group,
  columns,
  colCount,
}: {
  group: RowGroup;
  columns: Parameters<typeof useReactTable<DatabaseRow>>[0]["columns"];
  colCount: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const colorDef = SELECT_COLORS.find((c) => c.value === group.color) ?? SELECT_COLORS[0];

  // Build a mini table for group rows
  const table = useReactTable({
    data: group.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Group header */}
      <tr className="border-b border-border/20" data-testid="group-header">
        <td colSpan={colCount} className="px-3 py-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2"
            data-testid="group-toggle"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform ${
                collapsed ? "" : "rotate-90"
              }`}
            />
            <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${colorDef.bg} ${colorDef.text}`}>
              {group.label}
            </span>
            <span className="text-[11px] text-muted-foreground/40">{group.rows.length}</span>
          </button>
        </td>
      </tr>

      {/* Group rows */}
      {!collapsed &&
        table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="group/row border-b border-border/15 hover:bg-muted/20 transition-colors"
            data-testid="database-row"
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                style={{ width: cell.column.getSize() }}
                className="h-9 border-r border-border/15 last:border-r-0"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
    </>
  );
}
