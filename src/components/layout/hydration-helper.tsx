"use client";

import { useEffect } from "react";

import { useDatabaseStore } from "@/stores/database-store";
import { usePageStore } from "@/stores/page-store";

export function HydrationHelper() {
  useEffect(() => {
    usePageStore.persist.rehydrate();
    useDatabaseStore.persist.rehydrate();
  }, []);

  return null;
}
