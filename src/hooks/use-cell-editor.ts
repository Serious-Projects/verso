"use client";

import { useCallback, useRef, useState } from "react";

interface UseCellEditorOptions {
  /** Convert the cell value to a draft string for the input */
  toDraft: () => string;
  /** Called with the current draft string when the user commits (Enter or blur) */
  onCommit: (draft: string) => void;
}

export function useCellEditor({ toDraft, onCommit }: UseCellEditorOptions) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  /** Callback ref: focuses the input when it mounts (no setTimeout/rAF needed) */
  const focusRef = useCallback(
    (node: HTMLInputElement | null) => {
      // Keep the regular ref in sync
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (node && editing) {
        node.focus();
      }
    },
    [editing],
  );

  const startEditing = useCallback(() => {
    setDraft(toDraft());
    setEditing(true);
  }, [toDraft]);

  const commit = useCallback(() => {
    onCommit(draft);
    setEditing(false);
  }, [draft, onCommit]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    },
    [commit, cancel],
  );

  return {
    editing,
    draft,
    setDraft,
    inputRef: focusRef,
    startEditing,
    commit,
    cancel,
    handleKeyDown,
  } as const;
}
