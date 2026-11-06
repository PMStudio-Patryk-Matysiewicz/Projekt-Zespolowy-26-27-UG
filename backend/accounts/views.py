from django.contrib.auth import login
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import BasePermission

from .serializers import RegisterSerializer


class IsAnonymous(BasePermission):
    message = 'You are already logged in.'

    def has_permission(self, request, view):
        return not request.user.is_authenticated


@extend_schema(
    tags=['auth'],
    summary='Create an account',
    description='Creates the player, opens a wallet with the starting pool of 5,000 chips and logs the player in.',
)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [IsAnonymous]

    def perform_create(self, serializer):
        user = serializer.save()
        login(self.request, user)
