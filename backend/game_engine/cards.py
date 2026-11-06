import random
from dataclasses import dataclass
from enum import Enum


class Suit(Enum):
    CLUBS = 'C'
    DIAMONDS = 'D'
    HEARTS = 'H'
    SPADES = 'S'


class Rank(Enum):
    TWO = '2'
    THREE = '3'
    FOUR = '4'
    FIVE = '5'
    SIX = '6'
    SEVEN = '7'
    EIGHT = '8'
    NINE = '9'
    TEN = '10'
    JACK = 'J'
    QUEEN = 'Q'
    KING = 'K'
    ACE = 'A'


@dataclass(frozen=True, slots=True)
class Card:
    rank: Rank
    suit: Suit

    @property
    def code(self):
        """Short text form used in game state and the API, e.g. '10H', 'AS'."""
        return self.rank.value + self.suit.value

    @classmethod
    def from_code(cls, code):
        try:
            return cls(Rank(code[:-1]), Suit(code[-1:]))
        except ValueError:
            raise ValueError(f'Invalid card code: {code!r}') from None

    def __str__(self):
        return self.code


def _as_card(card):
    return card if isinstance(card, Card) else Card.from_code(card)


def standard_cards():
    return [Card(rank, suit) for suit in Suit for rank in Rank]


class Deck:
    """Cards dealt from the top (index 0) in a fixed order; a seed makes the shuffle reproducible."""

    def __init__(self, seed=None, cards=None):
        if cards is None:
            cards = standard_cards()
            random.Random(seed).shuffle(cards)
        self.cards = list(cards)
        self.position = 0

    @classmethod
    def standard(cls):
        return cls(cards=standard_cards())

    @classmethod
    def from_cards(cls, cards):
        return cls(cards=[_as_card(c) for c in cards])

    @property
    def remaining(self):
        return len(self.cards) - self.position

    def __len__(self):
        return self.remaining

    def draw(self):
        if self.position >= len(self.cards):
            raise IndexError('No cards left in the deck.')
        card = self.cards[self.position]
        self.position += 1
        return card


class Hand:
    def __init__(self, cards=()):
        self.cards = list(cards)

    @classmethod
    def from_codes(cls, codes):
        return cls(Card.from_code(c) for c in codes)

    @property
    def codes(self):
        return [c.code for c in self.cards]

    def add(self, card):
        self.cards.append(card)

    def __len__(self):
        return len(self.cards)

    def __iter__(self):
        return iter(self.cards)


class Shoe(Deck):
    """Several decks dealt across rounds; reshuffled once the cut card is reached.

    Every reshuffle n uses its own RNG seeded with (seed, n), so the whole sequence of
    cards follows from the seed and the state fits in a small JSON object.
    """

    def __init__(self, seed=0, decks=6, penetration=0.75, cards=None, shuffle_no=0):
        if not 0 < penetration < 1:
            raise ValueError('Penetration must be between 0 and 1.')
        self.seed = seed
        self.decks = decks
        self.penetration = penetration
        self.shuffle_no = shuffle_no
        super().__init__(cards=cards if cards is not None else self._shuffled())

    @classmethod
    def from_cards(cls, cards, **kwargs):
        cards = [_as_card(c) for c in cards]
        return cls(cards=cards, decks=max(1, round(len(cards) / 52)), **kwargs)

    @property
    def cut_position(self):
        return int(len(self.cards) * self.penetration)

    @property
    def needs_shuffle(self):
        return self.position >= self.cut_position

    def reshuffle(self):
        self.shuffle_no += 1
        self.cards = self._shuffled()
        self.position = 0

    def draw(self):
        if self.position >= len(self.cards):
            self.reshuffle()
        return super().draw()

    def _shuffled(self):
        cards = standard_cards() * self.decks
        random.Random(f'{self.seed}:{self.shuffle_no}').shuffle(cards)
        return cards

    def to_dict(self):
        return {
            'seed': self.seed,
            'decks': self.decks,
            'penetration': self.penetration,
            'shuffle_no': self.shuffle_no,
            'position': self.position,
            'cards': [c.code for c in self.cards],
        }

    @classmethod
    def from_dict(cls, data):
        shoe = cls(
            seed=data['seed'],
            decks=data['decks'],
            penetration=data['penetration'],
            shuffle_no=data['shuffle_no'],
            cards=[Card.from_code(c) for c in data['cards']],
        )
        shoe.position = data['position']
        return shoe
