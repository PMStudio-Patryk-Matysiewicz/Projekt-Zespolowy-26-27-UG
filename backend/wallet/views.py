from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics

from .models import Wallet
from .serializers import WalletSerializer


@extend_schema(tags=['wallet'], summary="Logged-in player's chip balance")
class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer

    def get_object(self):
        return get_object_or_404(Wallet, user=self.request.user)
