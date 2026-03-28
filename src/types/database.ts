export type PropertyType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "status";

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

/** Notion-style tag colors */
export const SELECT_COLORS = [
  { name: "Gray", bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", value: "gray" },
  { name: "Brown", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-300", value: "brown" },
  { name: "Orange", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", value: "orange" },
  { name: "Yellow", bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", value: "yellow" },
  { name: "Green", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", value: "green" },
  { name: "Blue", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", value: "blue" },
  { name: "Purple", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", value: "purple" },
  { name: "Pink", bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-700 dark:text-pink-300", value: "pink" },
  { name: "Red", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", value: "red" },
] as const;

export const STATUS_GROUPS = {
  not_started: { label: "Not started", color: "gray" },
  in_progress: { label: "In progress", color: "blue" },
  done: { label: "Done", color: "green" },
} as const;

export interface DatabaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[];
  width?: number;
}

export interface DatabaseRow {
  id: string;
  cells: Record<string, CellValue>;
  createdAt: number;
  updatedAt: number;
}

export type CellValue = string | number | boolean | string[] | null;

export interface DatabaseView {
  id: string;
  name: string;
  type: "table" | "board" | "calendar" | "gallery";
  visiblePropertyIds: string[];
  propertyWidths: Record<string, number>;
  filters: FilterRule[];
  sorts: SortRule[];
  groupBy?: string;
}

export interface FilterRule {
  id: string;
  propertyId: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | "contains"
  | "does_not_contain"
  | "equals"
  | "does_not_equal"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than";

export interface SortRule {
  id: string;
  propertyId: string;
  direction: "asc" | "desc";
}

export interface Database {
  id: string;
  title: string;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  createdAt: number;
  updatedAt: number;
}

export type DatabaseMap = Record<string, Database>;
