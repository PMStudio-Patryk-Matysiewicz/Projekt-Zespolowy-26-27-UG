// Chip denominations at the blackjack table.
export const CHIP_VALUES = [5, 25, 100, 500] as const

// Text on a chip: "25", "500", "1k" — chips are small.
export function formatChipValue(value: number): string {
  return value >= 1000 && value % 1000 === 0 ? `${value / 1000}k` : String(value)
}

// Splits an amount into chips, biggest first, for drawing a stack: 150 -> [100, 25, 25].
// Anything below the smallest chip is left out.
export function toChips(amount: number): number[] {
  const chips: number[] = []
  let rest = amount
  for (const value of [...CHIP_VALUES].reverse()) {
    while (rest >= value) {
      chips.push(value)
      rest -= value
    }
  }
  return chips
}
