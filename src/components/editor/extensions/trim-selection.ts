import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

/**
 * Trims trailing whitespace from text selections made by double-click.
 * Browsers select "word " (word + trailing space) on double-click,
 * which causes formatting to bleed into the space.
 */
export const TrimSelection = Extension.create({
  name: "trimSelection",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("trimSelection"),
        props: {
          handleDoubleClick(view) {
            // Use setTimeout to run after ProseMirror syncs the browser selection.
            // requestAnimationFrame is too early — PM's selectionchange handler
            // can overwrite our fix.
            setTimeout(() => {
              // Re-read state from view (not captured closure) since PM may
              // have dispatched transactions between our handler and now
              const { state } = view;
              const { from, to } = state.selection;
              if (from === to) return;

              const text = state.doc.textBetween(from, to, "");
              if (!text.endsWith(" ") && !text.endsWith("\u00A0")) return;

              // Trim trailing whitespace
              let trimmedTo = to;
              for (let i = text.length - 1; i >= 0; i--) {
                if (text[i] === " " || text[i] === "\u00A0") {
                  trimmedTo--;
                } else {
                  break;
                }
              }

              if (trimmedTo !== to && trimmedTo > from) {
                const tr = state.tr.setSelection(
                  TextSelection.create(state.doc, from, trimmedTo)
                );
                view.dispatch(tr);
              }
            }, 20);
            return false;
          },
        },
      }),
    ];
  },
});
