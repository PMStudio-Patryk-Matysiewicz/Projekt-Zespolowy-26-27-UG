from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from accounts.models import User

PASSWORD = 'Zaq12wsx!'


class UserModelTests(TestCase):
    def test_auth_user_model_is_accounts_user(self):
        self.assertIs(get_user_model(), User)

    def test_str_prefers_display_name(self):
        user = User(username='gracz', email='gracz@example.com')
        self.assertEqual(str(user), 'gracz')

        user.display_name = 'Gracz Jeden'
        self.assertEqual(str(user), 'Gracz Jeden')

    def test_email_is_required(self):
        user = User(username='gracz', email='')
        user.set_password(PASSWORD)

        with self.assertRaises(ValidationError) as ctx:
            user.full_clean()

        self.assertIn('email', ctx.exception.message_dict)

    def test_email_is_unique_regardless_of_case_in_database(self):
        User.objects.create_user('pierwszy', 'Gracz@Example.com', PASSWORD)

        with self.assertRaises(IntegrityError):
            User.objects.create_user('drugi', 'gracz@example.com', PASSWORD)

    def test_duplicate_email_has_readable_validation_message(self):
        User.objects.create_user('pierwszy', 'gracz@example.com', PASSWORD)
        user = User(username='drugi', email='GRACZ@example.com')
        user.set_password(PASSWORD)

        with self.assertRaises(ValidationError) as ctx:
            user.full_clean()

        self.assertIn('A user with that e-mail address already exists.', ctx.exception.messages)
