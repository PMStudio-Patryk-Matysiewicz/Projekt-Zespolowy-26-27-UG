from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, PlayerSerializer, RegisterSerializer


class IsAnonymous(BasePermission):
    message = 'You are already logged in.'

    def has_permission(self, request, view):
        return not request.user.is_authenticated


class EnforceCsrfMixin:
    """DRF checks CSRF only for logged-in users; login and register need it for anonymous ones too."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        SessionAuthentication().enforce_csrf(request)


@extend_schema(
    tags=['auth'],
    summary='Set the CSRF cookie',
    description='Sets the csrftoken cookie. Send its value in the X-CSRFToken header with every POST.',
    responses={204: None},
)
@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=['auth'],
    summary='Create an account',
    description='Creates the player, opens a wallet with the starting pool of 5,000 chips and logs the player in.',
    responses={201: PlayerSerializer},
)
class RegisterView(EnforceCsrfMixin, generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [IsAnonymous]

    def perform_create(self, serializer):
        user = serializer.save()
        login(self.request, user)


@extend_schema(
    tags=['auth'],
    summary='Log in',
    description='Logs in with a username or e-mail (case-insensitive) and password; starts a session.',
    request=LoginSerializer,
    responses={200: PlayerSerializer},
)
class LoginView(EnforceCsrfMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response(PlayerSerializer(user).data)


@extend_schema(tags=['auth'], summary='Log out', request=None, responses={204: None})
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['auth'], summary='Current player', responses={200: PlayerSerializer})
class MeView(generics.RetrieveAPIView):
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
