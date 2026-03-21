export type FontStyle = "default" | "serif" | "mono";

export interface Page {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  childrenIds: string[];
  content: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: number;
  isExpanded: boolean;
  coverColor?: string;   // e.g. "#f59e0b" or a tailwind gradient key
  fontStyle?: FontStyle;
}

export type PageMap = Record<string, Page>;
