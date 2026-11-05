import type { ComponentType } from 'react'

import type { GameId } from '../../games'
import { CardsIcon, FlagIcon, SpadeIcon } from '../icons'

export const gameIcons: Record<GameId, ComponentType<{ className?: string }>> = {
  blackjack: SpadeIcon,
  makao: CardsIcon,
  racing: FlagIcon,
}
