import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const BTN = { width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'var(--sans)', fontSize: '.8rem', fontWeight: 700 }
const BTN_ACTIVE = { background: 'var(--jade-soft)', color: 'var(--jade)' }

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{ ...BTN, ...(active ? BTN_ACTIVE : {}) }}>
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 100 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'rte-content' },
    },
  })

  useEffect(() => {
    if (!editor) return
    if ((value || '') !== editor.getHTML()) editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  if (!editor) return null

  function setLink() {
    const url = window.prompt('URL del enlace:', editor.getAttributes('link').href || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--cream)', overflow: 'hidden' }}>
      <style>{`
        .rte-content { padding: .7rem .9rem; min-height: ${minHeight}px; font-size: .875rem; line-height: 1.65; color: var(--carbon); font-family: var(--sans); outline: none; }
        .rte-content p { margin: 0 0 .6rem; }
        .rte-content p:last-child { margin-bottom: 0; }
        .rte-content ul, .rte-content ol { margin: 0 0 .6rem; padding-left: 1.3rem; }
        .rte-content a { color: var(--jade); }
        .rte-content h3 { font-family: var(--serif); font-size: 1.02rem; margin: 0 0 .4rem; }
        .rte-content.is-empty:before { content: attr(data-placeholder); color: #B5B2AB; pointer-events: none; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.15rem', padding: '.35rem .5rem', borderBottom: '1px solid var(--border)', background: 'white', flexWrap: 'wrap' }}>
        <ToolBtn title="Negrita" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolBtn>
        <ToolBtn title="Cursiva" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><span style={{ fontStyle: 'italic' }}>I</span></ToolBtn>
        <ToolBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: 'line-through' }}>S</span></ToolBtn>
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 .25rem' }} />
        <ToolBtn title="Título" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H</ToolBtn>
        <ToolBtn title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolBtn>
        <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolBtn>
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 .25rem' }} />
        <ToolBtn title="Enlace" active={editor.isActive('link')} onClick={setLink}>🔗</ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
