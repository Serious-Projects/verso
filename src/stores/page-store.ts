import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Page, PageMap } from "@/types/page";
import { generateId } from "@/lib/utils";

function makePage(parentId: string | null = null): Page {
  return {
    id: generateId(),
    title: "",
    icon: "📄",
    parentId,
    childrenIds: [],
    content: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    isDeleted: false,
    isExpanded: false,
  };
}

interface PageState {
  pages: PageMap;
  _hasHydrated: boolean;

  createPage: (parentId?: string | null, title?: string, icon?: string) => string;
  updatePage: (id: string, updates: Partial<Omit<Page, "id" | "createdAt">>) => void;
  deletePage: (id: string) => void;
  restorePage: (id: string) => void;
  permanentlyDeletePage: (id: string) => void;
  toggleExpanded: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getRootPageIds: () => string[];
  getPageAncestors: (id: string) => Page[];
  getDeletedPages: () => Page[];
}

export const usePageStore = create<PageState>()(
  persist(
    (set, get) => ({
      pages: {},
      _hasHydrated: false,

      createPage: (parentId = null, title = "", icon = "📄") => {
        const page: Page = { ...makePage(parentId), title, icon };
        set((state) => {
          const updated: PageMap = { ...state.pages, [page.id]: page };
          if (parentId && updated[parentId]) {
            updated[parentId] = {
              ...updated[parentId],
              childrenIds: [...updated[parentId].childrenIds, page.id],
              isExpanded: true,
            };
          }
          return { pages: updated };
        });
        return page.id;
      },

      updatePage: (id, updates) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          return {
            pages: {
              ...state.pages,
              [id]: { ...page, ...updates, updatedAt: Date.now() },
            },
          };
        });
      },

      deletePage: (id) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          const updated: PageMap = { ...state.pages };

          const toDelete: string[] = [];
          const collect = (pid: string) => {
            toDelete.push(pid);
            updated[pid]?.childrenIds.forEach(collect);
          };
          collect(id);

          const now = Date.now();
          toDelete.forEach((pid) => {
            if (updated[pid]) {
              updated[pid] = { ...updated[pid], isDeleted: true, deletedAt: now };
            }
          });

          if (page.parentId && updated[page.parentId]) {
            updated[page.parentId] = {
              ...updated[page.parentId],
              childrenIds: updated[page.parentId].childrenIds.filter((c) => c !== id),
            };
          }

          return { pages: updated };
        });
      },

      restorePage: (id) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          const updated: PageMap = {
            ...state.pages,
            [id]: { ...page, isDeleted: false, deletedAt: undefined },
          };
          if (page.parentId) {
            const parent = updated[page.parentId];
            if (parent && !parent.isDeleted && !parent.childrenIds.includes(id)) {
              updated[page.parentId] = {
                ...parent,
                childrenIds: [...parent.childrenIds, id],
              };
            }
          }
          return { pages: updated };
        });
      },

      permanentlyDeletePage: (id) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          const updated = { ...state.pages };

          // Collect and remove all descendants
          const toRemove: string[] = [];
          const collect = (pid: string) => {
            toRemove.push(pid);
            updated[pid]?.childrenIds.forEach(collect);
          };
          collect(id);
          toRemove.forEach((pid) => delete updated[pid]);

          // Remove from parent's childrenIds
          if (page.parentId && updated[page.parentId]) {
            updated[page.parentId] = {
              ...updated[page.parentId],
              childrenIds: updated[page.parentId].childrenIds.filter((c) => c !== id),
            };
          }

          return { pages: updated };
        });
      },

      toggleExpanded: (id) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          return {
            pages: { ...state.pages, [id]: { ...page, isExpanded: !page.isExpanded } },
          };
        });
      },

      toggleFavorite: (id) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          return {
            pages: { ...state.pages, [id]: { ...page, isFavorite: !page.isFavorite } },
          };
        });
      },

      getRootPageIds: () => {
        const { pages } = get();
        return Object.values(pages)
          .filter((p) => p.parentId === null && !p.isDeleted)
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((p) => p.id);
      },

      getPageAncestors: (id) => {
        const { pages } = get();
        const ancestors: Page[] = [];
        let current = pages[id];
        while (current?.parentId) {
          const parent = pages[current.parentId];
          if (!parent) break;
          ancestors.unshift(parent);
          current = parent;
        }
        return ancestors;
      },

      getDeletedPages: () => {
        const { pages } = get();
        return Object.values(pages).filter((p) => p.isDeleted);
      },
    }),
    {
      name: "verso-pages",
      skipHydration: true,
      onRehydrateStorage: () => () => {
        usePageStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
