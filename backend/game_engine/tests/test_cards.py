import ast
import unittest
from collections import Counter
from pathlib import Path

from game_engine.cards import Card, Deck, Hand, Rank, Shoe, Suit


class CardTests(unittest.TestCase):
    def test_code_round_trip(self):
        for code in ['2C', '10H', 'JD', 'QS', 'KH', 'AS']:
            self.assertEqual(Card.from_code(code).code, code)

    def test_from_code_parses_rank_and_suit(self):
        card = Card.from_code('10H')

        self.assertEqual(card.rank, Rank.TEN)
        self.assertEqual(card.suit, Suit.HEARTS)

    def test_invalid_code_is_rejected(self):
        for code in ['', '1H', '10X', 'AH ', 'ZZ']:
            with self.assertRaises(ValueError):
                Card.from_code(code)

    def test_cards_are_hashable_values(self):
        self.assertEqual(Card(Rank.ACE, Suit.SPADES), Card.from_code('AS'))
        self.assertEqual(len({Card.from_code('AS'), Card.from_code('AS')}), 1)

    def test_str_is_the_code(self):
        self.assertEqual(str(Card.from_code('QD')), 'QD')


class DeckTests(unittest.TestCase):
    def test_standard_deck_has_52_distinct_cards(self):
        deck = Deck.standard()

        self.assertEqual(len(deck), 52)
        self.assertEqual(len(set(deck.cards)), 52)

    def test_same_seed_gives_same_order(self):
        self.assertEqual(Deck(seed=42).cards, Deck(seed=42).cards)

    def test_different_seeds_give_different_order(self):
        self.assertNotEqual(Deck(seed=1).cards, Deck(seed=2).cards)

    def test_seeded_deck_is_shuffled_standard_deck(self):
        deck = Deck(seed=7)

        self.assertNotEqual(deck.cards, Deck.standard().cards)
        self.assertEqual(set(deck.cards), set(Deck.standard().cards))

    def test_from_cards_deals_in_given_order(self):
        deck = Deck.from_cards(['AS', 'KH', '5D'])

        self.assertEqual([deck.draw().code for _ in range(3)], ['AS', 'KH', '5D'])

    def test_draw_reduces_remaining(self):
        deck = Deck(seed=1)
        deck.draw()

        self.assertEqual(deck.remaining, 51)
        self.assertEqual(len(deck), 51)

    def test_drawing_from_empty_deck_raises(self):
        deck = Deck.from_cards(['AS'])
        deck.draw()

        with self.assertRaises(IndexError):
            deck.draw()


class HandTests(unittest.TestCase):
    def test_add_and_iterate(self):
        hand = Hand()
        hand.add(Card.from_code('AS'))
        hand.add(Card.from_code('KH'))

        self.assertEqual(len(hand), 2)
        self.assertEqual([c.code for c in hand], ['AS', 'KH'])

    def test_from_codes_and_codes(self):
        self.assertEqual(Hand.from_codes(['2C', '9D']).codes, ['2C', '9D'])


class ShoeTests(unittest.TestCase):
    def test_six_decks_by_default(self):
        shoe = Shoe(seed=1)

        self.assertEqual(len(shoe), 312)
        self.assertEqual(Counter(shoe.cards)[Card.from_code('AS')], 6)

    def test_same_seed_gives_same_cards(self):
        a, b = Shoe(seed=99), Shoe(seed=99)

        self.assertEqual([a.draw() for _ in range(50)], [b.draw() for _ in range(50)])

    def test_cut_card_at_about_75_percent(self):
        shoe = Shoe(seed=1)

        self.assertEqual(shoe.cut_position, 234)

        for _ in range(233):
            shoe.draw()
        self.assertFalse(shoe.needs_shuffle)
        shoe.draw()
        self.assertTrue(shoe.needs_shuffle)

    def test_reshuffle_restores_full_shoe_with_new_order(self):
        shoe = Shoe(seed=1)
        first_order = list(shoe.cards)
        for _ in range(240):
            shoe.draw()

        shoe.reshuffle()

        self.assertEqual(shoe.remaining, 312)
        self.assertFalse(shoe.needs_shuffle)
        self.assertNotEqual(shoe.cards, first_order)
        self.assertEqual(Counter(shoe.cards), Counter(first_order))

    def test_reshuffles_are_reproducible_from_seed(self):
        a, b = Shoe(seed=5), Shoe(seed=5)
        a.reshuffle()
        b.reshuffle()

        self.assertEqual(a.cards, b.cards)

    def test_empty_shoe_reshuffles_instead_of_failing(self):
        shoe = Shoe(seed=3, decks=1)
        for _ in range(52):
            shoe.draw()

        shoe.draw()

        self.assertEqual(shoe.remaining, 51)

    def test_from_cards_deals_fixed_cards(self):
        shoe = Shoe.from_cards(['AS', '10H', '5C'])

        self.assertEqual([shoe.draw().code for _ in range(3)], ['AS', '10H', '5C'])

    def test_serialization_round_trip_continues_the_same_sequence(self):
        shoe = Shoe(seed=11)
        for _ in range(20):
            shoe.draw()

        restored = Shoe.from_dict(shoe.to_dict())

        self.assertEqual([restored.draw() for _ in range(30)], [shoe.draw() for _ in range(30)])
        restored.reshuffle()
        shoe.reshuffle()
        self.assertEqual(restored.cards, shoe.cards)

    def test_to_dict_is_json_friendly(self):
        data = Shoe(seed=1).to_dict()

        self.assertTrue(all(isinstance(code, str) for code in data['cards']))
        self.assertIsInstance(data['seed'], int)

    def test_invalid_penetration_is_rejected(self):
        for penetration in [0, 1, 1.5]:
            with self.assertRaises(ValueError):
                Shoe(seed=1, penetration=penetration)


class EngineIsolationTests(unittest.TestCase):
    def test_game_engine_does_not_import_django(self):
        package = Path(__file__).resolve().parents[1]
        for path in package.rglob('*.py'):
            tree = ast.parse(path.read_text())
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    names = [alias.name for alias in node.names]
                elif isinstance(node, ast.ImportFrom):
                    names = [node.module or '']
                else:
                    continue
                for name in names:
                    self.assertFalse(name.startswith('django'), f'{path.name} imports {name}')
