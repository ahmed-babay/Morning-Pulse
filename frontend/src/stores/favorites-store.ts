import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Favorite {
  id: string
  kind: 'story' | 'asset' | 'quote' | 'tip' | 'event'
  title: string
  subtitle?: string
  url?: string
}

interface FavoritesState {
  favorites: Favorite[]
  toggle: (favorite: Favorite) => void
  contains: (id: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (favorite) =>
        set((state) => ({
          favorites: state.favorites.some((item) => item.id === favorite.id)
            ? state.favorites.filter((item) => item.id !== favorite.id)
            : [favorite, ...state.favorites].slice(0, 50),
        })),
      contains: (id) => get().favorites.some((item) => item.id === id),
    }),
    { name: 'morning-pulse-favorites' },
  ),
)
