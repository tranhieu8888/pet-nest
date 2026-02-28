"use client";

import { Editor } from "@tinymce/tinymce-react";

interface TinyEditorProps {
  value: string;
  onChange: (content: string) => void;
}

export default function TinyEditor({ value, onChange }: TinyEditorProps) {
  return (
    <Editor
      apiKey="ygxzbqd4ej8z1yjswkp0ljn56qm4r6luix9l83auaajk3h3q"
      value={value}
      init={{
        height: 160,
        menubar: false, //bỏ File Edit View
        branding: false, //bỏ "Build with Tiny"
        statusbar: false, //bỏ thanh dưới cùng
        plugins: ["lists", "link", "image"],
        toolbar:
          "bold italic underline | \
     alignleft aligncenter alignright | \
     bullist numlist",
        toolbar_mode: "wrap", // bỏ nút ...
        resize: false,
      }}
      onEditorChange={(content) => onChange(content)}
    />
  );
}
