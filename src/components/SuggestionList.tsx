import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react'
import { type SuggestionItem, type SuggestionConfig } from '@/types/suggestions'
import styles from './RichTextEditor.module.css'

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SuggestionListProps<T extends SuggestionItem> {
  items: T[]
  config: SuggestionConfig<T>
  command: (item: T) => void
  selectedIndex: number
}

function SuggestionList<T extends SuggestionItem>({ 
  items, 
  config, 
  command, 
  selectedIndex 
}: SuggestionListProps<T>, ref: React.Ref<SuggestionListRef>) {
  const suggestionListRef = useRef<HTMLDivElement>(null)
  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }

  const upHandler = () => {
    // This will be handled by the parent component
  }

  const downHandler = () => {
    // This will be handled by the parent component
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      if (event.key === 'Escape') {
        return true
      }

      return false
    },
  }))

  if (items.length === 0) {
    return <div className={styles.suggestionListEmpty}>No results found</div>
  }

  useEffect(() => {
    if (suggestionListRef.current) {
      const item = suggestionListRef.current.children[selectedIndex]
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const defaultRender = (item: T): ReactNode => (
    <>
      <div className={styles.suggestionAvatar}>
        <div className={styles.suggestionAvatarPlaceholder}>
          {item.label.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className={styles.suggestionLabel}>{item.label}</div>
    </>
  )

  return (
    <div className={`${styles.suggestionList} ${config.className || ''}`} ref={suggestionListRef}>
      {items.map((item, index) => (
        <button
          className={`${styles.suggestionListItem} ${index === selectedIndex ? styles.selected : ''}`}
          key={item.id}
          onClick={() => selectItem(index)}
          type="button"
        >
          {config.render ? config.render(item) : defaultRender(item)}
        </button>
      ))}
    </div>
  )
}

export default forwardRef(SuggestionList) as <T extends SuggestionItem>(
  props: SuggestionListProps<T> & { ref?: React.Ref<SuggestionListRef> }
) => React.ReactElement