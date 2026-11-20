import { UserIcon } from '../icons'
import styles from './SeatPicker.module.css'

type SeatPickerProps = {
  seats: readonly number[]
  value: number
  onChange: (seat: number) => void
  disabled?: boolean
}

// Seats around the half-round table, as radio buttons: arrow keys move between them.
export default function SeatPicker({ seats, value, onChange, disabled }: SeatPickerProps) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>Wybierz miejsce przy stole</legend>
      <p className={styles.hint}>Ruchy wykonuje się w kolejności miejsc, od 1 do 5.</p>

      <div className={styles.table}>
        <div className={styles.felt}>
          <span className={styles.dealer}>Krupier</span>
        </div>

        {seats.map((seat) => {
          const chosen = seat === value
          return (
            <label key={seat} className={`${styles.seat} ${styles[`seat${seat}`]} ${chosen ? styles.chosen : ''}`}>
              <input
                type="radio"
                name="seat"
                value={seat}
                checked={chosen}
                onChange={() => onChange(seat)}
                className={styles.radio}
              />
              <span className={styles.circle} aria-hidden="true">
                {chosen ? <UserIcon /> : seat}
              </span>
              <span className={styles.seatLabel}>
                Miejsce {seat}
                {chosen && (
                  <>
                    <span className={styles.separator}> · </span>
                    <span className={styles.you}>Ty</span>
                  </>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
