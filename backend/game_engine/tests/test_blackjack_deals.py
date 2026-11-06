"""Table rules checked on fixed deals.

Deal order: every seat's first card, dealer up card, every seat's second card, dealer
hole card; then cards are drawn in the order the hands are played.
"""

import unittest

from game_engine.blackjack import Action, BlackjackGame, IllegalAction, Phase, Result
from game_engine.cards import Shoe

FILLER = ['2C'] * 60


def deal(cards, bets=None, seats=('player',)):
    game = BlackjackGame(seats=list(seats), shoe=Shoe.from_cards(cards + FILLER))
    game.start_round(bets or {seat: 100 for seat in seats})
    return game


def only_hand(game, seat='player'):
    [hand] = game.hands[seat]
    return hand


class BlackjackPayoutTests(unittest.TestCase):
    def test_blackjack_pays_3_to_2(self):
        game = deal(['AS', '9D', 'KH', '7C'])

        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(only_hand(game).result, Result.BLACKJACK)
        self.assertEqual(only_hand(game).payout, 250)

    def test_blackjack_on_odd_bet_rounds_down(self):
        game = deal(['AS', '9D', 'KH', '7C'], bets={'player': 15})

        self.assertEqual(only_hand(game).payout, 15 + 22)

    def test_blackjack_against_dealer_blackjack_pushes(self):
        game = deal(['AS', 'AD', 'KH', 'QC'])

        self.assertEqual(only_hand(game).result, Result.PUSH)
        self.assertEqual(only_hand(game).payout, 100)

    def test_dealer_does_not_draw_against_a_lone_blackjack(self):
        game = deal(['AS', '9D', 'KH', '6C'])

        self.assertEqual(game.dealer.codes, ['9D', '6C'])


class DealerPeekTests(unittest.TestCase):
    def test_dealer_blackjack_ends_the_round_before_any_action(self):
        game = deal(['10H', 'AD', 'QS', 'KC'])

        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(game.available_actions('player'), [])
        self.assertEqual(only_hand(game).result, Result.LOSS)

    def test_only_the_original_bet_is_lost_to_dealer_blackjack(self):
        game = deal(['8H', 'KD', '8S', 'AC'])

        self.assertEqual(game.settlement()['player'], {'stake': 100, 'payout': 0})


class DealerDrawingTests(unittest.TestCase):
    def test_dealer_stands_on_soft_17(self):
        game = deal(['10H', 'AD', '8S', '6C'])
        game.stand('player')

        self.assertEqual(game.dealer.codes, ['AD', '6C'])
        self.assertEqual(only_hand(game).result, Result.WIN)

    def test_dealer_draws_on_soft_16(self):
        game = deal(['10H', 'AD', '9S', '5C', '3H'])
        game.stand('player')

        self.assertEqual(game.dealer.codes, ['AD', '5C', '3H'])
        self.assertEqual(game.dealer.total, 19)
        self.assertEqual(only_hand(game).result, Result.PUSH)

    def test_dealer_draws_on_16_and_stands_on_hard_17(self):
        game = deal(['10H', '10D', '9S', '6C', 'AH', '5D'])
        game.stand('player')

        self.assertEqual(game.dealer.codes, ['10D', '6C', 'AH'])
        self.assertEqual(game.dealer.total, 17)
        self.assertEqual(only_hand(game).result, Result.WIN)

    def test_dealer_bust_pays_standing_hands(self):
        game = deal(['10H', '10D', '2S', '6C', 'KH'])
        game.stand('player')

        self.assertTrue(game.dealer.is_bust)
        self.assertEqual(only_hand(game).result, Result.WIN)
        self.assertEqual(only_hand(game).payout, 200)

    def test_equal_totals_push(self):
        game = deal(['10H', '10D', '8S', '8C'])
        game.stand('player')

        self.assertEqual(only_hand(game).result, Result.PUSH)
        self.assertEqual(only_hand(game).payout, 100)

    def test_lower_total_loses(self):
        game = deal(['10H', '10D', '7S', '8C'])
        game.stand('player')

        self.assertEqual(only_hand(game).result, Result.LOSS)

    def test_dealer_does_not_draw_when_every_hand_is_bust(self):
        game = deal(['10H', '10D', '6S', '6C', 'KH'])
        game.hit('player')

        self.assertEqual(game.dealer.codes, ['10D', '6C'])


class HitTests(unittest.TestCase):
    def test_hitting_to_21_stands_automatically(self):
        game = deal(['10H', '10D', '6S', '8C', '5H'])
        game.hit('player')

        self.assertEqual(only_hand(game).total, 21)
        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(only_hand(game).result, Result.WIN)

    def test_soft_hand_does_not_bust_on_a_ten(self):
        game = deal(['AH', '10D', '6S', '8C', '10C'])
        game.hit('player')

        self.assertEqual(only_hand(game).total, 17)
        self.assertEqual(game.phase, Phase.PLAYER_TURNS)


class DoubleTests(unittest.TestCase):
    def test_double_takes_exactly_one_card_and_doubles_the_bet(self):
        game = deal(['6H', '10D', '5S', '7C', '9H'])
        game.double('player')

        hand = only_hand(game)
        self.assertEqual(hand.codes, ['6H', '5S', '9H'])
        self.assertTrue(hand.doubled)
        self.assertEqual(game.settlement()['player'], {'stake': 200, 'payout': 400})

    def test_double_loss_loses_both_stakes(self):
        game = deal(['6H', '10D', '5S', '9C', '2H'])
        game.double('player')

        self.assertEqual(game.settlement()['player'], {'stake': 200, 'payout': 0})

    def test_double_is_only_allowed_on_two_cards(self):
        game = deal(['2H', '10D', '3S', '7C', '4H'])
        game.hit('player')

        self.assertNotIn(Action.DOUBLE, game.available_actions('player'))
        with self.assertRaises(IllegalAction):
            game.double('player')


class SplitTests(unittest.TestCase):
    def test_split_plays_two_hands_with_separate_results(self):
        game = deal(['8H', '10D', '8S', '7C', '3D', 'KC'])
        self.assertIn(Action.SPLIT, game.available_actions('player'))

        game.split('player')
        self.assertEqual(game.hands['player'][0].codes, ['8H', '3D'])
        self.assertEqual(game.turn, ('player', 0))
        game.stand('player')
        self.assertEqual(game.hands['player'][1].codes, ['8S', 'KC'])
        game.stand('player')

        first, second = game.hands['player']
        self.assertEqual((first.result, second.result), (Result.LOSS, Result.WIN))
        self.assertEqual(game.settlement()['player'], {'stake': 200, 'payout': 200})

    def test_ten_value_cards_can_be_split(self):
        game = deal(['KH', '9D', 'QS', '7C'])

        self.assertIn(Action.SPLIT, game.available_actions('player'))

    def test_different_values_cannot_be_split(self):
        game = deal(['8H', '9D', '9S', '7C'])

        self.assertNotIn(Action.SPLIT, game.available_actions('player'))
        with self.assertRaises(IllegalAction):
            game.split('player')

    def test_no_resplit(self):
        game = deal(['8H', '10D', '8S', '7C', '8D'])
        game.split('player')

        self.assertEqual(game.hands['player'][0].codes, ['8H', '8D'])
        self.assertNotIn(Action.SPLIT, game.available_actions('player'))

    def test_double_after_split_is_allowed(self):
        game = deal(['5H', '10D', '5S', '6C', '6D', 'KH', '4C', '9S'])
        game.split('player')
        game.double('player')

        first = game.hands['player'][0]
        self.assertEqual(first.codes, ['5H', '6D', 'KH'])
        self.assertEqual(first.bet, 200)
        self.assertEqual(game.turn, ('player', 1))

    def test_split_aces_get_one_card_each_and_21_is_not_blackjack(self):
        game = deal(['AH', '9D', 'AS', '8C', 'KD', '5H'])
        game.split('player')

        first, second = game.hands['player']
        self.assertEqual(first.codes, ['AH', 'KD'])
        self.assertEqual(second.codes, ['AS', '5H'])
        self.assertEqual(game.phase, Phase.SETTLED)
        self.assertEqual(first.result, Result.WIN)
        self.assertEqual(first.payout, 200)
        self.assertEqual(second.result, Result.LOSS)

    def test_split_hand_reaching_21_on_its_second_card_moves_on(self):
        game = deal(['KH', '9D', 'KS', '7C', 'AH', '5C'])
        game.split('player')

        first, second = game.hands['player']
        self.assertEqual(first.codes, ['KH', 'AH'])
        self.assertTrue(first.finished)
        self.assertFalse(first.is_blackjack)
        self.assertEqual(second.codes, ['KS', '5C'])
        self.assertEqual(game.turn, ('player', 1))


class TableTests(unittest.TestCase):
    def test_each_seat_is_settled_on_its_own(self):
        game = deal(['10H', '10C', '9D', '6S', '9C', '8D', 'KH'], seats=['bot', 'player'])
        game.hit('bot')
        game.stand('player')

        self.assertEqual(only_hand(game, 'bot').result, Result.LOSS)
        self.assertEqual(only_hand(game, 'player').result, Result.WIN)
        self.assertEqual(game.dealer.codes, ['9D', '8D'])

    def test_seat_without_bet_sits_out(self):
        game = deal(['10H', '9D', '9C', '8S'], bets={'player': 50}, seats=['bot', 'player'])

        self.assertEqual(set(game.hands), {'player'})
        self.assertEqual(game.turn, ('player', 0))

    def test_new_round_cannot_start_while_playing(self):
        game = deal(['10H', '9D', '7C', '6S'])

        with self.assertRaises(IllegalAction):
            game.start_round({'player': 100})


class ShoeAcrossRoundsTests(unittest.TestCase):
    def test_reshuffle_happens_before_the_round_after_the_cut_card(self):
        game = BlackjackGame(seats=['player'], seed=3)
        rounds = 0
        while not game.shoe.needs_shuffle:
            game.start_round({'player': 10})
            self.assertFalse(game.reshuffled)
            while game.phase == Phase.PLAYER_TURNS:
                game.stand('player')
            rounds += 1

        game.start_round({'player': 10})

        self.assertTrue(game.reshuffled)
        self.assertEqual(game.shoe.shuffle_no, 1)
        self.assertGreater(rounds, 30)

    def test_same_seed_deals_the_same_rounds(self):
        def play(seed):
            game = BlackjackGame(seats=['player', 'bot'], seed=seed)
            dealt = []
            for _ in range(100):
                game.start_round({'player': 10, 'bot': 10})
                while game.phase == Phase.PLAYER_TURNS:
                    game.stand(game.turn[0])
                dealt.append((game.dealer.codes, [h.codes for h in game._all_hands()]))
            return dealt

        self.assertEqual(play(2026), play(2026))
        self.assertNotEqual(play(2026), play(2027))
