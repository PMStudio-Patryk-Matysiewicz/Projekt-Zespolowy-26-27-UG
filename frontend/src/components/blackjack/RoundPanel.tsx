import type { BlackjackTable, HandView } from '../../api/blackjack'
import { handTotal, playerHands, resultLabels } from '../../blackjack'
import { cardShort } from '../../cards'
import { formatChips, formatSignedChips } from '../../format'
import styles from './RoundPanel.module.css'

type Entry = { key: string; who: string; detail: string; status: string; tone: 'win' | 'loss' | 'turn' | 'muted' }

function cardsText(cards: (string | null)[]): string {
  return cards.map(cardShort).join(' + ')
}

// Where one of the player's hands stands now.
function handStatus(table: BlackjackTable, hand: HandView, index: number): Pick<Entry, 'status' | 'tone'> {
  if (table.phase === 'settled' && hand.result) {
    const net = (hand.payout ?? 0) - hand.bet
    return { status: net === 0 ? resultLabels[hand.result] : formatSignedChips(net), tone: net > 0 ? 'win' : net < 0 ? 'loss' : 'muted' }
  }
  if (hand.total > 21) return { status: 'fura', tone: 'loss' }
  const myTurn = table.turn?.seat === String(table.seat)
  if (myTurn && table.turn!.hand === index) return { status: 'Twój ruch', tone: 'turn' }
  if (myTurn && index > table.turn!.hand) return { status: 'czeka', tone: 'muted' }
  return { status: hand.doubled ? 'podwojona' : 'stoi', tone: 'muted' }
}

function entries(table: BlackjackTable): Entry[] {
  const hands = playerHands(table)
  if (hands.length === 0) return []

  const { cards, total } = table.dealer
  const dealer: Entry = {
    key: 'dealer',
    who: 'Krupier',
    detail: cardsText(cards),
    status: table.phase === 'settled' ? (total > 21 ? `${total} · fura` : String(total)) : `pokazuje ${total}`,
    tone: table.phase === 'settled' && total > 21 ? 'loss' : 'muted',
  }

  const mine = hands.map((hand, index) => ({
    key: `hand-${index}`,
    who: hands.length > 1 ? `Ty · ręka ${index + 1}` : 'Ty',
    detail: `${cardsText(hand.cards)} = ${handTotal(hand)} · stawka ${formatChips(hand.bet)}`,
    ...handStatus(table, hand, index),
  }))

  return [dealer, ...mine]
}

// Right-hand panel: how the round goes ("Przebieg rundy") or how it ended ("Wyniki rundy"),
// one line per hand. Bots will add their own lines here (separate task).
export default function RoundPanel({ table }: { table: BlackjackTable }) {
  const settled = table.phase === 'settled'
  const list = entries(table)

  return (
    <aside className={styles.panel} aria-labelledby="round-title">
      <h2 id="round-title" className={styles.title}>
        {settled ? 'Wyniki rundy' : 'Przebieg rundy'}
      </h2>

      {list.length === 0 ? (
        <p className={styles.empty}>Postaw zakład, aby zacząć rundę.</p>
      ) : (
        <ul className={styles.list}>
          {list.map((entry) => (
            <li key={entry.key} className={`${styles.entry} ${styles[entry.tone]}`}>
              <span className={styles.who}>{entry.who}</span>
              <span className={styles.status}>{entry.status}</span>
              <span className={styles.detail}>{entry.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
