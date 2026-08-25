import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const BTN = { width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0 }
const BTN_ACTIVE = { background: 'var(--jade-soft)', color: 'var(--jade-ink)' }

const RTE_IC = {
  bold:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  italic:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  strike:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 2.3 7.44"/><path d="M6.3 19.44A4 4 0 0 0 8 20h6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
  heading:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6v12"/><path d="M12 6v12"/><path d="M4 12h8"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2c1.7 0 2.5 1 2.5 2a2.5 2.5 0 0 1-4.5 1.5"/></svg>,
  bullet:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none"/><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>,
  ordered:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><path d="M4.5 5.5v3"/><path d="M3.8 5.5h1.4"/><path d="M3.8 11.5h1.6c.5 0 .8.6.4 1L4 14h1.8"/></svg>,
  link:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  undo:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>,
  redo:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>,
}

function ToolBtn({ active, disabled, onClick, title, children }) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      // Toolbar buttons must not steal focus from the editor on mousedown —
      // otherwise the current selection collapses before onClick runs, so a
      // second click (e.g. to un-bold already-bold text) has nothing to act on.
      onMouseDown={e => e.preventDefault()}
      className="rte-btn" style={{ ...BTN, ...(active ? BTN_ACTIVE : {}) }}>
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
    if (!editor || editor.isDestroyed) return
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
        .rte-content ul { list-style-type: disc; }
        .rte-content ol { list-style-type: decimal; }
        .rte-content li { margin-bottom: .2rem; }
        .rte-content li p { margin: 0; }
        .rte-content a { color: var(--jade); }
        .rte-content h3 { font-family: var(--serif); font-size: 1.02rem; margin: 0 0 .4rem; }
        .rte-content.is-empty:before { content: attr(data-placeholder); color: var(--text-3); pointer-events: none; }
        .rte-btn:hover:not(:disabled) { background: var(--jade-soft); color: var(--jade-ink); }
        .rte-btn:focus-visible { outline: 2px solid var(--jade); outline-offset: 1px; }
        .rte-btn:disabled { opacity: .35; cursor: not-allowed; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.15rem', padding: '.35rem .5rem', borderBottom: '1px solid var(--border)', background: 'white', flexWrap: 'wrap' }}>
        <ToolBtn title="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>{RTE_IC.undo}</ToolBtn>
        <ToolBtn title="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>{RTE_IC.redo}</ToolBtn>
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 .25rem' }} />
        <ToolBtn title="Negrita" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>{RTE_IC.bold}</ToolBtn>
        <ToolBtn title="Cursiva" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>{RTE_IC.italic}</ToolBtn>
        <ToolBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>{RTE_IC.strike}</ToolBtn>
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 .25rem' }} />
        <ToolBtn title="Encabezado" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>{RTE_IC.heading}</ToolBtn>
        <ToolBtn title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>{RTE_IC.bullet}</ToolBtn>
        <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{RTE_IC.ordered}</ToolBtn>
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 .25rem' }} />
        <ToolBtn title="Enlace" active={editor.isActive('link')} onClick={setLink}>{RTE_IC.link}</ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
