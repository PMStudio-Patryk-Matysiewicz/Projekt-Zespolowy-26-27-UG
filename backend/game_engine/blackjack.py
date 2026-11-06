"""Blackjack table rules: 6-deck shoe, dealer stands on soft 17, blackjack pays 3:2,
one split (split aces get one card each), double on any first two cards, dealer peeks
for blackjack, no insurance or surrender.

Bets and payouts are whole chips. A payout is the total returned to the seat for a hand
(stake included), so 0 means the stake is lost; 3:2 is rounded down.
"""

from enum import StrEnum

from .cards import Card, Hand, Rank, Shoe


class Phase(StrEnum):
    BETTING = 'betting'
    PLAYER_TURNS = 'player_turns'
    SETTLED = 'settled'


class Action(StrEnum):
    HIT = 'hit'
    STAND = 'stand'
    DOUBLE = 'double'
    SPLIT = 'split'


class Result(StrEnum):
    WIN = 'win'
    LOSS = 'loss'
    PUSH = 'push'
    BLACKJACK = 'blackjack'


class IllegalAction(Exception):
    pass


def card_points(card):
    if card.rank == Rank.ACE:
        return 1
    if card.rank in (Rank.JACK, Rank.QUEEN, Rank.KING):
        return 10
    return int(card.rank.value)


class BlackjackHand(Hand):
    def __init__(self, cards=(), bet=0, doubled=False, from_split=False, finished=False, result=None, payout=0):
        super().__init__(cards)
        self.bet = bet
        self.doubled = doubled
        self.from_split = from_split
        self.finished = finished
        self.result = result
        self.payout = payout

    @property
    def _hard_total(self):
        return sum(card_points(c) for c in self.cards)

    @property
    def is_soft(self):
        """An ace counts as 11 without busting."""
        return any(c.rank == Rank.ACE for c in self.cards) and self._hard_total + 10 <= 21

    @property
    def total(self):
        return self._hard_total + 10 if self.is_soft else self._hard_total

    @property
    def is_blackjack(self):
        return len(self.cards) == 2 and self.total == 21 and not self.from_split

    @property
    def is_bust(self):
        return self.total > 21

    @property
    def is_pair(self):
        return len(self.cards) == 2 and card_points(self.cards[0]) == card_points(self.cards[1])

    @property
    def is_split_aces(self):
        return self.from_split and self.cards[0].rank == Rank.ACE

    def to_dict(self):
        return {
            'cards': self.codes,
            'bet': self.bet,
            'doubled': self.doubled,
            'from_split': self.from_split,
            'finished': self.finished,
            'result': self.result.value if self.result else None,
            'payout': self.payout,
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            cards=[Card.from_code(c) for c in data['cards']],
            bet=data['bet'],
            doubled=data['doubled'],
            from_split=data['from_split'],
            finished=data['finished'],
            result=Result(data['result']) if data['result'] else None,
            payout=data['payout'],
        )


class BlackjackGame:
    """One table: seats in playing order, a shoe kept between rounds and the dealer."""

    def __init__(self, seats, shoe=None, seed=0):
        if not seats or len(set(seats)) != len(seats):
            raise ValueError('Seats must be a non-empty list of unique ids.')
        self.seats = list(seats)
        self.shoe = shoe if shoe is not None else Shoe(seed=seed)
        self.phase = Phase.BETTING
        self.round_no = 0
        self.hands = {}
        self.dealer = BlackjackHand()
        self.turn = None
        self.reshuffled = False

    # --- round ---------------------------------------------------------------------

    def start_round(self, bets):
        if self.phase == Phase.PLAYER_TURNS:
            raise IllegalAction('The round is still being played.')
        self._validate_bets(bets)

        self.reshuffled = self.shoe.needs_shuffle
        if self.reshuffled:
            self.shoe.reshuffle()

        self.round_no += 1
        playing = [s for s in self.seats if s in bets]
        self.hands = {s: [BlackjackHand(bet=bets[s])] for s in playing}
        self.dealer = BlackjackHand()
        for _ in range(2):
            for seat in playing:
                self.hands[seat][0].add(self.shoe.draw())
            self.dealer.add(self.shoe.draw())

        self.phase = Phase.PLAYER_TURNS
        if self.dealer.is_blackjack:
            for hand in self._all_hands():
                hand.finished = True
            self.settle()
            return

        for hand in self._all_hands():
            if hand.is_blackjack:
                hand.finished = True
        self.turn = None
        self._advance()

    def _validate_bets(self, bets):
        if not bets:
            raise IllegalAction('At least one seat must bet.')
        for seat, bet in bets.items():
            if seat not in self.seats:
                raise IllegalAction(f'Unknown seat: {seat!r}.')
            if type(bet) is not int or bet <= 0:
                raise IllegalAction('A bet must be a positive whole number of chips.')

    def _all_hands(self):
        return [h for seat in self.seats for h in self.hands.get(seat, [])]

    def _advance(self):
        """Move the turn to the next unfinished hand, or let the dealer play and settle."""
        for seat in self.seats:
            for index, hand in enumerate(self.hands.get(seat, [])):
                if hand.finished:
                    continue
                if len(hand) == 1:
                    hand.add(self.shoe.draw())
                    if hand.total == 21:
                        hand.finished = True
                        continue
                self.turn = (seat, index)
                return
        self.turn = None
        self.dealer_play()
        self.settle()

    # --- player actions ------------------------------------------------------------

    def available_actions(self, seat):
        if self.phase != Phase.PLAYER_TURNS or self.turn is None or self.turn[0] != seat:
            return []
        hand = self._current_hand()
        actions = [Action.HIT, Action.STAND]
        if len(hand) == 2:
            actions.append(Action.DOUBLE)
            if hand.is_pair and len(self.hands[seat]) == 1:
                actions.append(Action.SPLIT)
        return actions

    def _current_hand(self):
        seat, index = self.turn
        return self.hands[seat][index]

    def _require(self, seat, action):
        if action not in self.available_actions(seat):
            raise IllegalAction(f'{action.value} is not allowed for {seat!r} now.')
        return self._current_hand()

    def hit(self, seat):
        hand = self._require(seat, Action.HIT)
        hand.add(self.shoe.draw())
        if hand.total >= 21:
            hand.finished = True
            self._advance()

    def stand(self, seat):
        hand = self._require(seat, Action.STAND)
        hand.finished = True
        self._advance()

    def double(self, seat):
        hand = self._require(seat, Action.DOUBLE)
        hand.bet *= 2
        hand.doubled = True
        hand.add(self.shoe.draw())
        hand.finished = True
        self._advance()

    def split(self, seat):
        hand = self._require(seat, Action.SPLIT)
        first, second = hand.cards
        hands = [BlackjackHand([first], bet=hand.bet, from_split=True), BlackjackHand([second], bet=hand.bet, from_split=True)]
        self.hands[seat] = hands
        if first.rank == Rank.ACE:
            for split_hand in hands:
                split_hand.add(self.shoe.draw())
                split_hand.finished = True
        self._advance()

    # --- dealer and settlement -----------------------------------------------------

    def dealer_play(self):
        """Dealer draws to 17 and stands on soft 17; no draw when every hand is already decided."""
        if all(h.is_bust or h.is_blackjack for h in self._all_hands()):
            return
        while self.dealer.total < 17:
            self.dealer.add(self.shoe.draw())

    def settle(self):
        dealer = self.dealer
        for hand in self._all_hands():
            if hand.is_bust:
                hand.result, hand.payout = Result.LOSS, 0
            elif hand.is_blackjack and not dealer.is_blackjack:
                hand.result, hand.payout = Result.BLACKJACK, hand.bet + hand.bet * 3 // 2
            elif dealer.is_blackjack:
                hand.result, hand.payout = (Result.PUSH, hand.bet) if hand.is_blackjack else (Result.LOSS, 0)
            elif dealer.is_bust or hand.total > dealer.total:
                hand.result, hand.payout = Result.WIN, hand.bet * 2
            elif hand.total == dealer.total:
                hand.result, hand.payout = Result.PUSH, hand.bet
            else:
                hand.result, hand.payout = Result.LOSS, 0
        self.turn = None
        self.phase = Phase.SETTLED

    def settlement(self):
        """Per seat: chips staked this round (with double and split) and chips returned."""
        return {
            seat: {
                'stake': sum(h.bet for h in hands),
                'payout': sum(h.payout for h in hands),
            }
            for seat, hands in self.hands.items()
        }

    # --- state ---------------------------------------------------------------------

    def to_dict(self):
        return {
            'seats': self.seats,
            'shoe': self.shoe.to_dict(),
            'phase': self.phase.value,
            'round_no': self.round_no,
            'hands': {seat: [h.to_dict() for h in hands] for seat, hands in self.hands.items()},
            'dealer': self.dealer.to_dict(),
            'turn': list(self.turn) if self.turn else None,
            'reshuffled': self.reshuffled,
        }

    @classmethod
    def from_dict(cls, data):
        game = cls(seats=data['seats'], shoe=Shoe.from_dict(data['shoe']))
        game.phase = Phase(data['phase'])
        game.round_no = data['round_no']
        game.hands = {seat: [BlackjackHand.from_dict(h) for h in hands] for seat, hands in data['hands'].items()}
        game.dealer = BlackjackHand.from_dict(data['dealer'])
        game.turn = tuple(data['turn']) if data['turn'] else None
        game.reshuffled = data['reshuffled']
        return game

    def view_for(self, seat):
        """What one seat may see: the hole card stays hidden until settlement, the shoe order always."""
        if self.phase == Phase.SETTLED:
            dealer_cards, dealer_total = self.dealer.codes, self.dealer.total
        elif len(self.dealer):
            up = self.dealer.cards[0]
            dealer_cards, dealer_total = [up.code, None], BlackjackHand([up]).total
        else:
            dealer_cards, dealer_total = [], 0

        return {
            'phase': self.phase.value,
            'round_no': self.round_no,
            'seats': self.seats,
            'turn': {'seat': self.turn[0], 'hand': self.turn[1]} if self.turn else None,
            'actions': [a.value for a in self.available_actions(seat)],
            'dealer': {'cards': dealer_cards, 'total': dealer_total},
            'hands': {
                s: [
                    {
                        'cards': h.codes,
                        'total': h.total,
                        'soft': h.is_soft,
                        'bet': h.bet,
                        'doubled': h.doubled,
                        'result': h.result.value if h.result else None,
                        'payout': h.payout,
                    }
                    for h in hands
                ]
                for s, hands in self.hands.items()
            },
            'shoe': {'remaining': self.shoe.remaining, 'reshuffled': self.reshuffled},
        }
