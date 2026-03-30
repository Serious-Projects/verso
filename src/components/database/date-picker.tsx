"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

import { Dropdown } from "./dropdown";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  testId?: string;
}

export function DatePicker({ value, onChange, testId = "cell-date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const selectDay = useCallback(
    (day: number) => {
      onChange(toISODate(viewYear, viewMonth, day));
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const isSelected = (day: number) =>
    parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth() === viewMonth &&
    parsed.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  return (
    <Dropdown
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && parsed) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }}
      width="w-64"
      center={false}
      testId="date-picker-dropdown"
      trigger={
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid={testId}
          className="flex h-full min-h-9 w-full items-center px-2 py-1 text-left"
        >
          <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground/30"}`}>
            {value ? formatDate(value) : "\u00A0"}
          </span>
        </button>
      }
    >
      <div className="p-3">
        {/* Month/Year header */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day names */}
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {DAYS.map((d) => (
            <div key={d} className="flex h-7 items-center justify-center text-[10px] font-medium text-muted-foreground/50">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-7" />
          ))}
          {/* Actual days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const todayMark = isToday(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                className={`flex h-7 w-full items-center justify-center rounded-md text-xs transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : todayMark
                      ? "bg-muted/60 text-foreground font-medium"
                      : "text-foreground/80 hover:bg-muted/40"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
          <button
            type="button"
            onClick={() => {
              selectDay(today.getDate());
              setViewMonth(today.getMonth());
              setViewYear(today.getFullYear());
            }}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </Dropdown>
  );
}
