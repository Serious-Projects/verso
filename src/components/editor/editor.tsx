"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "verso-document";
const SAVE_DELAY = 1000;

export function Editor() {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveContent = useCallback((content: string) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
      } catch {
        // Storage full or unavailable — fail silently for now
      }
    }, SAVE_DELAY);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing, or press '/' for commands...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight max-w-none min-h-[calc(100vh-8rem)] px-16 py-12 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      saveContent(JSON.stringify(editor.getJSON()));
    },
    immediatelyRender: false,
  });

  // Load saved content on mount
  useEffect(() => {
    if (!editor) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const content = JSON.parse(saved);
        editor.commands.setContent(content);
      }
    } catch {
      // Invalid saved content — start fresh
    }
  }, [editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <EditorContent editor={editor} />
    </div>
  );
}
