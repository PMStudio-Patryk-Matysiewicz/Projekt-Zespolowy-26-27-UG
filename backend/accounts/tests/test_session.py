from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from wallet.services import STARTING_POOL, open_wallet

PASSWORD = 'Zaq12wsx!'


def make_player(username='gracz', email='gracz@example.com', **extra):
    user = User.objects.create_user(username, email, PASSWORD, **extra)
    open_wallet(user)
    return user


class CsrfTests(APITestCase):
    def test_sets_csrf_cookie(self):
        response = self.client.get(reverse('auth-csrf'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIn('csrftoken', response.cookies)


class CsrfEnforcedTests(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        make_player()

    def token(self):
        self.client.get(reverse('auth-csrf'))
        return self.client.cookies['csrftoken'].value

    def test_login_without_token_is_rejected(self):
        response = self.client.post(reverse('auth-login'), {'login': 'gracz', 'password': PASSWORD}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn('_auth_user_id', self.client.session)

    def test_login_with_token_succeeds(self):
        response = self.client.post(
            reverse('auth-login'), {'login': 'gracz', 'password': PASSWORD}, format='json',
            HTTP_X_CSRFTOKEN=self.token(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_register_without_token_is_rejected(self):
        payload = {'username': 'nowy', 'email': 'nowy@example.com', 'password': PASSWORD}

        response = self.client.post(reverse('auth-register'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(username='nowy').exists())


class LoginTests(APITestCase):
    url = reverse('auth-login')

    def setUp(self):
        self.user = make_player(display_name='Gracz Jeden')

    def login(self, login, password=PASSWORD):
        return self.client.post(self.url, {'login': login, 'password': password}, format='json')

    def test_login_with_username(self):
        response = self.login('gracz')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(int(self.client.session['_auth_user_id']), self.user.pk)
        self.assertEqual(response.data, {
            'id': self.user.pk,
            'username': 'gracz',
            'email': 'gracz@example.com',
            'display_name': 'Gracz Jeden',
            'balance': STARTING_POOL,
        })

    def test_login_with_email_ignores_case(self):
        response = self.login('Gracz@Example.COM')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(int(self.client.session['_auth_user_id']), self.user.pk)

    def test_username_takes_precedence_over_someone_elses_email(self):
        other = make_player(username='gracz@example.org', email='inny@example.com')
        make_player(username='trzeci', email='gracz@example.org')

        response = self.login('gracz@example.org')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(int(self.client.session['_auth_user_id']), other.pk)

    def test_wrong_password_gives_generic_error(self):
        response = self.login('gracz', 'zle-haslo')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(response.data), ['non_field_errors'])
        self.assertNotIn('_auth_user_id', self.client.session)

    def test_unknown_login_gives_the_same_error_as_wrong_password(self):
        unknown = self.login('nieznany')
        wrong = self.login('gracz', 'zle-haslo')

        self.assertEqual(unknown.data, wrong.data)

    def test_inactive_user_cannot_log_in(self):
        self.user.is_active = False
        self.user.save()

        response = self.login('gracz')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_required_fields(self):
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(set(response.data), {'login', 'password'})


class LogoutTests(APITestCase):
    def test_logout_ends_the_session(self):
        make_player()
        self.client.login(username='gracz', password=PASSWORD)

        response = self.client.post(reverse('auth-logout'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertNotIn('_auth_user_id', self.client.session)
        self.assertEqual(self.client.get(reverse('auth-me')).status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_without_session_is_harmless(self):
        response = self.client.post(reverse('auth-logout'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class MeTests(APITestCase):
    url = reverse('auth-me')

    def test_returns_logged_in_player(self):
        user = make_player()
        self.client.force_authenticate(user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'gracz')
        self.assertEqual(response.data['balance'], STARTING_POOL)

    def test_anonymous_is_rejected(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
