import { Node, mergeAttributes } from "@tiptap/core";

export interface ToggleOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleBlock: {
      setToggle: () => ReturnType;
    };
  }
}

export const ToggleBlock = Node.create<ToggleOptions>({
  name: "toggleBlock",
  group: "block",
  content: "block+",
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-open") !== "false",
        renderHTML: (attributes) => ({
          "data-open": attributes.open ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const isOpen = HTMLAttributes["data-open"] !== "false";
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "toggle",
        class: "toggle-block my-1",
      }),
      [
        "button",
        {
          class: `toggle-trigger flex items-center gap-1 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors ${isOpen ? "rotate-90" : ""}`,
          contenteditable: "false",
          "data-toggle-trigger": "true",
        },
        [
          "span",
          { class: "toggle-icon text-xs transition-transform" },
          "▶",
        ],
      ],
      [
        "div",
        {
          class: `toggle-content pl-5 ${isOpen ? "" : "hidden"}`,
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ state, chain }) => {
          const { $from } = state.selection;
          const blockStart = $from.before(1);
          const blockEnd = $from.after(1);

          // Replace the current block with a toggle containing a paragraph
          chain()
            .deleteRange({ from: blockStart, to: blockEnd })
            .insertContentAt(blockStart, {
              type: "toggleBlock",
              attrs: { open: true },
              content: [{ type: "paragraph" }],
            })
            .run();

          return true;
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.classList.add("toggle-block", "my-1");
      dom.setAttribute("data-type", "toggle");

      const trigger = document.createElement("button");
      trigger.classList.add(
        "toggle-trigger",
        "flex",
        "items-center",
        "gap-1",
        "cursor-pointer",
        "select-none",
        "text-muted-foreground",
        "py-0.5"
      );
      trigger.contentEditable = "false";
      trigger.type = "button";

      const icon = document.createElement("span");
      icon.classList.add(
        "toggle-icon",
        "text-xs",
        "transition-transform",
        "inline-block"
      );
      icon.textContent = "▶";
      if (node.attrs.open) {
        icon.style.transform = "rotate(90deg)";
      }

      trigger.appendChild(icon);

      const contentDom = document.createElement("div");
      contentDom.classList.add("toggle-content", "pl-5");
      if (!node.attrs.open) {
        contentDom.style.display = "none";
      }

      trigger.addEventListener("click", () => {
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos == null) return;
        const isOpen = !node.attrs.open;

        editor.commands.command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, open: isOpen });
          return true;
        });

        icon.style.transform = isOpen ? "rotate(90deg)" : "";
        contentDom.style.display = isOpen ? "" : "none";
      });

      dom.appendChild(trigger);
      dom.appendChild(contentDom);

      return {
        dom,
        contentDOM: contentDom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          node = updatedNode;
          icon.style.transform = node.attrs.open ? "rotate(90deg)" : "";
          contentDom.style.display = node.attrs.open ? "" : "none";
          return true;
        },
      };
    };
  },
});
