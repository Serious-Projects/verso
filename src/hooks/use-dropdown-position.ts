import { useCallback, useRef, useState } from "react";

const VIEWPORT_PADDING = 8;
const ESTIMATED_DROPDOWN_HEIGHT = 300;

interface Position {
  top: number;
  left: number;
  arrowLeft: number;
  flipped: boolean;
}

interface UseDropdownPositionOptions {
  align?: "left" | "right";
  widthPx: number;
  offset?: number;
  placement?: "below" | "right";
  /** Center dropdown under trigger (default true). Set false for table cell dropdowns. */
  center?: boolean;
}

export function useDropdownPosition<T extends HTMLElement = HTMLDivElement>({
  align = "left",
  widthPx,
  offset = 4,
  placement = "below",
  center = true,
}: UseDropdownPositionOptions) {
  const triggerRef = useRef<T>(null);
  const [pos, setPos] = useState<Position>({ top: 0, left: 0, arrowLeft: 16, flipped: false });

  const recompute = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;
    let flipped = false;

    if (placement === "right") {
      left = rect.right + offset;
      top = rect.top;
      if (left + widthPx > vw - VIEWPORT_PADDING) {
        left = rect.left - widthPx - offset;
      }
    } else {
      left = align === "right" ? rect.right - widthPx : rect.left;

      const spaceBelow = vh - rect.bottom - offset;
      const spaceAbove = rect.top - offset;
      if (spaceBelow >= ESTIMATED_DROPDOWN_HEIGHT || spaceBelow >= spaceAbove) {
        top = rect.bottom + offset;
      } else {
        top = rect.top - offset - Math.min(ESTIMATED_DROPDOWN_HEIGHT, spaceAbove);
        flipped = true;
      }
    }

    if (placement === "below" && center && align === "left") {
      left = rect.left + rect.width / 2 - widthPx / 2;
    }

    // Clamp to viewport
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - widthPx - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - ESTIMATED_DROPDOWN_HEIGHT - VIEWPORT_PADDING));

    // Arrow points at trigger center, relative to dropdown left
    const triggerCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.max(12, Math.min(triggerCenter - left, widthPx - 12));

    setPos({ top, left, arrowLeft, flipped });
  }, [align, widthPx, offset, placement]);

  return { triggerRef, pos, recompute };
}
