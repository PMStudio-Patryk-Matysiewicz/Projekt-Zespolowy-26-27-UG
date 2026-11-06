from django.conf import settings
from django.db import models


class Wallet(models.Model):
    """Player's chip balance. Every change goes through wallet.services.post_transaction."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(balance__gte=0), name='wallet_balance_non_negative'),
        ]

    def __str__(self):
        return f'{self.user}: {self.balance}'


class Transaction(models.Model):
    """Ledger entry: signed amount (negative = debit) and the balance right after it."""

    class Type(models.TextChoices):
        STARTING_POOL = 'starting_pool', 'Starting pool'
        BET = 'bet', 'Bet'
        WIN = 'win', 'Win'
        REFUND = 'refund', 'Refund'

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=Type.choices)
    amount = models.BigIntegerField()
    balance_after = models.BigIntegerField()
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at', 'id']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(balance_after__gte=0), name='transaction_balance_after_non_negative',
            ),
            models.CheckConstraint(condition=~models.Q(amount=0), name='transaction_amount_non_zero'),
        ]

    def __str__(self):
        return f'{self.get_type_display()} {self.amount:+} → {self.balance_after}'
