import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TasksResponse } from '../../pocketbase-types'
import { useTasks } from '@/hooks/useTasks'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RichTextEditor } from '@/components/RichTextEditor'
import { extractHeadingFromHtml } from '@/utils/extractHeadingFromHtml'

interface SortableTaskItemProps {
  task: TasksResponse
  onToggleComplete: (task: TasksResponse) => void
  onDelete: (taskId: string) => void
  isToggling: boolean
  isDeleting: boolean
}

function SortableTaskItem({ task, onToggleComplete, onDelete, isToggling, isDeleting }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id})

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="task-item"
    >
      <div className="task-content">
        <input
          type="checkbox"
          checked={!!task.completed}
          onChange={() => onToggleComplete(task)}
          disabled={isToggling}
        />
        <div className="task-details">
          <h3>{task.title}</h3>
          {task.description && <p>{task.description}</p>}
          {task.rich_description && (
            <div 
              className="task-rich-description"
              dangerouslySetInnerHTML={{ __html: task.rich_description }}
            />
          )}
          <small>Created: {new Date(task.created).toLocaleDateString()}</small>
        </div>
        <div className="task-actions">
          <button 
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="delete-button"
            title="Delete task"
          >
            x
          </button>
          <div className="drag-handle" {...listeners}>
            ⋮⋮
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_layout/')({
  component: () => <ProtectedRoute><TasksComponent /></ProtectedRoute>,
})

function TasksComponent() {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskRichDescription, setNewTaskRichDescription] = useState('')
  const [extractedTitle, setExtractedTitle] = useState('')

  const {
    pendingTasks,
    createTask,
    toggleTaskComplete,
    reorderTasks,
    deleteTask,
    isCreating,
    isToggling,
    isDeleting,
  } = useTasks()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extract heading from rich description as user types
  useEffect(() => {
    if (newTaskRichDescription) {
      const heading = extractHeadingFromHtml(newTaskRichDescription)
      setExtractedTitle(heading || '')
    } else {
      setExtractedTitle('')
    }
  }, [newTaskRichDescription])

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Require either a title or rich description with heading
    if (!newTaskTitle.trim() && !newTaskRichDescription.trim()) {
      return
    }

    createTask({
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      rich_description: newTaskRichDescription || undefined,
    })
    
    // Clear form after successful creation
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskRichDescription('')
    setExtractedTitle('')
  }

  const handleToggleComplete = (task: TasksResponse) => {
    toggleTaskComplete(task)
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = pendingTasks.findIndex(task => task.id === active.id)
    const newIndex = pendingTasks.findIndex(task => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedTasks = arrayMove(pendingTasks, oldIndex, newIndex)
    
    // Calculate new positions
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index + 1
    }))

    reorderTasks(updates)
  }

  return (
    <div className="tasks-container">
      <h1>My Tasks</h1>
      
      <form onSubmit={handleCreateTask} className="task-form">
        <h2>Create New Task</h2>
        <div className="form-group">
          <label htmlFor="title">Title (optional if rich description has heading):</label>
          <input
            type="text"
            id="title"
            value={newTaskTitle || extractedTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title or leave blank to use heading from rich description..."
          />
          {!newTaskTitle.trim() && extractedTitle && (
            <div className="extracted-title-preview">
              Will use heading as title: <strong>"{extractedTitle}"</strong>
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="rich-description">Rich Description (optional):</label>
          <RichTextEditor
            content={newTaskRichDescription}
            onChange={setNewTaskRichDescription}
            placeholder="Add detailed notes, formatting, lists..."
          />
        </div>
        
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      <div className="tasks-section">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pendingTasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="task-list">
              {pendingTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  isToggling={isToggling}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}