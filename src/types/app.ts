import type { QueryClient } from '@tanstack/react-query'
import type TypedPocketBase from 'pocketbase'

export type AppContext = {
  queryClient: QueryClient
  pb: TypedPocketBase
}
