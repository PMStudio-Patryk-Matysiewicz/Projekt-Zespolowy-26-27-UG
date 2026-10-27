from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower


class User(AbstractUser):
    """Player account: login, e-mail and the name shown at tables and in the ranking."""

    email = models.EmailField('email address')
    display_name = models.CharField(max_length=50, blank=True)

    class Meta(AbstractUser.Meta):
        constraints = [
            models.UniqueConstraint(
                Lower('email'),
                name='accounts_user_email_ci_unique',
                violation_error_message='A user with that e-mail address already exists.',
            ),
        ]

    def __str__(self):
        return self.display_name or self.username