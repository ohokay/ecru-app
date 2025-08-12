import { useState, useRef, useEffect, useCallback } from 'react'
import { type SuggestionItem, type SuggestionConfig, type SuggestionState } from '@/types/suggestions'

export function useSuggestions<T extends SuggestionItem>(
  _configs: SuggestionConfig<T>[]
) {
  const [suggestionState, setSuggestionState] = useState<SuggestionState<T>>({
    isOpen: false,
    query: '',
    position: { top: 0, left: 0 },
    selectedIndex: 0,
    items: [],
    config: null,
    command: null
  })

  const selectedIndexRef = useRef(0)
  const queryRef = useRef('')
  const commandRef = useRef<((item: T) => void) | null>(null)
  const itemsRef = useRef<T[]>([])

  useEffect(() => {
    selectedIndexRef.current = suggestionState.selectedIndex
  }, [suggestionState.selectedIndex])

  useEffect(() => {
    queryRef.current = suggestionState.query
  }, [suggestionState.query])

  useEffect(() => {
    commandRef.current = suggestionState.command
  }, [suggestionState.command])

  useEffect(() => {
    itemsRef.current = suggestionState.items
  }, [suggestionState.items])

  const filterItems = useCallback(async (config: SuggestionConfig<T>, query: string): Promise<T[]> => {
    const allItems = await Promise.resolve(config.items({ query, editor: null }))
    
    if (!config.searchKey) {
      return allItems.slice(0, config.maxItems || 5)
    }

    let filtered: T[]
    if (typeof config.searchKey === 'function') {
      filtered = allItems.filter(item => (config.searchKey as (item: T, query: string) => boolean)(item, query))
    } else {
      filtered = allItems.filter(item => {
        const searchValue = item[config.searchKey as keyof T]
        return String(searchValue).toLowerCase().includes(query.toLowerCase())
      })
    }

    return filtered.slice(0, config.maxItems || 5)
  }, [])

  const createSuggestionHandlers = useCallback((config: SuggestionConfig<T>) => ({
    onStart: async (props: any) => {
      // Close any existing suggestions first
      setSuggestionState(prev => ({ ...prev, isOpen: false }))
      
      const items = await filterItems(config, props.query)
      
      // Get position with better error handling
      let position = { top: 0, left: 0 }
      if (props.clientRect) {
        try {
          const rect = props.clientRect()
          if (rect) {
            position = {
              top: rect.bottom + window.scrollY + 5, // Add small offset
              left: rect.left + window.scrollX
            }
          }
        } catch (error) {
          console.warn('Error getting client rect:', error)
        }
      }
      
      // Small delay to ensure clean state transition
      setTimeout(() => {
        setSuggestionState({
          isOpen: true,
          query: props.query,
          position,
          selectedIndex: 0,
          items,
          config,
          command: props.command
        })
      }, 10)
    },

    onUpdate: async (props: any) => {
      const items = await filterItems(config, props.query)
      
      // Update position with better error handling
      let newPosition = undefined
      if (props.clientRect) {
        try {
          const rect = props.clientRect()
          if (rect) {
            newPosition = {
              top: rect.bottom + window.scrollY + 5, // Add small offset
              left: rect.left + window.scrollX
            }
          }
        } catch (error) {
          console.warn('Error getting client rect on update:', error)
        }
      }
      
      setSuggestionState(prev => ({
        ...prev,
        query: props.query,
        items,
        selectedIndex: Math.min(prev.selectedIndex, Math.max(0, items.length - 1)),
        position: newPosition || prev.position
      }))
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        setSuggestionState(prev => ({ ...prev, isOpen: false }))
        return true
      }

      // Get current state values from refs to ensure we have the latest values
      const currentItems = itemsRef.current
      const currentIndex = selectedIndexRef.current
      
      // Return false if no items to navigate
      if (!currentItems.length) {
        return false
      }
      
      if (props.event.key === 'ArrowUp') {
        const newIndex = Math.max(0, currentIndex - 1)
        setSuggestionState(prev => ({ ...prev, selectedIndex: newIndex }))
        selectedIndexRef.current = newIndex
        return true
      }

      if (props.event.key === 'ArrowDown') {
        const newIndex = Math.min(currentItems.length - 1, currentIndex + 1)
        setSuggestionState(prev => ({ ...prev, selectedIndex: newIndex }))
        selectedIndexRef.current = newIndex
        return true
      }

      if (props.event.key === 'Enter') {
        const selectedItem = currentItems[currentIndex]
        if (selectedItem && commandRef.current) {
          commandRef.current(selectedItem)
          setSuggestionState(prev => ({ ...prev, isOpen: false }))
        }
        return true
      }

      return false
    },

    onExit: () => {
      setSuggestionState(prev => ({ 
        ...prev, 
        isOpen: false, 
        command: null 
      }))
    }
  }), [filterItems])

  const handleSuggestionSelect = useCallback((item: T) => {
    if (commandRef.current) {
      commandRef.current(item)
      setSuggestionState(prev => ({ ...prev, isOpen: false }))
    }
  }, [])

  return {
    suggestionState,
    createSuggestionHandlers,
    handleSuggestionSelect
  }
}