from unittest import mock

from django.db import IntegrityError, transaction
from django.test import TestCase, TransactionTestCase

from accounts.models import User
from wallet.models import Transaction, Wallet
from wallet.services import (
    STARTING_POOL,
    InsufficientFunds,
    open_wallet,
    post_transaction,
)

PASSWORD = 'Zaq12wsx!'


def make_user(username='gracz'):
    return User.objects.create_user(username, f'{username}@example.com', PASSWORD)


class OpenWalletTests(TestCase):
    def test_new_wallet_holds_starting_pool(self):
        wallet = open_wallet(make_user())

        self.assertEqual(STARTING_POOL, 5000)
        self.assertEqual(wallet.balance, STARTING_POOL)

    def test_starting_pool_is_recorded_in_ledger(self):
        wallet = open_wallet(make_user())

        entry = wallet.transactions.get()
        self.assertEqual(entry.type, Transaction.Type.STARTING_POOL)
        self.assertEqual(entry.amount, STARTING_POOL)
        self.assertEqual(entry.balance_after, STARTING_POOL)
        self.assertIsNotNone(entry.created_at)

    def test_user_has_at_most_one_wallet(self):
        user = make_user()
        open_wallet(user)

        with self.assertRaises(IntegrityError), transaction.atomic():
            open_wallet(user)

        self.assertEqual(Transaction.objects.count(), 1)


class OpenWalletAtomicityTests(TransactionTestCase):
    def test_wallet_is_not_created_when_ledger_entry_fails(self):
        user = make_user()

        with (
            mock.patch.object(Transaction.objects, 'create', side_effect=RuntimeError),
            self.assertRaises(RuntimeError),
        ):
            open_wallet(user)

        self.assertFalse(Wallet.objects.filter(user=user).exists())
        self.assertFalse(Transaction.objects.exists())


class PostTransactionTests(TestCase):
    def setUp(self):
        self.wallet = open_wallet(make_user())

    def test_debit_and_credit_update_balance_and_ledger(self):
        post_transaction(self.wallet, Transaction.Type.BET, -1200, 'Blackjack: zakład')
        entry = post_transaction(self.wallet, Transaction.Type.WIN, 2400, 'Blackjack: wygrana')

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 6200)
        self.assertEqual(entry.balance_after, 6200)
        self.assertEqual(
            list(self.wallet.transactions.values_list('amount', flat=True)),
            [STARTING_POOL, -1200, 2400],
        )

    def test_debit_below_zero_is_rejected_and_nothing_changes(self):
        with self.assertRaises(InsufficientFunds):
            post_transaction(self.wallet, Transaction.Type.BET, -5001, 'za dużo')

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, STARTING_POOL)
        self.assertEqual(self.wallet.transactions.count(), 1)

    def test_debit_to_exactly_zero_is_allowed(self):
        post_transaction(self.wallet, Transaction.Type.BET, -STARTING_POOL, 'all in')

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 0)

    def test_zero_amount_is_rejected(self):
        with self.assertRaises(ValueError):
            post_transaction(self.wallet, Transaction.Type.BET, 0, 'nic')

    def test_stale_wallet_instance_does_not_overwrite_balance(self):
        stale = Wallet.objects.get(pk=self.wallet.pk)
        post_transaction(self.wallet, Transaction.Type.BET, -3000, 'pierwszy')

        with self.assertRaises(InsufficientFunds):
            post_transaction(stale, Transaction.Type.BET, -3000, 'drugi')

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 2000)


class BalanceConstraintTests(TestCase):
    def test_database_rejects_negative_balance(self):
        wallet = open_wallet(make_user())

        with self.assertRaises(IntegrityError), transaction.atomic():
            Wallet.objects.filter(pk=wallet.pk).update(balance=-1)

    def test_database_rejects_negative_balance_after(self):
        wallet = open_wallet(make_user())

        with self.assertRaises(IntegrityError), transaction.atomic():
            Transaction.objects.create(
                wallet=wallet, type=Transaction.Type.BET, amount=-1, balance_after=-1,
            )
