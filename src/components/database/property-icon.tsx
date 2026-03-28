"use client";

import {
  AlignLeft,
  AtSign,
  Calendar,
  CheckSquare,
  Hash,
  Link,
  List,
  Phone,
  Tag,
  Type,
} from "lucide-react";

import type { PropertyType } from "@/types/database";

const ICONS: Record<PropertyType, React.ReactNode> = {
  title: <Type className="h-3.5 w-3.5" />,
  text: <AlignLeft className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  select: <Tag className="h-3.5 w-3.5" />,
  multi_select: <List className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  url: <Link className="h-3.5 w-3.5" />,
  email: <AtSign className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  status: <Tag className="h-3.5 w-3.5" />,
};

export function PropertyIcon({ type }: { type: PropertyType }) {
  return <span className="text-muted-foreground/60">{ICONS[type]}</span>;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  title: "Title",
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  date: "Date",
  checkbox: "Checkbox",
  url: "URL",
  email: "Email",
  phone: "Phone",
  status: "Status",
};
