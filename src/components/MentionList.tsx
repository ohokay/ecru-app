import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface MentionListProps {
  items: Array<{ id: string; label: string; avatar?: string }>
  command: (item: { id: string; label: string }) => void
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item.id, label: item.label })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

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

      return false
    },
  }))

  if (props.items.length === 0) {
    return <div className="mention-list-empty">No users found</div>
  }

  return (
    <div className="mention-list">
      {props.items.map((item, index) => (
        <button
          className={`mention-list-item ${index === selectedIndex ? 'selected' : ''}`}
          key={item.id}
          onClick={() => selectItem(index)}
          type="button"
        >
          <div className="mention-avatar">
            {item.avatar ? (
              <img src={item.avatar} alt={item.label} />
            ) : (
              <div className="mention-avatar-placeholder">
                {item.label.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mention-label">{item.label}</div>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = 'MentionList'