import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

export const SLASH_COMMAND_KEY = new PluginKey("slashCommand");

export interface SlashCommandStorage {
  query: string;
  active: boolean;
  range: { from: number; to: number } | null;
}

// Helper to access storage without TS complaining
function getStorage(editor: Editor): SlashCommandStorage {
  return (editor.storage as unknown as Record<string, unknown>).slashCommand as SlashCommandStorage;
}

function setStorage(editor: Editor, partial: Partial<SlashCommandStorage>) {
  const current = getStorage(editor);
  (editor.storage as unknown as Record<string, unknown>).slashCommand = {
    ...current,
    ...partial,
  };
}

function emitUpdate(query: string, active: boolean) {
  window.dispatchEvent(
    new CustomEvent("slash-command-update", {
      detail: { query, active },
    }),
  );
}

function closeMenu(editor: Editor) {
  setStorage(editor, { active: false, query: "", range: null });
  emitUpdate("", false);
}

export const SlashCommand = Extension.create<object, SlashCommandStorage>({
  name: "slashCommand",

  addStorage() {
    return {
      query: "",
      active: false,
      range: null,
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: SLASH_COMMAND_KEY,

        state: {
          init: () => DecorationSet.empty,
          apply: (tr, prev) => {
            const meta = tr.getMeta(SLASH_COMMAND_KEY);
            if (meta?.active === false) return DecorationSet.empty;
            if (meta?.decorations) return meta.decorations;
            return prev.map(tr.mapping, tr.doc);
          },
        },

        props: {
          decorations(state) {
            return this.getState(state) ?? DecorationSet.empty;
          },

          handleKeyDown(_view, event) {
            const storage = getStorage(editor);
            if (!storage.active) return false;

            // Escape always closes
            if (event.key === "Escape") {
              window.dispatchEvent(
                new CustomEvent("slash-command-keydown", {
                  detail: { key: "Escape" },
                }),
              );
              return true;
            }

            // Backspace — check if we've deleted back past the /
            if (event.key === "Backspace") {
              const { range } = storage;
              if (!range) return false;

              // After this backspace, cursor will be at current pos - 1
              const cursorPos = editor.state.selection.from;
              if (cursorPos <= range.from + 1) {
                // We're about to delete the / or are at it — close menu
                // Let the backspace happen, then close
                setTimeout(() => closeMenu(editor), 0);
                return false; // Don't block backspace — let it delete
              }

              // Otherwise, update query after backspace
              setTimeout(() => {
                const pos = editor.view.state.selection.from;
                const r = getStorage(editor).range;
                if (!r) return;
                try {
                  const text = editor.view.state.doc.textBetween(r.from, pos, "");
                  const query = text.slice(1);
                  setStorage(editor, { query, range: { from: r.from, to: pos } });
                  emitUpdate(query, true);
                } catch {
                  closeMenu(editor);
                }
              }, 0);
              return false;
            }

            // Arrow keys and Enter — always intercept when menu is active
            if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Enter") {
              window.dispatchEvent(
                new CustomEvent("slash-command-keydown", {
                  detail: { key: event.key },
                }),
              );
              return true;
            }

            return false;
          },

          handleTextInput(view, from, _to, text) {
            const storage = getStorage(editor);

            // Start slash menu
            if (text === "/" && !storage.active) {
              const { state } = view;
              const $from = state.doc.resolve(from);

              // Don't activate inside table cells — walk resolved-pos ancestors
              for (let d = $from.depth; d >= 0; d--) {
                const n = $from.node(d).type.name;
                if (n === "tableCell" || n === "tableHeader" || n === "table") {
                  return false;
                }
              }

              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

              if (textBefore.length === 0 || textBefore.endsWith(" ")) {
                setTimeout(() => {
                  const pos = view.state.selection.from;
                  setStorage(editor, {
                    active: true,
                    query: "",
                    range: { from: pos - 1, to: pos },
                  });
                  emitUpdate("", true);
                }, 0);
              }
              return false;
            }

            // Update query while slash menu is active
            if (storage.active && storage.range) {
              setTimeout(() => {
                const pos = view.state.selection.from;
                const range = storage.range!;
                try {
                  const slashText = view.state.doc.textBetween(range.from, pos, "");
                  const query = slashText.slice(1);
                  setStorage(editor, {
                    query,
                    range: { from: range.from, to: pos },
                  });
                  emitUpdate(query, true);
                } catch {
                  closeMenu(editor);
                }
              }, 0);
              return false;
            }

            return false;
          },
        },

        view() {
          return {
            update: (view) => {
              const storage = getStorage(editor);
              if (!storage.active || !storage.range) return;

              const { from } = view.state.selection;
              const range = storage.range;

              // Close if cursor moved out of range
              if (from < range.from || from > range.to + 10) {
                closeMenu(editor);
                return;
              }

              // Close if the / was deleted (document shorter than range)
              try {
                const text = view.state.doc.textBetween(range.from, range.from + 1, "");
                if (text !== "/") {
                  closeMenu(editor);
                }
              } catch {
                closeMenu(editor);
              }
            },
          };
        },
      }),
    ];
  },
});

export function dismissSlashCommand(editor: Editor) {
  const storage = getStorage(editor);
  if (storage.range) {
    editor.chain().focus().deleteRange(storage.range).run();
  }
  closeMenu(editor);
}
