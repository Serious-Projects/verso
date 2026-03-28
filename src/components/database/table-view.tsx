"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseRow } from "@/types/database";
import { CellRenderer } from "./cell-renderer";
import { AddColumnButton, ColumnHeader } from "./column-header";

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

  const table = useReactTable({
    data: database.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Resize via direct DOM manipulation — zero React re-renders during drag
  const handleResizeStart = useCallback(
    (propertyId: string, colIndex: number, startX: number, startWidth: number) => {
      const tableEl = tableRef.current;
      if (!tableEl) return;

      // Collect all cells in this column (th + td) for direct width mutation
      const cells: HTMLElement[] = [];
      const rows = tableEl.querySelectorAll("tr");
      rows.forEach((row) => {
        const cell = row.children[colIndex] as HTMLElement | undefined;
        if (cell) cells.push(cell);
      });

      // Disable text selection during drag
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      let finalWidth = startWidth;

      const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        finalWidth = Math.max(startWidth + delta, MIN_COL_WIDTH);
        // Direct DOM mutation — no React re-render
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
        // Single store update on drop — persists to both property.width and view.propertyWidths
        resizeProperty(database.id, propertyId, finalWidth);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [database.id, resizeProperty],
  );

  return (
    <div className="w-full overflow-x-auto" data-testid="database-table">
      <table ref={tableRef} className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
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

        <tbody>
          {table.getRowModel().rows.map((row) => (
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
        </tbody>
      </table>

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
