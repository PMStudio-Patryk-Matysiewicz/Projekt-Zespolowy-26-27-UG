// The games on offer. Used by the lobby cards and the player sidebar.
// When a game is ready, set `available: true`: its card and sidebar entry link to `path`.

export type GameId = 'blackjack' | 'makao' | 'racing'

export type Game = {
  id: GameId
  name: string
  path: string
  description: string
  tags: { label: string; tone: 'blue' | 'gold' | 'green' }[]
  meta: string
  available: boolean
}

export const games: Game[] = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    path: '/gry/blackjack',
    description: 'Ty + 1–4 boty AI przeciwko krupierowi. Shoe z 6 talii, split i double.',
    tags: [
      { label: 'Boty liczą Hi-Lo', tone: 'blue' },
      { label: '3:2', tone: 'gold' },
    ],
    meta: 'Min. stawka 10',
    available: false,
  },
  {
    id: 'makao',
    name: 'Makao',
    path: '/gry/makao',
    description: 'Ty kontra 1–3 boty. Wpisowe trafia do puli, a zwycięzca zabiera całość.',
    tags: [
      { label: 'ISMCTS na HARD', tone: 'blue' },
      { label: 'Pula', tone: 'gold' },
    ],
    meta: 'Wpisowe od 100',
    available: false,
  },
  {
    id: 'racing',
    name: 'Wyścigi konne',
    path: '/gry/wyscigi',
    description: 'Obstawiasz symulowane wyścigi. Kursy z Monte Carlo, zdarzenia losowe na torze.',
    tags: [
      { label: '5 typów zakładów', tone: 'blue' },
      { label: 'Na żądanie', tone: 'green' },
    ],
    meta: '8 koni w biegu',
    available: false,
  },
]
