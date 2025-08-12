import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'
import styles from './RichTextEditor.module.css'
import { type SuggestionConfig } from '../types/suggestions'
import { useSuggestions } from '../hooks/useSuggestions'
import SuggestionList from './SuggestionList'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  floatingToolbar?: boolean
  suggestionConfigs?: SuggestionConfig[]
}

// Default user suggestions - can be overridden via suggestionConfigs prop
const DEFAULT_USERS = [
  { id: '1', label: 'John Doe' },
  { id: '2', label: 'Jane Smith' },
  { id: '3', label: 'Mike Johnson' },
  { id: '4', label: 'Sarah Wilson' },
  { id: '5', label: 'Alex Chen' },
  { id: '6', label: 'Emma Davis' },
]

const DEFAULT_TAGS = [
  { id: '1', label: 'Tag 1' },
  { id: '2', label: 'Tag 2' },
  { id: '3', label: 'Tag 3' },
]

const createDefaultSuggestionConfigs = (): SuggestionConfig[] => [
  {
    char: '@',
    items: ({ query }: { query: string; editor: any }) => DEFAULT_USERS.filter(user => 
      user.label.toLowerCase().includes(query.toLowerCase())
    ),
    maxItems: 5,
    className: 'mention-suggestions'
  },
  {
    char: '/',
    items: ({ query }: { query: string; editor: any }) => DEFAULT_TAGS.filter(tag => 
      tag.label.toLowerCase().includes(query.toLowerCase())
    ),
  }
]

function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...", 
  className, 
  floatingToolbar = false,
  suggestionConfigs = createDefaultSuggestionConfigs()
}: RichTextEditorProps) {
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [isTyping, setIsTyping] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  
  const { suggestionState, createSuggestionHandlers, handleSuggestionSelect } = useSuggestions(suggestionConfigs)

  // No longer needed - handled by useSuggestions hook

  // Helper function to position toolbar at cursor
  const positionToolbarAtCursor = (editor: any) => {
    const { selection } = editor.state
    const { view } = editor
    const pos = view.coordsAtPos(selection.$head.pos)
    
    if (editorRef.current) {
      const toolbarWidth = 300
      const toolbarHeight = 40
      
      let left = pos.left - toolbarWidth / 2
      let top = pos.top - toolbarHeight - 10
      
      // Keep within viewport bounds
      const viewportWidth = window.innerWidth
      
      if (left < 10) left = 10
      if (left + toolbarWidth > viewportWidth - 10) left = viewportWidth - toolbarWidth - 10
      if (top < 10) top = pos.top + 30
      
      setToolbarPosition({ top, left })
      return true
    }
    return false
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        suggestions: suggestionConfigs.map(config => ({
          char: config.char,
          items: config.items,
          render: () => createSuggestionHandlers(config),
          HTMLAttributes: {
            class: styles.mention,
            ...config.htmlAttributes
          },
        }))
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      
      // Handle floating toolbar on type
      if (floatingToolbar) {
        setIsTyping(true)
        if (positionToolbarAtCursor(editor)) {
          setShowFloatingToolbar(true)
        }
        
        // Clear typing state after a delay
        setTimeout(() => {
          setIsTyping(false)
          if (floatingToolbar && editor.state.selection.empty) {
            setShowFloatingToolbar(false)
          }
        }, 2000)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection
      
      if (empty) {
        // Handle cursor position for typing mode
        if (floatingToolbar && isTyping) {
          positionToolbarAtCursor(editor)
        } else if (!floatingToolbar || !isTyping) {
          setShowFloatingToolbar(false)
        }
        return
      }

      // Show toolbar for text selection (original behavior)
      const { view } = editor
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      
      if (editorRef.current) {
        const toolbarWidth = 300
        const toolbarHeight = 40
        
        // Calculate position for selection
        const selectionCenterX = (start.left + end.left) / 2
        const selectionTop = start.top
        
        let left = selectionCenterX - toolbarWidth / 2
        let top = selectionTop - toolbarHeight - 10
        
        // Keep within viewport bounds
        const viewportWidth = window.innerWidth
        
        if (left < 10) left = 10
        if (left + toolbarWidth > viewportWidth - 10) left = viewportWidth - toolbarWidth - 10
        if (top < 10) top = selectionTop + 30
        
        setToolbarPosition({ top, left })
        setShowFloatingToolbar(true)
      }
    },
    editorProps: {
      attributes: {
        class: styles.richTextContent,
      },
    },
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, { parseOptions: { preserveWhitespace: 'full' } })
    }
  }, [editor, content])

  if (!editor) {
    return <div>Loading rich text editor...</div>
  }

  // Suggestion selection logic now handled by useSuggestions hook

  return (
    <>
      <div ref={editorRef} className={`${styles.richTextEditor} ${className || ''}`}>
        <EditorContent 
          editor={editor} 
        />
      </div>
      
      {suggestionState.isOpen && suggestionState.config && suggestionState.items.length > 0 && (
        <div 
          className={styles.suggestionContainer}
          style={{
            position: 'fixed',
            top: `${suggestionState.position.top}px`,
            left: `${suggestionState.position.left}px`,
            zIndex: 1000,
          }}
        >
          <SuggestionList
            items={suggestionState.items}
            config={suggestionState.config}
            command={handleSuggestionSelect}
            selectedIndex={suggestionState.selectedIndex}
          />
        </div>
      )}
      
      {showFloatingToolbar && (
        <div 
          ref={toolbarRef}
          className={styles.floatingToolbar}
          style={{
            position: 'fixed',
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
          >
            <strong>Bold</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <div className={styles.toolbarSeparator}></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
            title="Heading 3"
          >
            H3
          </button>
          <div className={styles.toolbarSeparator}></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="Numbered List"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}
            title="Quote"
          >
            "
          </button>
        </div>
      )}
    </>
  )
}

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }