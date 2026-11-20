import styles from './TableRules.module.css'

// Rules of the table, as in docs/architecture.md and backend/game_engine/blackjack.py.
const rules: [string, string][] = [
  ['Shoe', '6 talii'],
  ['Tasowanie', 'po ~75% shoe'],
  ['Krupier', 'staje na miękkim 17'],
  ['Blackjack', 'płaci 3:2'],
  ['Double', 'na dowolne dwie karty'],
  ['Split', 'jeden, asy po 1 karcie'],
  ['Insurance, surrender', 'brak'],
  ['Stawka', '10 – 1 000 żetonów'],
]

export default function TableRules() {
  return (
    <section aria-labelledby="rules-title">
      <h2 id="rules-title" className={styles.title}>
        Zasady stołu
      </h2>
      <dl className={styles.list}>
        {rules.map(([term, value]) => (
          <div key={term} className={styles.row}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
