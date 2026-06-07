export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: any) => void;
}

export const slashCommandsList: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: "title",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "title",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "title",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bulleted list",
    icon: "format_list_bulleted",
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering",
    icon: "format_list_numbered",
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "Table",
    description: "Insert a 3x3 table grid",
    icon: "table_chart",
    command: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Quote",
    description: "Insert a blockquote block",
    icon: "format_quote",
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Insert a syntax-highlighted code block",
    icon: "code",
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: "Image",
    description: "Insert an image URL",
    icon: "image",
    command: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal separator",
    icon: "horizontal_rule",
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
];
