# ZeroRisk – architektura

Dokument opisuje architekturę projektu ZeroRisk: przegląd systemu, przypadki użycia, model danych (ERD) i diagramy klas.
Diagramy są w Mermaid – GitHub renderuje je bezpośrednio w podglądzie pliku.

## Założenia do potwierdzenia przez zespół

- Wyścigi są **na żądanie**: gracz tworzy wyścig, widzi konie i kursy, obstawia, a serwer od razu liczy wynik (z seeda). Frontend tylko animuje gotowy przebieg.
- Waluta to całe **żetony** (liczby całkowite, bez groszy). Nowy gracz dostaje startową pulę, potem bonus dzienny.
- **Makao**: gracz kontra 1–3 boty z wybranym poziomem trudności. Wpisowe trafia do puli, wygrany zabiera pulę.
- Ranking jest liczony z danych (saldo / wygrane), bez osobnej tabeli.

## Ustalenia – wyścigi konne

- Konie są **symulowane algorytmicznie** (statystyki + styl biegu + forma dnia + warunki toru + losowość z seeda), nie przez wytrenowany model.
- Taktyka konia jest wydzielona za interfejsem `PacingStrategy`. Opcjonalnie (jeśli starczy czasu) dochodzi `RLPacingStrategy` – „dżokej” wytrenowany offline metodą RL na naszym symulatorze.
- W trakcie wyścigu występują **zdarzenia losowe**: potknięcie, zryw, kontuzja, upadek, zły start. Losowane z seeda wyścigu, więc są odtwarzalne.
- Kontuzja działa **tylko do końca wyścigu** – konie nie mają stanu przenoszonego między wyścigami.
- Kursy liczone metodą **Monte Carlo** (wiele symulacji z różnymi seedami), więc automatycznie uwzględniają zdarzenia losowe.
- Typy zakładów: **zwycięzca, miejsce (top 3), dwójka w dowolnej kolejności, dokładna dwójka, dokładna trójka**.
- Koń, który nie ukończył wyścigu (DNF), przegrywa wszystkie zakłady, w których występuje.

## Ustalenia – blackjack

- Przy stole siedzi **gracz + 1–4 boty** (5 miejsc), wszyscy grają przeciwko krupierowi. Gracz wybiera miejsce przy otwarciu stołu; ruchy wykonuje się w kolejności miejsc.
- Sesja blackjacka to **stół z wieloma rundami**. Karty idą z **shoe** (6 talii), który przechodzi między rundami i jest tasowany po przekroczeniu karty cięcia (~75% shoe) – bez tego liczenie kart nie miałoby sensu.
- Zasady: hit, stand, double, **split** (jedno rozdzielenie, bez ponownego splitu; rozdzielone asy dostają po jednej karcie). Bez insurance i surrender. Krupier staje na miękkim 17, blackjack płaci 3:2.
- Boty **liczą karty systemem Hi-Lo**. Poziomy:
  - EASY – podstawowa strategia, stała stawka, bez liczenia,
  - MEDIUM – podstawowa strategia + stawka zależna od true count,
  - HARD – stawka jak MEDIUM, a decyzje z **tabeli wyuczonej przez Q-learning** (uwzględnia true count, więc sama „odkrywa” odstępstwa od strategii).
- Boty są **tymczasowe** – powstają przy otwarciu stołu, ich żetony żyją tylko w stanie gry (JSONB). Bot bez żetonów odchodzi od stołu.
- Gracz widzi liczenie **tylko po zachowaniu botów** (rosnące stawki). Licznik (`CardCounter`) jest osobną klasą, żeby później dodać **tryb treningu liczenia kart** bez zmian w silniku.

## Ustalenia – AI botów

- Bez płatnych API i bez LLM. Wszystko liczy się lokalnie w `game_engine`, na zwykłym CPU.
- **Blackjack – Q-learning (uczenie ze wzmocnieniem).** Agent trenuje offline (skrypt, kilka milionów rozdań w `BlackjackGame`) i zapisuje tabelę Q do JSON. W runtime bot tylko ją odczytuje. Na prezentację: heatmapa strategii wyuczonej przez AI obok podręcznikowej podstawowej strategii + krzywa uczenia.
- **Makao – ISMCTS (Information Set Monte Carlo Tree Search).** Bez treningu i danych: przed ruchem bot losuje możliwe karty przeciwników zgodnie z tym, co widział, rozgrywa wiele symulacji i wybiera najlepszy ruch. Poziom trudności = liczba iteracji. Na prezentację: turniej botów (Random vs Heurystyka vs ISMCTS) z tabelą win-rate.
- Opcjonalnie: komentarze botów przy stole z puli szablonów tekstowych (bez AI).
- Szacowany nakład: Q-learning ~15 h, ISMCTS ~20–25 h, turniej i wykresy ~5 h.

---

## 1. Przegląd systemu

```mermaid
flowchart TB
    browser["Przeglądarka<br/>React SPA (Vite + TypeScript)"]

    subgraph vps["VPS – Docker Compose"]
        nginx["nginx<br/>statyki Reacta + reverse proxy"]
        subgraph django["Django + DRF (gunicorn)"]
            apps["Django apps<br/>accounts · wallet · blackjack<br/>makao · racing · leaderboard"]
            engine["game_engine<br/>czysty Python, bez Django"]
            apps --> engine
        end
        db[("PostgreSQL")]
    end

    browser -- "HTTPS, REST/JSON" --> nginx
    nginx -- "/api/*" --> apps
    apps --> db
```

Zasada: `game_engine` nie importuje niczego z Django. Django apps odpowiadają za użytkownika, portfel, bazę i API; `game_engine` – tylko za reguły gier, boty i symulację.

---

## 2. Diagram przypadków użycia

Mermaid nie ma natywnego diagramu przypadków użycia, więc są one narysowane jako flowchart: aktorzy na zewnątrz, przypadki użycia w zaokrąglonych węzłach wewnątrz granicy systemu. Dla czytelności podzielone są na trzy obszary.

### 2.1. Konto i portfel

```mermaid
flowchart LR
    guest(["👤 Gość"])
    player(["👤 Gracz"])

    subgraph zr["ZeroRisk – konto i portfel"]
        uc_register(["Zarejestruj się"])
        uc_login(["Zaloguj się"])
        uc_rank(["Przeglądaj ranking"])
        uc_logout(["Wyloguj się"])
        uc_profile(["Zarządzaj profilem"])
        uc_wallet(["Sprawdź saldo i historię transakcji"])
        uc_bonus(["Odbierz bonus dzienny"])
        uc_history(["Przeglądaj historię gier"])
    end

    guest --- uc_register
    guest --- uc_login
    guest --- uc_rank
    uc_rank --- player
    uc_logout --- player
    uc_profile --- player
    uc_wallet --- player
    uc_bonus --- player
    uc_history --- player
```

### 2.2. Rozgrywka

```mermaid
flowchart LR
    player(["👤 Gracz"])
    bot(["🤖 Bot AI"])

    subgraph zr["ZeroRisk – rozgrywka"]
        uc_bj(["Zagraj w blackjacka"])
        uc_makao(["Zagraj w makao"])
        uc_race(["Obstaw wyścig konny"])
        uc_bet(["Postaw zakład / wpisowe"])
        uc_watch(["Obejrzyj przebieg wyścigu<br/>(ze zdarzeniami losowymi)"])
        uc_diff(["Wybierz poziom trudności botów"])
        uc_bettype(["Wybierz typ zakładu<br/>(zwycięzca, top 3, dwójka, trójka)"])
        uc_seat(["Wybierz miejsce przy stole"])
        uc_train(["Trenuj liczenie kart<br/>(planowane)"])
    end

    player --- uc_bj
    player --- uc_makao
    player --- uc_race
    uc_bj -. "«include»" .-> uc_bet
    uc_makao -. "«include»" .-> uc_bet
    uc_race -. "«include»" .-> uc_bet
    uc_race -. "«include»" .-> uc_watch
    uc_race -. "«include»" .-> uc_bettype
    uc_diff -. "«extend»" .-> uc_makao
    uc_diff -. "«extend»" .-> uc_bj
    uc_bj -. "«include»" .-> uc_seat
    uc_train -. "«extend»" .-> uc_bj
    uc_bj --- bot
    uc_makao --- bot
```

### 2.3. Administracja

```mermaid
flowchart LR
    admin(["👤 Administrator"])

    subgraph zr["ZeroRisk – panel administracyjny"]
        uc_users(["Zarządzaj użytkownikami"])
        uc_horses(["Zarządzaj końmi<br/>(statystyki, styl biegu)"])
        uc_config(["Konfiguruj parametry gry<br/>(bonus, limity stawek)"])
    end

    admin --- uc_users
    admin --- uc_horses
    admin --- uc_config
```

| Aktor | Opis |
| --- | --- |
| Gość | Niezalogowany użytkownik. Może się zarejestrować, zalogować i zobaczyć ranking. |
| Gracz | Zalogowany użytkownik. Gra, obstawia, zarządza swoim kontem. |
| Bot AI | Aktor drugorzędny (systemowy): krupier w blackjacku, przeciwnicy w makao. |
| Administrator | Zarządza danymi przez panel Django Admin. |

---

## 3. Diagram encji (ERD)

Encje odpowiadają modelom Django w PostgreSQL. Kwoty to `bigint` (żetony). `jsonb` przechowuje stan gry i przebieg wyścigu.

```mermaid
erDiagram
    USER ||--|| WALLET : "ma"
    WALLET ||--o{ TRANSACTION : "rejestruje"
    USER ||--o{ GAME_SESSION : "rozgrywa"
    GAME_SESSION ||--|{ GAME_ROUND : "składa się z"
    GAME_ROUND ||--o{ GAME_MOVE : "zawiera"
    GAME_ROUND |o--o{ TRANSACTION : "rozliczana przez"
    USER ||--o{ RACE : "tworzy"
    RACE ||--|{ RACE_ENTRY : "ma uczestników"
    HORSE ||--o{ RACE_ENTRY : "startuje w"
    RACE ||--o{ RACE_EVENT : "przebieg"
    RACE_ENTRY ||--o{ RACE_EVENT : "dotyczy"
    USER ||--o{ BET : "stawia"
    RACE ||--o{ BET : "obstawiany w"
    BET ||--|{ BET_SELECTION : "wybrane konie"
    RACE_ENTRY ||--o{ BET_SELECTION : "wybrany w"
    BET |o--o{ TRANSACTION : "rozliczany przez"

    USER {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar display_name
        timestamptz date_joined
        boolean is_staff
    }
    WALLET {
        bigint id PK
        bigint user_id FK,UK
        bigint balance "CHECK >= 0"
        timestamptz last_bonus_at
        timestamptz updated_at
    }
    TRANSACTION {
        bigint id PK
        bigint wallet_id FK
        bigint amount "dodatnia = wpływ, ujemna = wydatek"
        varchar type "INITIAL, BONUS, BET, WIN, REFUND"
        bigint balance_after
        bigint game_round_id FK "nullable"
        bigint bet_id FK "nullable"
        timestamptz created_at
    }
    GAME_SESSION {
        bigint id PK
        bigint user_id FK
        varchar game_type "BLACKJACK, MAKAO"
        varchar status "ACTIVE, FINISHED, ABANDONED"
        varchar bot_difficulty "EASY, MEDIUM, HARD; nullable"
        smallint bot_count
        smallint player_seat "miejsce gracza (blackjack)"
        jsonb state "stan gry z game_engine: shoe, boty, ich żetony"
        timestamptz created_at
        timestamptz finished_at
    }
    GAME_ROUND {
        bigint id PK
        bigint game_session_id FK
        int round_no
        bigint stake "suma stawek gracza (z double i split)"
        bigint payout
        varchar result "WIN, LOSS, PUSH, BLACKJACK"
        timestamptz started_at
        timestamptz finished_at
    }
    GAME_MOVE {
        bigint id PK
        bigint game_round_id FK
        int seq "kolejność ruchu"
        varchar actor "PLAYER lub nazwa bota"
        smallint hand_index "0, a po splicie 0 lub 1"
        varchar action "BET, HIT, STAND, DOUBLE, SPLIT, PLAY, DRAW..."
        jsonb payload "zagrane karty, żądania"
        timestamptz created_at
    }
    HORSE {
        bigint id PK
        varchar name UK
        smallint speed
        smallint stamina
        smallint consistency
        varchar running_style "FRONT_RUNNER, CLOSER, STALKER"
        varchar preferred_track "DRY, WET, MUDDY"
        boolean is_active
    }
    RACE {
        bigint id PK
        bigint user_id FK
        bigint seed
        int distance
        varchar track_condition "DRY, WET, MUDDY"
        varchar status "OPEN, FINISHED"
        jsonb trajectory "pozycje koni w kolejnych krokach"
        jsonb odds_snapshot "kursy WIN i PLACE z Monte Carlo"
        timestamptz created_at
        timestamptz finished_at
    }
    RACE_ENTRY {
        bigint id PK
        bigint race_id FK
        bigint horse_id FK
        smallint lane
        numeric day_form "forma dnia, np. 0.95-1.05"
        numeric win_odds "kurs na zwycięzcę, np. 3.50"
        numeric place_odds "kurs na top 3"
        varchar status "RUNNING, FINISHED, DNF"
        smallint final_position "nullable; NULL przy DNF"
        numeric finish_time
    }
    RACE_EVENT {
        bigint id PK
        bigint race_id FK
        bigint race_entry_id FK
        int tick "krok symulacji"
        varchar type "STUMBLE, BURST, INJURY, FALL, BAD_START"
        jsonb effect "np. spadek prędkości, czas trwania"
    }
    BET {
        bigint id PK
        bigint user_id FK
        bigint race_id FK
        varchar bet_type "WIN, PLACE, QUINELLA, EXACTA, TRIFECTA"
        bigint amount
        numeric odds_at_bet
        varchar status "PENDING, WON, LOST"
        bigint payout
        timestamptz created_at
    }
    BET_SELECTION {
        bigint id PK
        bigint bet_id FK
        bigint race_entry_id FK
        smallint position "1-3 dla EXACTA/TRIFECTA; NULL gdy kolejność nie ma znaczenia"
    }
```

Najważniejsze reguły integralności:

- `WALLET.balance` ma `CHECK (balance >= 0)`; każda zmiana salda idzie przez `WalletService` w `transaction.atomic()` z `select_for_update()` i tworzy rekord `TRANSACTION`.
- `RACE_ENTRY` ma `UNIQUE (race_id, horse_id)` oraz `UNIQUE (race_id, lane)`.
- `GAME_ROUND` ma `UNIQUE (game_session_id, round_no)`. Makao ma zawsze jedną rundę na sesję, blackjack – wiele.
- `GAME_MOVE` ma `UNIQUE (game_round_id, seq)`. Ruchy botów też są zapisywane – przydadzą się do historii i trybu treningu.
- `BET` można postawić tylko na wyścig w statusie `OPEN`.
- `BET_SELECTION` ma `UNIQUE (bet_id, race_entry_id)`. Liczba wyborów zależy od typu zakładu: WIN/PLACE – 1, QUINELLA/EXACTA – 2, TRIFECTA – 3 (walidacja w `RacingService`).
- `RACE_EVENT` to źródło prawdy o zdarzeniach (statystyki typu „ile razy koń upadł”); `RACE.trajectory` służy tylko do animacji.

Typy zakładów:

| Typ | Nazwa | Wygrywa, gdy |
| --- | --- | --- |
| `WIN` | Zwycięzca | wybrany koń jest 1. |
| `PLACE` | Miejsce | wybrany koń jest w top 3 |
| `QUINELLA` | Dwójka | dwa wybrane konie zajmują miejsca 1–2 w dowolnej kolejności |
| `EXACTA` | Dokładna dwójka | dwa wybrane konie zajmują miejsca 1 i 2 w podanej kolejności |
| `TRIFECTA` | Dokładna trójka | trzy wybrane konie zajmują miejsca 1, 2, 3 w podanej kolejności |

---

## 4. Diagramy klas

### 4.1. `game_engine` – karty i gry karciane

```mermaid
classDiagram
    direction TB

    class Suit {
        <<enumeration>>
        HEARTS
        DIAMONDS
        CLUBS
        SPADES
    }
    class Rank {
        <<enumeration>>
        TWO … TEN
        JACK
        QUEEN
        KING
        ACE
    }
    class Card {
        +Suit suit
        +Rank rank
        +to_dict() dict
    }
    class Deck {
        -list~Card~ cards
        -Random rng
        +shuffle() None
        +draw() Card
        +remaining() int
        +from_cards(cards)$ Deck
    }
    class Hand {
        +list~Card~ cards
        +add(card) None
        +remove(card) None
    }
    class Player {
        +str id
        +str name
        +bool is_bot
        +Hand hand
    }
    class Move {
        +str action
        +list~Card~ cards
        +dict params
    }
    class CardGame {
        <<abstract>>
        #Deck deck
        #list~Player~ players
        #int current_index
        +current_player() Player
        +legal_moves(player)* list~Move~
        +apply_move(player, move)* None
        +is_finished()* bool
        +winner()* Player
        +view_for(player) dict
        +to_dict() dict
        +from_dict(data)$ CardGame
    }
    class Shoe {
        +int num_decks
        +float penetration
        +needs_reshuffle() bool
        +decks_remaining() float
    }
    class CardObserver {
        <<interface>>
        +on_card_revealed(card) None
        +on_shuffle() None
    }
    class BlackjackHand {
        +int bet
        +bool doubled
        +bool from_split
        +bool finished
        +value() int
        +is_soft() bool
        +is_blackjack() bool
        +can_split() bool
    }
    class Seat {
        +int number
        +int chips
        +list~BlackjackHand~ hands
    }
    class BlackjackPhase {
        <<enumeration>>
        BETTING
        PLAYER_TURNS
        DEALER_TURN
        SETTLED
    }
    class BlackjackGame {
        -Shoe shoe
        -list~Seat~ seats
        -Hand dealer_hand
        -BlackjackPhase phase
        -list~CardObserver~ observers
        +subscribe(observer) None
        +place_bet(seat, amount) None
        +deal() None
        +hit(seat, hand_index) None
        +stand(seat, hand_index) None
        +double_down(seat, hand_index) None
        +split(seat, hand_index) None
        -dealer_play() None
        +settle() dict~int, list~GameResult~~
        +new_round() None
    }
    class MakaoGame {
        -list~Card~ discard_pile
        -int pending_draw
        -int pending_skip
        -Rank demanded_rank
        -Suit demanded_suit
        +top_card() Card
        +play_cards(player, cards) None
        +draw(player) None
        +clone() MakaoGame
        -apply_card_effect(card) None
    }
    class GameResult {
        <<enumeration>>
        WIN
        LOSS
        PUSH
        BLACKJACK
    }
    class InvalidMoveError {
        <<exception>>
    }

    Card --> Suit
    Card --> Rank
    Deck o-- Card
    Hand o-- Card
    Player *-- Hand
    CardGame *-- Deck
    CardGame o-- Player
    CardGame ..> Move : przyjmuje
    CardGame ..> InvalidMoveError : rzuca
    CardGame <|-- BlackjackGame
    CardGame <|-- MakaoGame
    Deck <|-- Shoe
    Hand <|-- BlackjackHand
    Player <|-- Seat
    Seat *-- BlackjackHand
    BlackjackGame *-- Shoe
    BlackjackGame *-- Seat
    BlackjackGame --> BlackjackPhase
    BlackjackGame o-- CardObserver : powiadamia
    BlackjackGame ..> GameResult
```

`BlackjackGame` powiadamia obserwatorów (`CardObserver`, wzorzec Observer) o każdej **odkrytej** karcie i o przetasowaniu shoe. Zakryta karta krupiera jest zgłaszana dopiero po jej odkryciu – boty liczą tylko to, co widziałby człowiek przy stole.

### 4.2. `game_engine` – boty (wzorzec Strategy)

```mermaid
classDiagram
    direction TB

    class BotStrategy {
        <<interface>>
        +choose_move(view, legal_moves) Move
    }
    class Difficulty {
        <<enumeration>>
        EASY
        MEDIUM
        HARD
    }
    class BotFactory {
        +create(game_type, difficulty)$ BotStrategy
    }

    %% --- blackjack ---
    class BlackjackBotStrategy {
        <<interface>>
        +choose_bet(view, chips) int
    }
    class PlayPolicy {
        <<interface>>
        +action(hand, dealer_upcard, true_count, legal) str
    }
    class TextbookPolicy {
        +action(hand, dealer_upcard, true_count, legal) str
    }
    class QTablePolicy {
        -dict~tuple, dict~ q_values
        +action(hand, dealer_upcard, true_count, legal) str
        +load(path)$ QTablePolicy
    }
    class QLearningTrainer {
        +float alpha
        +float gamma
        +float epsilon
        +int count_buckets
        +train(episodes) QTablePolicy
        +save(policy, path) None
        +learning_curve() list~float~
    }
    class BasicStrategyBot {
        -PlayPolicy policy
        +int flat_bet
        +choose_bet(view, chips) int
        +choose_move(view, legal_moves) Move
    }
    class HiLoBettingBot {
        -CardCounter counter
        +int min_bet
        +int bet_spread
        +choose_bet(view, chips) int
    }
    class CardCounter {
        +int running_count
        +on_card_revealed(card) None
        +on_shuffle() None
        +true_count(decks_remaining) float
    }
    class CardObserver {
        <<interface>>
    }

    %% --- makao ---
    class RandomMakaoBot {
        +choose_move(view, legal_moves) Move
    }
    class HeuristicMakaoBot {
        +choose_move(view, legal_moves) Move
        -score(move, view) float
    }
    class ISMCTSMakaoBot {
        +int iterations
        +float exploration
        +choose_move(view, legal_moves) Move
        -determinize(view, rng) MakaoGame
        -select(node) MCTSNode
        -expand(node, game) MCTSNode
        -rollout(game) str
        -backpropagate(node, winner) None
    }
    class MCTSNode {
        +Move move
        +int visits
        +float wins
        +list~MCTSNode~ children
        +ucb1(c) float
    }
    class BotTournament {
        +run(bots, games) dict
    }

    BotFactory ..> BotStrategy : tworzy
    BotFactory ..> Difficulty

    BotStrategy <|-- BlackjackBotStrategy
    BlackjackBotStrategy <|.. BasicStrategyBot
    BasicStrategyBot <|-- HiLoBettingBot
    BasicStrategyBot o-- PlayPolicy
    PlayPolicy <|.. TextbookPolicy
    PlayPolicy <|.. QTablePolicy
    QLearningTrainer ..> QTablePolicy : trenuje offline
    HiLoBettingBot *-- CardCounter
    CardObserver <|.. CardCounter

    BotStrategy <|.. RandomMakaoBot
    BotStrategy <|.. HeuristicMakaoBot
    BotStrategy <|.. ISMCTSMakaoBot
    ISMCTSMakaoBot ..> MCTSNode
    BotTournament ..> BotStrategy : porównuje
```

Poziomy botów:

| Poziom | Blackjack | Makao |
| --- | --- | --- |
| EASY | `BasicStrategyBot` + `TextbookPolicy`, stała stawka | `RandomMakaoBot` |
| MEDIUM | `HiLoBettingBot` + `TextbookPolicy` – liczy Hi-Lo, stawka rośnie z true count | `HeuristicMakaoBot` |
| HARD | `HiLoBettingBot` + `QTablePolicy` – stawka z liczenia, decyzje wyuczone przez Q-learning | `ISMCTSMakaoBot` |

**Q-learning (blackjack).** Stan = (suma kart, miękki as, odkryta karta krupiera, przedział true count), akcje = HIT / STAND / DOUBLE / SPLIT, nagroda = wynik rozdania w stawkach. To kilka tysięcy stanów, więc wystarcza zwykła tabela – bez sieci neuronowej i GPU. `QLearningTrainer` jest uruchamiany ręcznie (komenda / skrypt), a wynik (`q_table.json`) commitujemy do repo; serwer tylko go wczytuje.

**ISMCTS (makao).** Bot widzi tylko swoją rękę, więc w każdej iteracji losuje („determinizuje”) karty przeciwników spośród kart, które mogą u nich być, i rozgrywa partię na kopii gry (`MakaoGame.clone()`). Ruch wybierany jest wg UCB1 w drzewie wspólnym dla wszystkich determinizacji. Czas ruchu kontrolujemy liczbą iteracji (np. 200 / 1000 / 3000).

**`BotTournament`** rozgrywa serię partii bot vs bot i zwraca statystyki (win-rate, średni wynik) – do testów i na prezentację.

Krupier nie jest botem – jego zachowanie wynika z zasad (`BlackjackGame.dealer_play()`).
`CardCounter` nie zna gry ani botów, więc w trybie treningu liczenia posłuży jako „wzorzec” do sprawdzania odpowiedzi gracza.
Bot dostaje tylko `view_for(bot)`, czyli to, co widziałby gracz na jego miejscu (bez kart przeciwników).

### 4.3. `game_engine` – wyścigi konne

Symulacja jest algorytmiczna. Taktyka konia (`PacingStrategy`) i zdarzenia losowe (`EventGenerator`) są wydzielone, żeby dało się je osobno testować i podmieniać.

```mermaid
classDiagram
    direction TB

    class RunningStyle {
        <<enumeration>>
        FRONT_RUNNER
        CLOSER
        STALKER
    }
    class TrackCondition {
        <<enumeration>>
        DRY
        WET
        MUDDY
        +speed_modifier(horse) float
    }
    class HorseStats {
        +str id
        +str name
        +int speed
        +int stamina
        +int consistency
        +RunningStyle style
        +TrackCondition preferred_track
    }
    class RunnerState {
        +HorseStats horse
        +float position
        +float energy
        +float day_form
        +float speed_penalty
        +int penalty_ticks
        +bool finished
        +bool dnf
        +speed_at(effort, track) float
    }
    class RaceSimulator {
        -Random rng
        +int seed
        +int distance
        +TrackCondition track
        +run(horses) RaceResult
        -step(runner, tick) None
    }
    class PacingStrategy {
        <<interface>>
        +decide(runner, race_view) float
    }
    class FrontRunnerPacing
    class CloserPacing
    class StalkerPacing
    class RLPacingStrategy {
        -ndarray weights
        +load(path)$ RLPacingStrategy
        +decide(runner, race_view) float
    }
    class EventGenerator {
        +dict~EventType, float~ base_rates
        +roll(runner, tick, rng) RaceEvent
    }
    class EventType {
        <<enumeration>>
        STUMBLE
        BURST
        INJURY
        FALL
        BAD_START
    }
    class RaceEvent {
        +int tick
        +str horse_id
        +EventType type
        +dict effect
        +apply(runner) None
    }
    class RaceResult {
        +list~str~ finishing_order
        +list~str~ dnf
        +dict~str, float~ finish_times
        +list~RaceEvent~ events
        +list~dict~ trajectory
        +to_dict() dict
    }
    class BetType {
        <<enumeration>>
        WIN
        PLACE
        QUINELLA
        EXACTA
        TRIFECTA
    }
    class OddsCalculator {
        +int simulations
        +float margin
        +float max_odds
        +compute(horses, track, seed) OddsTable
    }
    class OddsTable {
        -list~list~str~~ sampled_orders
        +win_odds() dict~str, float~
        +place_odds() dict~str, float~
        +odds_for(bet_type, selection) float
    }
    class BetEvaluator {
        +is_winning(bet_type, selection, result)$ bool
    }

    HorseStats --> RunningStyle
    HorseStats --> TrackCondition
    RunnerState --> HorseStats
    RaceSimulator *-- RunnerState
    RaceSimulator --> TrackCondition
    RaceSimulator --> EventGenerator
    RaceSimulator ..> PacingStrategy : wybiera wg stylu
    RaceSimulator ..> RaceResult : zwraca
    PacingStrategy <|.. FrontRunnerPacing
    PacingStrategy <|.. CloserPacing
    PacingStrategy <|.. StalkerPacing
    PacingStrategy <|.. RLPacingStrategy
    EventGenerator ..> RaceEvent : tworzy
    RaceEvent --> EventType
    RaceResult o-- RaceEvent
    OddsCalculator ..> RaceSimulator : wiele symulacji
    OddsCalculator ..> OddsTable : zwraca
    OddsTable ..> BetType
    BetEvaluator ..> BetType
    BetEvaluator ..> RaceResult
```

Uwagi do implementacji:

- **Odtwarzalność:** ten sam `seed`, konie i warunki toru zawsze dają ten sam wynik, łącznie ze zdarzeniami losowymi.
- **Zdarzenia:** szansa zdarzenia zależy od stanu konia (np. niska `energy` zwiększa szansę potknięcia, wysoka `consistency` ją zmniejsza). Orientacyjne częstości na konia na wyścig: potknięcie ~10%, zryw ~10%, zły start ~5%, kontuzja ~3%, upadek ~1%. `FALL` ustawia `dnf = True`, `INJURY` obniża prędkość do końca biegu.
- **Kursy:** `OddsCalculator` puszcza np. 5000 symulacji z seedami pochodnymi od seeda wyścigu i liczy częstość każdego wyniku. Kurs = 1 / prawdopodobieństwo × (1 − marża), ograniczony do `max_odds` (kombinacja, która nie wypadła w żadnej symulacji, dostaje maksymalny kurs). Kursy WIN/PLACE zapisujemy w `RACE.odds_snapshot`, kursy kombinacji liczymy przy stawianiu zakładu i zapisujemy w `BET.odds_at_bet`.
- **`RLPacingStrategy` jest opcjonalna** – trenowana offline na `RaceSimulator`, w runtime tylko inferencja (numpy).

### 4.4. Warstwa Django – serwisy

Serwisy łączą `game_engine` z bazą i portfelem. Widoki DRF tylko walidują żądanie i wołają serwis.

```mermaid
classDiagram
    direction TB

    class WalletService {
        +get_balance(user) int
        +debit(user, amount, type, ref) Transaction
        +credit(user, amount, type, ref) Transaction
        +claim_daily_bonus(user) Transaction
    }
    class BlackjackService {
        +open_table(user, bot_count, difficulty, seat) GameSession
        +place_bet(user, session_id, amount) GameRound
        +hit(user, session_id, hand_index) GameRound
        +stand(user, session_id, hand_index) GameRound
        +double_down(user, session_id, hand_index) GameRound
        +split(user, session_id, hand_index) GameRound
        +leave_table(user, session_id) GameSession
        -run_bot_turns(game, until_seat) list~Move~
        -settle(round) None
    }
    class MakaoService {
        +start(user, stake, bot_count, difficulty) GameSession
        +play(user, session_id, cards, demand) GameSession
        +draw(user, session_id) GameSession
        -run_bot_turns(game) list~Move~
        -settle(session) None
    }
    class RacingService {
        +create_race(user) Race
        +get_odds(race_id, bet_type, entry_ids) float
        +place_bet(user, race_id, bet_type, entry_ids, amount) Bet
        +run_race(user, race_id) Race
        -settle_bets(race) None
    }
    class LeaderboardService {
        +top_players(limit) list
    }

    class BlackjackGame
    class MakaoGame
    class BotFactory
    class RaceSimulator
    class OddsCalculator
    class BetEvaluator

    BlackjackService --> WalletService
    MakaoService --> WalletService
    RacingService --> WalletService
    BlackjackService ..> BlackjackGame
    BlackjackService ..> BotFactory
    MakaoService ..> MakaoGame
    MakaoService ..> BotFactory
    RacingService ..> RaceSimulator
    RacingService ..> OddsCalculator
    RacingService ..> BetEvaluator
```
