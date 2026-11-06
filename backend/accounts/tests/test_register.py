from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from wallet.models import Transaction
from wallet.services import STARTING_POOL

PASSWORD = 'Zaq12wsx!'


class RegisterTests(APITestCase):
    url = reverse('auth-register')

    def payload(self, **overrides):
        data = {
            'username': 'gracz',
            'email': 'gracz@example.com',
            'display_name': 'Gracz Jeden',
            'password': PASSWORD,
        }
        data.update(overrides)
        return data

    def test_creates_user_with_wallet_and_starting_pool(self):
        response = self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='gracz')
        self.assertEqual(user.email, 'gracz@example.com')
        self.assertEqual(user.display_name, 'Gracz Jeden')
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual(user.wallet.balance, STARTING_POOL)
        self.assertEqual(user.wallet.transactions.get().type, Transaction.Type.STARTING_POOL)

    def test_response_contains_user_and_balance_without_password(self):
        response = self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(response.data, {
            'id': User.objects.get().pk,
            'username': 'gracz',
            'email': 'gracz@example.com',
            'display_name': 'Gracz Jeden',
            'balance': STARTING_POOL,
        })

    def test_player_is_logged_in_after_registration(self):
        self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(int(self.client.session['_auth_user_id']), User.objects.get().pk)

    def test_display_name_is_optional(self):
        response = self.client.post(self.url, self.payload(display_name=''), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_username_is_reported_under_the_field(self):
        User.objects.create_user('gracz', 'inny@example.com', PASSWORD)

        response = self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ['username'])

    def test_duplicate_email_is_reported_under_the_field_regardless_of_case(self):
        User.objects.create_user('inny', 'Gracz@Example.com', PASSWORD)

        response = self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ['email'])
        self.assertEqual(str(response.data['email'][0]), 'A user with that e-mail address already exists.')

    def test_weak_password_is_rejected_by_django_validators(self):
        response = self.client.post(self.url, self.payload(password='12345678'), format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_password_similar_to_username_is_rejected(self):
        response = self.client.post(
            self.url, self.payload(username='kowalski123', password='kowalski123'), format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_required_fields(self):
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(set(response.data), {'username', 'email', 'password'})

    def test_invalid_input_creates_nothing(self):
        self.client.post(self.url, self.payload(email='zly-adres'), format='json')

        self.assertFalse(User.objects.exists())

    def test_logged_in_user_cannot_register_another_account(self):
        user = User.objects.create_user('juz', 'juz@example.com', PASSWORD)
        self.client.force_authenticate(user)

        response = self.client.post(self.url, self.payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(User.objects.count(), 1)
