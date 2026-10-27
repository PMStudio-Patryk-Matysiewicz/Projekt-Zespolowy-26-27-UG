from django.test import TestCase

from accounts.models import User

PASSWORD = 'Test-only-password123!'


class UserAdminTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', PASSWORD)
        self.client.force_login(self.admin)

    def add_user(self, **overrides):
        data = {
            'username': 'gracz',
            'email': 'gracz@example.com',
            'display_name': 'Gracz',
            'usable_password': 'true',
            'password1': PASSWORD,
            'password2': PASSWORD,
        }
        data.update(overrides)
        return self.client.post('/admin/accounts/user/add/', data)

    def test_changelist_and_add_form_open(self):
        self.assertEqual(self.client.get('/admin/accounts/user/').status_code, 200)
        self.assertEqual(self.client.get('/admin/accounts/user/add/').status_code, 200)

    def test_add_form_creates_user_with_display_name(self):
        response = self.add_user()

        self.assertEqual(response.status_code, 302)
        self.assertTrue(User.objects.filter(username='gracz', display_name='Gracz').exists())

    def test_add_form_rejects_duplicate_email(self):
        response = self.add_user(email='ADMIN@example.com')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A user with that e-mail address already exists.')
        self.assertFalse(User.objects.filter(username='gracz').exists())

    def test_change_form_shows_display_name(self):
        response = self.client.get(f'/admin/accounts/user/{self.admin.pk}/change/')

        self.assertContains(response, 'name="display_name"')
