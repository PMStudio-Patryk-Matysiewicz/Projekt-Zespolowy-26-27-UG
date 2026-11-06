import json
import unittest

from game_engine.blackjack import (
    Action,
    BlackjackGame,
    BlackjackHand,
    IllegalAction,
    Phase,
    Result,
)
from game_engine.cards import Card, Shoe


def hand(*codes):
    return BlackjackHand([Card.from_code(c) for c in codes])


def game_with(cards, seats=('player',)):
    """Single round dealt from fixed cards; deal order is seat 1..n, dealer up, seat 1..n, dealer hole."""
    return BlackjackGame(seats=list(seats), shoe=Shoe.from_cards(cards + ['2C'] * 60))


class BlackjackHandTests(unittest.TestCase):
    def test_totals(self):
        self.assertEqual(hand('10H', '7C').total, 17)
        self.assertEqual(hand('KH', 'QC').total, 20)
        self.assertEqual(hand('AS', '6D').total, 17)
        self.assertEqual(hand('AS', '6D', '10C').total, 17)
        self.assertEqual(hand('AS', 'AD').total, 12)
        self.assertEqual(hand('AS', 'AD', '9C').total, 21)

    def test_soft_hands(self):
        self.assertTrue(hand('AS', '6D').is_soft)
        self.assertFalse(hand('AS', '6D', '10C').is_soft)
        self.assertFalse(hand('10H', '7C').is_soft)

    def test_blackjack_needs_two_cards_and_no_split(self):
        self.assertTrue(hand('AS', 'KD').is_blackjack)
        self.assertFalse(hand('7S', '7D', '7C').is_blackjack)
        split = hand('AS', 'KD')
        split.from_split = True
        self.assertFalse(split.is_blackjack)

    def test_bust(self):
        self.assertTrue(hand('10H', '7C', '5D').is_bust)
        self.assertFalse(hand('10H', 'AC').is_bust)

    def test_pairs_of_equal_value_can_be_split(self):
        self.assertTrue(hand('8H', '8C').is_pair)
        self.assertTrue(hand('KH', 'QC').is_pair)
        self.assertFalse(hand('8H', '9C').is_pair)
        self.assertFalse(hand('8H', '8C', '2D').is_pair)


class RoundFlowTests(unittest.TestCase):
    def test_deal_gives_two_cards_each_and_starts_player_turn(self):
        game = game_with(['10H', '9D', '7C', '6S'])

        game.start_round({'player': 100})

        self.assertEqual(game.phase, Phase.PLAYER_TURNS)
        self.assertEqual(game.hands['player'][0].codes, ['10H', '7C'])
        self.assertEqual(game.dealer.codes, ['9D', '6S'])
        self.assertEqual(game.turn, ('player', 0))
        self.assertEqual(game.available_actions('player'), [Action.HIT, Action.STAND, Action.DOUBLE])

    def test_stand_lets_dealer_play_and_settles(self):
        game = game_with(['10H', '9D', '9C', '7S'])
        game.start_round({'player': 100})

        game.stand('player')

        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(game.dealer.codes, ['9D', '7S', '2C'])
        player = game.hands['player'][0]
        self.assertEqual(player.result, Result.WIN)
        self.assertEqual(player.payout, 200)

    def test_hit_to_bust_loses_without_dealer_drawing(self):
        game = game_with(['10H', '9D', '6C', '7S', 'KD'])
        game.start_round({'player': 100})

        game.hit('player')

        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(game.hands['player'][0].result, Result.LOSS)
        self.assertEqual(game.hands['player'][0].payout, 0)
        self.assertEqual(len(game.dealer), 2)

    def test_actions_are_rejected_out_of_turn_or_phase(self):
        game = game_with(['10H', '9D', '7C', '6S'], seats=['player', 'bot'])

        with self.assertRaises(IllegalAction):
            game.hit('player')

        game.start_round({'player': 100, 'bot': 50})
        with self.assertRaises(IllegalAction):
            game.hit('bot')

    def test_bets_must_be_positive_integers_for_seated_players(self):
        game = game_with([])
        for bets in [{}, {'player': 0}, {'player': -5}, {'player': 1.5}, {'player': True}, {'stranger': 10}]:
            with self.assertRaises(IllegalAction):
                game.start_round(bets)

    def test_seats_play_in_order(self):
        game = game_with(['10H', '10C', '9D', '8H', '9C', '7S'], seats=['bot', 'player'])
        game.start_round({'bot': 10, 'player': 10})

        self.assertEqual(game.turn, ('bot', 0))
        game.stand('bot')
        self.assertEqual(game.turn, ('player', 0))

    def test_settlement_summary_per_seat(self):
        game = game_with(['10H', '9D', '9C', '8S'])
        game.start_round({'player': 100})
        game.double('player')

        summary = game.settlement()

        self.assertEqual(set(summary), {'player'})
        self.assertEqual(summary['player']['stake'], 200)
        self.assertEqual(summary['player']['payout'], game.hands['player'][0].payout)


class SerializationTests(unittest.TestCase):
    def test_round_trip_mid_round_continues_identically(self):
        game = BlackjackGame(seats=['player', 'bot'], seed=123)
        game.start_round({'player': 100, 'bot': 20})
        data = json.loads(json.dumps(game.to_dict()))

        restored = BlackjackGame.from_dict(data)

        self.assertEqual(restored.to_dict(), game.to_dict())
        while game.phase == Phase.PLAYER_TURNS:
            seat, _ = game.turn
            game.stand(seat)
            restored.stand(seat)
        self.assertEqual(restored.to_dict(), game.to_dict())


class ViewTests(unittest.TestCase):
    def test_hole_card_and_shoe_order_are_hidden_during_play(self):
        game = game_with(['10H', '9D', '7C', '6S'])
        game.start_round({'player': 100})

        view = game.view_for('player')

        self.assertEqual(view['dealer']['cards'], ['9D', None])
        self.assertEqual(view['dealer']['total'], 9)
        self.assertNotIn('cards', view['shoe'])
        self.assertNotIn('seed', json.dumps(view))
        self.assertEqual(view['actions'], ['hit', 'stand', 'double'])

    def test_hole_card_is_revealed_after_settlement(self):
        game = game_with(['10H', '9D', '9C', '8S'])
        game.start_round({'player': 100})
        game.stand('player')

        view = game.view_for('player')

        self.assertEqual(view['dealer']['cards'], ['9D', '8S'])
        self.assertEqual(view['actions'], [])

    def test_other_seats_get_no_actions(self):
        game = game_with(['10H', '10C', '9D', '8H', '9C', '7S'], seats=['player', 'bot'])
        game.start_round({'player': 10, 'bot': 10})

        self.assertEqual(game.view_for('bot')['actions'], [])
        self.assertEqual(game.view_for('player')['actions'], ['hit', 'stand', 'double'])

    def test_view_is_json_serializable(self):
        game = BlackjackGame(seats=['player'], seed=1)
        game.start_round({'player': 10})

        json.dumps(game.view_for('player'))
