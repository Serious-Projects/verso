import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { DatabaseBlockView } from "../blocks/database-block-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    databaseBlock: {
      setDatabaseBlock: (options?: { databaseId?: string }) => ReturnType;
    };
  }
}

export const DatabaseBlock = Node.create({
  name: "databaseBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      databaseId: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="database-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "database-block" }),
    ];
  },

  addCommands() {
    return {
      setDatabaseBlock:
        (options = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { databaseId: options.databaseId ?? "" },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockView);
  },
});
