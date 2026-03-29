"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import type { Database, DatabaseProperty, DatabaseRow } from "@/types/database";
import { SELECT_COLORS } from "@/types/database";
import { processRows } from "./data-processing";
import { FilterSortBar } from "./filter-sort-bar";

interface GalleryViewProps {
  database: Database;
}

export function GalleryView({ database }: GalleryViewProps) {
  const addRow = useDatabaseStore((s) => s.addRow);

  const view = database.views.find((v) => v.id === database.activeViewId) ?? database.views[0];
  if (!view) return null;

  const titleProp = database.properties.find((p) => p.type === "title");
  const imageProp = database.properties.find((p) => p.type === "url");
  const previewProps = useMemo(
    () => database.properties.filter((p) => p.type !== "title").slice(0, 4),
    [database.properties],
  );

  const { rows: filteredRows } = useMemo(
    () => processRows(database.rows, { ...view, groupBy: undefined }, database.properties),
    [database.rows, database.properties, view],
  );

  return (
    <div data-testid="gallery-view">
      <FilterSortBar dbId={database.id} view={view} properties={database.properties} />

      <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3" data-testid="gallery-grid">
        {filteredRows.map((row) => (
          <GalleryCard
            key={row.id}
            row={row}
            titleProp={titleProp}
            imageProp={imageProp}
            previewProps={previewProps}
          />
        ))}

        <button
          type="button"
          onClick={() => addRow(database.id)}
          data-testid="gallery-add-card"
          className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/30 text-muted-foreground/30 hover:border-border/50 hover:text-muted-foreground/60 hover:bg-muted/10 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function GalleryCard({
  row,
  titleProp,
  imageProp,
  previewProps,
}: {
  row: DatabaseRow;
  titleProp: DatabaseProperty | undefined;
  imageProp: DatabaseProperty | undefined;
  previewProps: DatabaseProperty[];
}) {
  const title = titleProp ? (row.cells[titleProp.id] as string) || "Untitled" : "Untitled";
  const imageUrl = imageProp ? (row.cells[imageProp.id] as string) || "" : "";

  return (
    <div
      className="group/card overflow-hidden rounded-xl border border-border/15 bg-background transition-all duration-200 hover:border-border/30 hover:shadow-md"
      data-testid="gallery-card"
    >
      {imageUrl ? (
        <div className="aspect-video w-full overflow-hidden bg-muted/20">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-muted/20 to-muted/5" />
      )}

      <div className="p-3">
        <p className={`text-sm font-semibold leading-snug truncate ${
          title === "Untitled" ? "text-muted-foreground/30 italic" : "text-foreground"
        }`}>
          {title}
        </p>

        {previewProps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {previewProps.map((prop) => {
              const val = row.cells[prop.id];
              if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) return null;
              return <GalleryPropertyValue key={prop.id} property={prop} value={val} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryPropertyValue({ property, value }: { property: DatabaseProperty; value: unknown }) {
  if (property.type === "checkbox") {
    return value === true ? <span className="text-[10px] text-emerald-500">&#10003;</span> : null;
  }

  if (property.type === "select" || property.type === "status") {
    const opt = (property.options ?? []).find((o) => o.id === value);
    if (!opt) return null;
    const colorDef = SELECT_COLORS.find((c) => c.value === opt.color) ?? SELECT_COLORS[0];
    return (
      <span className={`inline-flex items-center rounded-sm px-1 py-0.5 text-[10px] font-medium ${colorDef.bg} ${colorDef.text}`}>
        {opt.label}
      </span>
    );
  }

  if (property.type === "multi_select") {
    return (
      <>
        {((value as string[]) ?? []).map((optId) => {
          const opt = (property.options ?? []).find((o) => o.id === optId);
          if (!opt) return null;
          const colorDef = SELECT_COLORS.find((c) => c.value === opt.color) ?? SELECT_COLORS[0];
          return (
            <span key={optId} className={`inline-flex items-center rounded-sm px-1 py-0.5 text-[10px] font-medium ${colorDef.bg} ${colorDef.text}`}>
              {opt.label}
            </span>
          );
        })}
      </>
    );
  }

  if (property.type === "date") {
    return (
      <span className="text-[10px] text-muted-foreground/60">
        {new Date((value as string) + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
      </span>
    );
  }

  return (
    <span className="text-[10px] text-muted-foreground/60 truncate max-w-32">
      {String(value)}
    </span>
  );
}
