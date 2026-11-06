from django.db import transaction

from .models import Transaction, Wallet

STARTING_POOL = 5000


class InsufficientFunds(Exception):
    pass


@transaction.atomic
def open_wallet(user):
    wallet = Wallet.objects.create(user=user, balance=STARTING_POOL)
    Transaction.objects.create(
        wallet=wallet,
        type=Transaction.Type.STARTING_POOL,
        amount=STARTING_POOL,
        balance_after=STARTING_POOL,
        description='Starting pool',
    )
    return wallet


@transaction.atomic
def post_transaction(wallet, type, amount, description=''):
    """Apply a signed amount to the wallet under a row lock and record it in the ledger."""
    if amount == 0:
        raise ValueError('Transaction amount must not be zero.')

    locked = Wallet.objects.select_for_update().get(pk=wallet.pk)
    new_balance = locked.balance + amount
    if new_balance < 0:
        raise InsufficientFunds(f'Balance {locked.balance} is too low for {amount}.')

    locked.balance = new_balance
    locked.save(update_fields=['balance', 'updated_at'])
    wallet.balance = new_balance
    return Transaction.objects.create(
        wallet=locked, type=type, amount=amount, balance_after=new_balance, description=description,
    )
