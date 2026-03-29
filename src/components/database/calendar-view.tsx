"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseProperty, DatabaseRow } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { processRows } from "./data-processing";
import { FilterSortBar } from "./filter-sort-bar";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarViewProps {
  database: Database;
}

export function CalendarView({ database }: CalendarViewProps) {
  const addRow = useDatabaseStore((s) => s.addRow);
  const updateCell = useDatabaseStore((s) => s.updateCell);

  const view = database.views.find((v) => v.id === database.activeViewId) ?? database.views[0];
  if (!view) return null;

  const dateProperty = useMemo(
    () => database.properties.find((p) => p.type === "date"),
    [database.properties],
  );

  const titleProp = database.properties.find((p) => p.type === "title");

  const { rows: filteredRows } = useMemo(
    () => processRows(database.rows, { ...view, groupBy: undefined }, database.properties),
    [database.rows, database.properties, view],
  );

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  const goToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }, [today]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const rowsByDate = useMemo(() => {
    if (!dateProperty) return new Map<string, DatabaseRow[]>();
    const map = new Map<string, DatabaseRow[]>();
    for (const row of filteredRows) {
      const val = row.cells[dateProperty.id] as string | null;
      if (!val) continue;
      const existing = map.get(val) ?? [];
      existing.push(row);
      map.set(val, existing);
    }
    return map;
  }, [filteredRows, dateProperty]);

  const handleAddOnDate = useCallback(
    (day: number) => {
      const rowId = addRow(database.id);
      if (rowId && dateProperty) {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        updateCell(database.id, rowId, dateProperty.id, dateStr);
      }
    },
    [addRow, updateCell, database.id, dateProperty, viewYear, viewMonth],
  );

  if (!dateProperty) {
    return (
      <div className="flex items-center justify-center px-4 py-12 text-sm text-muted-foreground/50" data-testid="calendar-no-property">
        Add a Date column to use Calendar view
      </div>
    );
  }

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div data-testid="calendar-view">
      <FilterSortBar dbId={database.id} view={view} properties={database.properties} />

      <div className="px-4 py-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              data-testid="calendar-prev"
              className="rounded-md p-1.5 text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center" data-testid="calendar-month-label">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              data-testid="calendar-next"
              className="rounded-md p-1.5 text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-lg border border-border/20 bg-border/20 overflow-hidden">
          {DAYS.map((d) => (
            <div key={d} className="bg-muted/30 px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground/50">
              {d}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`pad-${i}`} className="bg-background min-h-24" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayRows = rowsByDate.get(dateStr) ?? [];
            const todayMark = isToday(day);

            return (
              <div
                key={day}
                className="group/day relative bg-background min-h-24 px-1.5 pt-1 pb-1.5"
                data-testid="calendar-cell"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium leading-none ${
                    todayMark
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px]"
                      : "text-muted-foreground/60 pl-0.5"
                  }`}>
                    {day}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddOnDate(day)}
                    className="rounded p-0.5 text-muted-foreground/30 opacity-0 group-hover/day:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
                    data-testid="calendar-add-btn"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  {dayRows.slice(0, 3).map((row) => (
                    <CalendarCard
                      key={row.id}
                      row={row}
                      titleProp={titleProp}
                      properties={database.properties}
                    />
                  ))}
                  {dayRows.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/40 pl-1">
                      +{dayRows.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarCard({
  row,
  titleProp,
  properties,
}: {
  row: DatabaseRow;
  titleProp: DatabaseProperty | undefined;
  properties: DatabaseProperty[];
}) {
  const title = titleProp ? (row.cells[titleProp.id] as string) || "Untitled" : "Untitled";

  const statusProp = properties.find((p) => p.type === "select" || p.type === "status");
  let accentColor = "bg-primary/60";
  if (statusProp) {
    const optId = row.cells[statusProp.id] as string | null;
    const opt = (statusProp.options ?? []).find((o) => o.id === optId);
    if (opt) {
      const colorDef = SELECT_COLORS.find((c) => c.value === opt.color);
      if (colorDef) accentColor = colorDef.bg.split(" ")[0];
    }
  }

  return (
    <div
      className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ${accentColor} cursor-default`}
      data-testid="calendar-card"
      title={title}
    >
      {title}
    </div>
  );
}
