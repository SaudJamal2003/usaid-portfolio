'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

/**
 * Rich text for case study blocks.
 *
 * The extension set *is* the permission model: what the editor cannot produce,
 * the author cannot apply. No colour, font, size, alignment or class control
 * anywhere — the portfolio owns how this renders (§3, §62.14). The server
 * sanitises against the same allow-list, because the client's restraint is not
 * a security boundary.
 */

type ToolbarButton = {
  label: string
  title: string
  isActive: (editor: Editor) => boolean
  run: (editor: Editor) => void
}

const BUTTONS: ToolbarButton[] = [
  {
    label: 'B',
    title: 'Bold',
    isActive: (e) => e.isActive('bold'),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    label: 'I',
    title: 'Italic',
    isActive: (e) => e.isActive('italic'),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: 'H2',
    title: 'Heading 2',
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'H3',
    title: 'Heading 3',
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: '• List',
    title: 'Bullet list',
    isActive: (e) => e.isActive('bulletList'),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: '1. List',
    title: 'Numbered list',
    isActive: (e) => e.isActive('orderedList'),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: '❝',
    title: 'Quote',
    isActive: (e) => e.isActive('blockquote'),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    // Next renders this on the server first; Tiptap needs to own the DOM.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Only h2–h4: a case study page already owns its h1.
        heading: { levels: [2, 3, 4] },
        // Deliberately off — none of these have a place in this content, and
        // every one that stays on is a formatting decision handed to the author.
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noreferrer noopener' },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose-editor min-h-32 rounded-lg border border-line-strong bg-raised px-3 py-2 text-sm text-ink focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/30',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  /* Re-sync only when the incoming value is genuinely different, otherwise
     every keystroke would reset the selection to the document start. */
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return <div className="min-h-32 rounded-lg border border-line-strong bg-surface" />

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1">
        {BUTTONS.map((button) => {
          const active = button.isActive(editor)
          return (
            <button
              key={button.label}
              type="button"
              title={button.title}
              aria-label={button.title}
              aria-pressed={active}
              onClick={() => button.run(editor)}
              className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
                active ? 'bg-ink text-white' : 'border border-line text-ink-soft hover:bg-surface'
              }`}
            >
              {button.label}
            </button>
          )
        })}

        <button
          type="button"
          title="Link"
          aria-label="Link"
          aria-pressed={editor.isActive('link')}
          onClick={() => {
            if (editor.isActive('link')) {
              return editor.chain().focus().unsetLink().run()
            }
            const url = window.prompt('Link URL')
            if (!url) return
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          className={`h-7 rounded px-2 text-xs font-medium transition-colors ${
            editor.isActive('link')
              ? 'bg-ink text-white'
              : 'border border-line text-ink-soft hover:bg-surface'
          }`}
        >
          Link
        </button>

        <button
          type="button"
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="h-7 rounded px-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink"
        >
          Clear
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
