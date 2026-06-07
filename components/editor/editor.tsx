import { EditorContent, Editor } from "@tiptap/react";

interface EditorProps {
  editor: Editor | null;
}

export default function TiptapEditor({ editor }: EditorProps) {
  if (!editor) return null;

  return (
    <div className="w-full h-full min-h-[400px]">
      <EditorContent editor={editor} />
    </div>
  );
}
