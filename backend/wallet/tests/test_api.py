from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from wallet.models import Transaction
from wallet.services import STARTING_POOL, open_wallet, post_transaction

PASSWORD = 'Zaq12wsx!'


class WalletApiTests(APITestCase):
    url = reverse('wallet')

    def setUp(self):
        self.user = User.objects.create_user('gracz', 'gracz@example.com', PASSWORD)

    def test_returns_balance_of_logged_in_player(self):
        open_wallet(self.user)
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'balance': STARTING_POOL})

    def test_reflects_current_balance(self):
        wallet = open_wallet(self.user)
        post_transaction(wallet, Transaction.Type.BET, -750, 'Blackjack')
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.data, {'balance': STARTING_POOL - 750})

    def test_shows_only_own_wallet(self):
        open_wallet(self.user)
        other = User.objects.create_user('inny', 'inny@example.com', PASSWORD)
        post_transaction(open_wallet(other), Transaction.Type.WIN, 1000, 'wygrana')
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.data, {'balance': STARTING_POOL})

    def test_user_without_wallet_gets_404(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_is_rejected(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
