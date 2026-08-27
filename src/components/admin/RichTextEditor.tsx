import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, ImagePlus, Underline as UnderlineIcon } from "lucide-react";
import { cn } from "@lib/utils";

export interface RichTextEditorHandle {
    insertImage: (url: string) => void;
}

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    onInsertImageClick?: () => void;
    insertImageDisabled?: boolean;
    insertImageTitle?: string;
}

// Noi dung tin tuc duoc luu la HTML don gian (p/strong/em/u/img) - Tiptap tu
// dong bieu dien tai lieu duoi dang cac block (moi <p>/<img> la mot block)
// nen anh chen giua bai viet chi la mot node trong cung mot document, khong
// can tu xay cau truc block rieng.
const ToolbarButton: React.FC<{
    active?: boolean;
    disabled?: boolean;
    title?: string;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, disabled, title, onClick, children }) => (
    <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={cn(
            "flex h-7 w-7 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40",
            active
                ? "bg-primary text-primary-foreground"
                : "text-text_2 hover:bg-ng_10 hover:text-text_1",
        )}
    >
        {children}
    </button>
);

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
    (
        {
            value,
            onChange,
            placeholder,
            onInsertImageClick,
            insertImageDisabled,
            insertImageTitle,
        },
        ref,
    ) => {
        const editor = useEditor({
            extensions: [
                StarterKit.configure({
                    blockquote: false,
                    bulletList: false,
                    codeBlock: false,
                    heading: false,
                    horizontalRule: false,
                    link: false,
                    listItem: false,
                    orderedList: false,
                    strike: false,
                }),
                Image.configure({
                    HTMLAttributes: { class: "rounded-lg max-w-full" },
                }),
                Placeholder.configure({
                    placeholder: placeholder || "Nội dung tin tức",
                }),
            ],
            content: value,
            onUpdate: ({ editor: e }) => onChange(e.getHTML()),
        });

        useEffect(() => {
            if (!editor) return;
            if (value !== editor.getHTML()) {
                editor.commands.setContent(value, { emitUpdate: false });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value, editor]);

        useImperativeHandle(ref, () => ({
            insertImage: (url: string) => {
                editor?.chain().focus().setImage({ src: url }).run();
            },
        }));

        if (!editor) return null;

        return (
            <div className="rounded-md border border-input bg-background">
                <div className="flex items-center gap-1 border-b border-divider_01 p-1.5">
                    <ToolbarButton
                        title="In đậm"
                        active={editor.isActive("bold")}
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        title="In nghiêng"
                        active={editor.isActive("italic")}
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Gạch chân"
                        active={editor.isActive("underline")}
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                    >
                        <UnderlineIcon className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    {onInsertImageClick && (
                        <>
                            <div className="mx-1 h-5 w-px bg-divider_01" />
                            <ToolbarButton
                                title={
                                    insertImageTitle ||
                                    "Chèn ảnh vào bài viết"
                                }
                                disabled={insertImageDisabled}
                                onClick={onInsertImageClick}
                            >
                                <ImagePlus className="h-3.5 w-3.5" />
                            </ToolbarButton>
                        </>
                    )}
                </div>
                <EditorContent
                    editor={editor}
                    className="rich-content max-h-[420px] min-h-[160px] overflow-y-auto px-3 py-2 text-sm [&_.ProseMirror]:outline-none"
                />
            </div>
        );
    },
);
RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;

export function isRichContentEmpty(html: string): boolean {
    return !html.replace(/<[^>]*>/g, "").trim();
}
