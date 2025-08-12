import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import type { TasksResponse } from '../../pocketbase-types'
import type { AppContext } from '@/routes/__root'
import { extractHeadingFromHtml } from '@/utils/extractHeadingFromHtml'

export function useTasks() {
  const { pb } = useRouteContext({ from: '__root__' }) as AppContext
  const queryClient = useQueryClient()

  // Query for fetching all tasks
  const { data: tasks } = useSuspenseQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const user = pb.authStore.record
      if (!user) throw new Error('Not authenticated')
      
      return await pb.collection('tasks').getFullList<TasksResponse>({
        filter: `user = "${user.id}"`,
        sort: 'position,-created',
      })
    },
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; description?: string; rich_description?: string }) => {
      const user = pb.authStore.record
      if (!user) throw new Error('Not authenticated')

      // Extract heading from rich description if title is empty
      let finalTitle = taskData.title
      if (!finalTitle.trim() && taskData.rich_description) {
        const extractedTitle = extractHeadingFromHtml(taskData.rich_description)
        if (extractedTitle) {
          finalTitle = extractedTitle
        }
      }

      // Get all existing pending tasks to shift their positions
      const existingTasks = await pb.collection('tasks').getFullList<TasksResponse>({
        filter: `user = "${user.id}" && completed = ""`,
        sort: 'position',
      })

      // Shift all existing task positions down by 1
      const batch = pb.createBatch()
      existingTasks.map((task, index) =>
        batch.collection('tasks').update(task.id, { position: index + 2 })
      )

      // Create new task at position 1 (top)
      const newTask = batch.collection('tasks').create({
        title: finalTitle,
        description: taskData.description,
        rich_description: taskData.rich_description,
        user: user.id,
        position: 1,
      })
      await batch.send()
      return newTask
    },
    onMutate: async (taskData: { title: string; description?: string; rich_description?: string }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TasksResponse[]>(['tasks'])

      // Optimistically update to the new value
      if (previousTasks) {
        const user = pb.authStore.record
        if (user) {
          // Extract heading from rich description if title is empty
          let optimisticTitle = taskData.title
          if (!optimisticTitle.trim() && taskData.rich_description) {
            const extractedTitle = extractHeadingFromHtml(taskData.rich_description)
            if (extractedTitle) {
              optimisticTitle = extractedTitle
            }
          }

          // Create optimistic new task
          const optimisticTask: TasksResponse = {
            id: `temp-${Date.now()}`, // Temporary ID
            title: optimisticTitle,
            description: taskData.description || '',
            rich_description: taskData.rich_description || '',
            position: 1,
            priority: '1' as any, // Default priority
            completed: '',
            user: user.id,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            collectionId: 'tasks',
            collectionName: 'tasks' as any,
          }

          // Update positions of existing pending tasks
          const updatedTasks = previousTasks.map(task => {
            if (!task.completed) {
              return { ...task, position: (task.position || 0) + 1 }
            }
            return task
          })

          // Add new task at the beginning of the list
          const newTasksList = [optimisticTask, ...updatedTasks]
          
          queryClient.setQueryData(['tasks'], newTasksList)
        }
      }

      // Return a context with the previous tasks
      return { previousTasks }
    },
    onError: (_err, _taskData, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (task: TasksResponse) => {
      const updateData = task.completed 
        ? { completed: '' } // Clear completion date
        : { completed: new Date().toISOString() } // Set completion date
      
      return await pb.collection('tasks').update(task.id, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Reorder tasks mutation
  const reorderTasksMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      const user = pb.authStore.record
      if (!user) throw new Error('Not authenticated')

      const batch = pb.createBatch()
      updates.forEach(update => {
        batch.collection('tasks').update(update.id, { position: update.position })
      })
      await batch.send()
    },
    onMutate: async (updates: Array<{ id: string; position: number }>) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TasksResponse[]>(['tasks'])

      // Optimistically update to the new value
      if (previousTasks) {
        const updatedTasks = previousTasks.map(task => {
          const update = updates.find(u => u.id === task.id)
          return update ? { ...task, position: update.position } : task
        })
        
        // Sort by position to reflect the new order
        updatedTasks.sort((a, b) => (a.position || 0) - (b.position || 0))
        
        queryClient.setQueryData(['tasks'], updatedTasks)
      }

      // Return a context with the previous and new tasks
      return { previousTasks }
    },
    onError: (_err, _updates, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await pb.collection('tasks').delete(taskId)
    },
    onMutate: async (taskId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TasksResponse[]>(['tasks'])

      // Optimistically remove the task
      if (previousTasks) {
        const updatedTasks = previousTasks.filter(task => task.id !== taskId)
        queryClient.setQueryData(['tasks'], updatedTasks)
      }

      // Return a context with the previous tasks
      return { previousTasks }
    },
    onError: (_err, _taskId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Computed values
  const completedTasks = tasks.filter(task => task.completed)
  const pendingTasks = tasks.filter(task => !task.completed)

  return {
    // Data
    tasks,
    completedTasks,
    pendingTasks,
    
    // Mutations
    createTask: createTaskMutation.mutate,
    toggleTaskComplete: toggleTaskMutation.mutate,
    reorderTasks: reorderTasksMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    
    // Loading states
    isCreating: createTaskMutation.isPending,
    isToggling: toggleTaskMutation.isPending,
    isReordering: reorderTasksMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  }
}