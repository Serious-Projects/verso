"use client";

import { useEffect } from "react";

import { usePageStore } from "@/stores/page-store";

export function HydrationHelper() {
  useEffect(() => {
    usePageStore.persist.rehydrate();
  }, []);

  return null;
}
