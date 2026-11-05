// Small inline icons shared by the pages, so we do not need an icon library.
// All are decorative: the text next to them carries the meaning.

type IconProps = { className?: string }

const common = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function LogoMark({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function BotIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5" />
    </svg>
  )
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </svg>
  )
}

export function CardsIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="8" y="7" width="12" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />
    </svg>
  )
}

export function SpadeIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3c3 3.5 7 6 7 9.5a3.5 3.5 0 0 1-6 2.4V17l1.5 3h-5L11 17v-2.1a3.5 3.5 0 0 1-6-2.4C5 9 9 6.5 12 3z" />
    </svg>
  )
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3.5" y="6" width="17" height="13" rx="2" />
      <path d="M3.5 10h17M16 14.5h1" />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  )
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M3 9h18M12 9v11M12 9c-1.5-3-5-3.5-5-1s5 1 5 1zM12 9c1.5-3 5-3.5 5-1s-5 1-5 1z" />
    </svg>
  )
}

export function CoinIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  )
}
