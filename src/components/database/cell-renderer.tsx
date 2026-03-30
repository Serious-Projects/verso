"use client";

import type { CellValue, DatabaseProperty } from "@/types/database";
import {
  CheckboxCell,
  DateCell,
  MultiSelectCell,
  NumberCell,
  SelectCell,
  TextCell,
} from "./cells";

interface CellRendererProps {
  dbId: string;
  rowId: string;
  property: DatabaseProperty;
  value: CellValue;
}

export function CellRenderer({ dbId, rowId, property, value }: CellRendererProps) {
  switch (property.type) {
    case "title":
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <TextCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as string | null}
          type={property.type}
        />
      );
    case "number":
      return (
        <NumberCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as number | null}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell dbId={dbId} rowId={rowId} propertyId={property.id} value={value as boolean} />
      );
    case "select":
    case "status":
      return (
        <SelectCell dbId={dbId} rowId={rowId} property={property} value={value as string | null} />
      );
    case "multi_select":
      return (
        <MultiSelectCell
          dbId={dbId}
          rowId={rowId}
          property={property}
          value={value as string[] | null}
        />
      );
    case "date":
      return (
        <DateCell
          dbId={dbId}
          rowId={rowId}
          propertyId={property.id}
          value={value as string | null}
        />
      );
    default:
      return <span className="text-muted-foreground/40 text-xs">—</span>;
  }
}
