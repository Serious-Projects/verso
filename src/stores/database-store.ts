import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  CellValue,
  Database,
  DatabaseMap,
  DatabaseProperty,
  DatabaseRow,
  DatabaseView,
  FilterRule,
  PropertyType,
  SelectOption,
  SortRule,
} from "@/types/database";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 18);
}

const DEFAULT_PROPERTY_WIDTH = 200;
const TITLE_PROPERTY_WIDTH = 280;

function makeDefaultProperties(): DatabaseProperty[] {
  return [
    { id: generateId(), name: "Name", type: "title", width: TITLE_PROPERTY_WIDTH },
    {
      id: generateId(),
      name: "Status",
      type: "select",
      width: DEFAULT_PROPERTY_WIDTH,
      options: [
        { id: generateId(), label: "Not started", color: "gray" },
        { id: generateId(), label: "In progress", color: "blue" },
        { id: generateId(), label: "Done", color: "green" },
      ],
    },
    {
      id: generateId(),
      name: "Tags",
      type: "multi_select",
      width: DEFAULT_PROPERTY_WIDTH,
      options: [],
    },
  ];
}

function makeDefaultView(properties: DatabaseProperty[]): DatabaseView {
  return {
    id: generateId(),
    name: "Table view",
    type: "table",
    visiblePropertyIds: properties.map((p) => p.id),
    propertyWidths: Object.fromEntries(
      properties.map((p) => [p.id, p.width ?? DEFAULT_PROPERTY_WIDTH]),
    ),
    filters: [],
    sorts: [],
  };
}

function makeEmptyRow(properties: DatabaseProperty[]): DatabaseRow {
  const cells: Record<string, CellValue> = {};
  for (const prop of properties) {
    cells[prop.id] = prop.type === "checkbox" ? false : prop.type === "multi_select" ? [] : null;
  }
  return {
    id: generateId(),
    cells,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface DatabaseState {
  databases: DatabaseMap;
  _hasHydrated: boolean;

  // CRUD
  createDatabase: (title?: string) => string;
  getDatabase: (id: string) => Database | undefined;
  deleteDatabase: (id: string) => void;
  updateDatabaseTitle: (id: string, title: string) => void;

  // Properties (columns)
  addProperty: (dbId: string, name: string, type: PropertyType) => string | undefined;
  updateProperty: (
    dbId: string,
    propertyId: string,
    updates: Partial<Omit<DatabaseProperty, "id">>,
  ) => void;
  deleteProperty: (dbId: string, propertyId: string) => void;
  reorderProperty: (dbId: string, propertyId: string, newIndex: number) => void;
  resizeProperty: (dbId: string, propertyId: string, width: number) => void;

  // Select options
  addSelectOption: (
    dbId: string,
    propertyId: string,
    label: string,
    color: string,
  ) => string | undefined;
  updateSelectOption: (
    dbId: string,
    propertyId: string,
    optionId: string,
    updates: Partial<Omit<SelectOption, "id">>,
  ) => void;
  deleteSelectOption: (dbId: string, propertyId: string, optionId: string) => void;

  // Rows
  addRow: (dbId: string) => string | undefined;
  updateCell: (dbId: string, rowId: string, propertyId: string, value: CellValue) => void;
  deleteRow: (dbId: string, rowId: string) => void;

  // Views
  updateView: (dbId: string, viewId: string, updates: Partial<Omit<DatabaseView, "id">>) => void;
  addFilter: (dbId: string, viewId: string, filter: Omit<FilterRule, "id">) => void;
  removeFilter: (dbId: string, viewId: string, filterId: string) => void;
  addSort: (dbId: string, viewId: string, sort: Omit<SortRule, "id">) => void;
  removeSort: (dbId: string, viewId: string, sortId: string) => void;
}

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      databases: {},
      _hasHydrated: false,

      createDatabase: (title = "Untitled Database") => {
        const id = generateId();
        const properties = makeDefaultProperties();
        const view = makeDefaultView(properties);
        const rows = [makeEmptyRow(properties), makeEmptyRow(properties), makeEmptyRow(properties)];
        const now = Date.now();

        const db: Database = {
          id,
          title,
          properties,
          rows,
          views: [view],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          databases: { ...state.databases, [id]: db },
        }));
        return id;
      },

      getDatabase: (id) => get().databases[id],

      deleteDatabase: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.databases;
          return { databases: rest };
        });
      },

      updateDatabaseTitle: (id, title) => {
        set((state) => {
          const db = state.databases[id];
          if (!db) return state;
          return {
            databases: { ...state.databases, [id]: { ...db, title, updatedAt: Date.now() } },
          };
        });
      },

      // --- Properties ---

      addProperty: (dbId, name, type) => {
        const propId = generateId();
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const newProp: DatabaseProperty = {
            id: propId,
            name,
            type,
            width: DEFAULT_PROPERTY_WIDTH,
            options:
              type === "select" || type === "multi_select" || type === "status" ? [] : undefined,
          };
          const properties = [...db.properties, newProp];
          // Add empty cell value to all rows
          const rows = db.rows.map((row) => ({
            ...row,
            cells: {
              ...row.cells,
              [propId]: type === "checkbox" ? false : type === "multi_select" ? [] : null,
            },
          }));
          // Add to view visible properties
          const views = db.views.map((v) => ({
            ...v,
            visiblePropertyIds: [...v.visiblePropertyIds, propId],
            propertyWidths: { ...v.propertyWidths, [propId]: DEFAULT_PROPERTY_WIDTH },
          }));
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, rows, views, updatedAt: Date.now() },
            },
          };
        });
        return propId;
      },

      updateProperty: (dbId, propertyId, updates) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const properties = db.properties.map((p) =>
            p.id === propertyId ? { ...p, ...updates } : p,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, updatedAt: Date.now() },
            },
          };
        });
      },

      deleteProperty: (dbId, propertyId) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const prop = db.properties.find((p) => p.id === propertyId);
          if (!prop || prop.type === "title") return state; // can't delete title column
          const properties = db.properties.filter((p) => p.id !== propertyId);
          const rows = db.rows.map((row) => {
            const { [propertyId]: _, ...cells } = row.cells;
            return { ...row, cells };
          });
          const views = db.views.map((v) => ({
            ...v,
            visiblePropertyIds: v.visiblePropertyIds.filter((id) => id !== propertyId),
            propertyWidths: (() => {
              const { [propertyId]: _, ...rest } = v.propertyWidths;
              return rest;
            })(),
          }));
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, rows, views, updatedAt: Date.now() },
            },
          };
        });
      },

      reorderProperty: (dbId, propertyId, newIndex) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const oldIndex = db.properties.findIndex((p) => p.id === propertyId);
          if (oldIndex === -1 || oldIndex === 0 || newIndex === 0) return state; // can't move title
          const properties = [...db.properties];
          const [moved] = properties.splice(oldIndex, 1);
          properties.splice(newIndex, 0, moved);
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, updatedAt: Date.now() },
            },
          };
        });
      },

      resizeProperty: (dbId, propertyId, width) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const properties = db.properties.map((p) =>
            p.id === propertyId ? { ...p, width } : p,
          );
          const views = db.views.map((v) => ({
            ...v,
            propertyWidths: { ...v.propertyWidths, [propertyId]: width },
          }));
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, views, updatedAt: Date.now() },
            },
          };
        });
      },

      // --- Select options ---

      addSelectOption: (dbId, propertyId, label, color) => {
        const optionId = generateId();
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const properties = db.properties.map((p) => {
            if (p.id !== propertyId) return p;
            return { ...p, options: [...(p.options ?? []), { id: optionId, label, color }] };
          });
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, updatedAt: Date.now() },
            },
          };
        });
        return optionId;
      },

      updateSelectOption: (dbId, propertyId, optionId, updates) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const properties = db.properties.map((p) => {
            if (p.id !== propertyId) return p;
            return {
              ...p,
              options: (p.options ?? []).map((o) => (o.id === optionId ? { ...o, ...updates } : o)),
            };
          });
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, updatedAt: Date.now() },
            },
          };
        });
      },

      deleteSelectOption: (dbId, propertyId, optionId) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const properties = db.properties.map((p) => {
            if (p.id !== propertyId) return p;
            return { ...p, options: (p.options ?? []).filter((o) => o.id !== optionId) };
          });
          // Clean cell values referencing this option
          const rows = db.rows.map((row) => {
            const cellVal = row.cells[propertyId];
            if (cellVal === optionId) {
              return { ...row, cells: { ...row.cells, [propertyId]: null } };
            }
            if (Array.isArray(cellVal)) {
              return {
                ...row,
                cells: { ...row.cells, [propertyId]: cellVal.filter((v) => v !== optionId) },
              };
            }
            return row;
          });
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, properties, rows, updatedAt: Date.now() },
            },
          };
        });
      },

      // --- Rows ---

      addRow: (dbId) => {
        const db = get().databases[dbId];
        if (!db) return undefined;
        const row = makeEmptyRow(db.properties);
        set((state) => {
          const db2 = state.databases[dbId];
          if (!db2) return state;
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db2, rows: [...db2.rows, row], updatedAt: Date.now() },
            },
          };
        });
        return row.id;
      },

      updateCell: (dbId, rowId, propertyId, value) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const rows = db.rows.map((r) =>
            r.id === rowId
              ? { ...r, cells: { ...r.cells, [propertyId]: value }, updatedAt: Date.now() }
              : r,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, rows, updatedAt: Date.now() },
            },
          };
        });
      },

      deleteRow: (dbId, rowId) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, rows: db.rows.filter((r) => r.id !== rowId), updatedAt: Date.now() },
            },
          };
        });
      },

      // --- Views ---

      updateView: (dbId, viewId, updates) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const views = db.views.map((v) => (v.id === viewId ? { ...v, ...updates } : v));
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, views, updatedAt: Date.now() },
            },
          };
        });
      },

      addFilter: (dbId, viewId, filter) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const views = db.views.map((v) =>
            v.id === viewId
              ? { ...v, filters: [...v.filters, { ...filter, id: generateId() }] }
              : v,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, views, updatedAt: Date.now() },
            },
          };
        });
      },

      removeFilter: (dbId, viewId, filterId) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const views = db.views.map((v) =>
            v.id === viewId ? { ...v, filters: v.filters.filter((f) => f.id !== filterId) } : v,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, views, updatedAt: Date.now() },
            },
          };
        });
      },

      addSort: (dbId, viewId, sort) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const views = db.views.map((v) =>
            v.id === viewId ? { ...v, sorts: [...v.sorts, { ...sort, id: generateId() }] } : v,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, views, updatedAt: Date.now() },
            },
          };
        });
      },

      removeSort: (dbId, viewId, sortId) => {
        set((state) => {
          const db = state.databases[dbId];
          if (!db) return state;
          const views = db.views.map((v) =>
            v.id === viewId ? { ...v, sorts: v.sorts.filter((s) => s.id !== sortId) } : v,
          );
          return {
            databases: {
              ...state.databases,
              [dbId]: { ...db, views, updatedAt: Date.now() },
            },
          };
        });
      },
    }),
    {
      name: "verso-databases",
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useDatabaseStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
