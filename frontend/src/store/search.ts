import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface StoredSearchParams {
  service_type?: string
  destination?: string
  origin?: string
  start_date?: string
  end_date?: string
  guests?: number
  rooms?: number
  passengers?: number
  cabin_class?: string
  category?: string
  page?: number
  per_page?: number
  sort?: string
  [key: string]: unknown
}

interface SearchState {
  params: StoredSearchParams
  results: unknown[]
  total: number
  isLoading: boolean
  error: string | null
  setParams: (params: StoredSearchParams) => void
  setResults: (results: unknown[], total?: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearResults: () => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      params: {},
      results: [],
      total: 0,
      isLoading: false,
      error: null,

      setParams: (params) => set({ params }),

      setResults: (results, total) =>
        set({ results, total: total ?? results.length, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearResults: () => set({ results: [], total: 0, params: {}, error: null }),
    }),
    {
      name: 'eventraos-search',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ params: state.params }),
    }
  )
)