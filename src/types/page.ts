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
}

export type PageMap = Record<string, Page>;
