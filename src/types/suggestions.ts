export interface SuggestionItem {
  id: string
  label: string
  [key: string]: any
}

export interface SuggestionConfig<T extends SuggestionItem = SuggestionItem> {
  char: string
  items: (props: { query: string; editor: any }) => Promise<T[]> | T[]
  render?: (item: T) => React.ReactNode
  searchKey?: keyof T | ((item: T, query: string) => boolean)
  className?: string
  maxItems?: number
  htmlAttributes?: Record<string, any>
}

export interface SuggestionState<T extends SuggestionItem = SuggestionItem> {
  isOpen: boolean
  query: string
  position: { top: number; left: number }
  selectedIndex: number
  items: T[]
  config: SuggestionConfig<T> | null
  command: ((item: T) => void) | null
}