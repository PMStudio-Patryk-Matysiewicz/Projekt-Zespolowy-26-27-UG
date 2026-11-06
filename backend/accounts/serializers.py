from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from wallet.services import open_wallet

from .models import User

DUPLICATE_EMAIL = 'A user with that e-mail address already exists.'
INVALID_CREDENTIALS = 'Invalid login or password.'


class PlayerSerializer(serializers.ModelSerializer):
    balance = serializers.IntegerField(source='wallet.balance', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name', 'balance']
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False, style={'input_type': 'password'})
    balance = serializers.IntegerField(source='wallet.balance', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name', 'password', 'balance']
        extra_kwargs = {'email': {'required': True, 'allow_blank': False}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(DUPLICATE_EMAIL)
        return value

    def validate(self, attrs):
        candidate = User(**{k: v for k, v in attrs.items() if k != 'password'})
        try:
            validate_password(attrs['password'], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)}) from exc
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        open_wallet(user)
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(help_text='Username or e-mail address.')
    password = serializers.CharField(trim_whitespace=False, style={'input_type': 'password'})

    def validate(self, attrs):
        login = attrs['login']
        account = (
            User.objects.filter(username=login).first()
            or User.objects.filter(email__iexact=login).first()
        )
        user = account and authenticate(
            self.context['request'], username=account.username, password=attrs['password'],
        )
        if not user:
            raise serializers.ValidationError(INVALID_CREDENTIALS)
        attrs['user'] = user
        return attrs
