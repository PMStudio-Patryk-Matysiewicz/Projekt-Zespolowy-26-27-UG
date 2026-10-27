from django.conf import settings
from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

HEALTH_STATES = ['ok', 'error']


class HealthView(APIView):
    """Liveness check for the deploy job and the version shown in the site footer."""

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id='health',
        responses={
            (200, 'application/json'): inline_serializer(
                name='Health',
                fields={
                    'status': serializers.ChoiceField(choices=HEALTH_STATES),
                    'version': serializers.CharField(),
                    'database': serializers.ChoiceField(choices=HEALTH_STATES),
                },
            ),
        },
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            database = 'ok'
        except DatabaseError:
            database = 'error'

        healthy = database == 'ok'
        return Response(
            {
                'status': 'ok' if healthy else 'error',
                'version': settings.APP_VERSION,
                'database': database,
            },
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
