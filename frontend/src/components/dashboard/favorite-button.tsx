import { Heart } from 'lucide-react'

import { useFavoritesStore, type Favorite } from '../../stores/favorites-store'
import { IconButton } from '../ui/primitives'

export function FavoriteButton({ item }: { item: Favorite }) {
  const selected = useFavoritesStore((state) => state.contains(item.id))
  const toggle = useFavoritesStore((state) => state.toggle)
  return (
    <IconButton
      label={
        selected ? `Remove ${item.title} from favorites` : `Save ${item.title}`
      }
      className="size-8"
      onClick={() => toggle(item)}
    >
      <Heart className="size-3.5" fill={selected ? 'currentColor' : 'none'} />
    </IconButton>
  )
}
