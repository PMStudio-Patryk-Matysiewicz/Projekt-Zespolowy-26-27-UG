from unittest import mock

from django.db import DatabaseError
from django.test import TestCase, override_settings


class HealthEndpointTests(TestCase):
    @override_settings(APP_VERSION='abc1234')
    def test_returns_status_version_and_database(self):
        response = self.client.get('/api/health')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {'status': 'ok', 'version': 'abc1234', 'database': 'ok'},
        )

    def test_does_not_require_login(self):
        self.assertEqual(self.client.get('/api/health').status_code, 200)

    def test_returns_503_when_database_is_down(self):
        with mock.patch('core.views.connection.cursor', side_effect=DatabaseError):
            response = self.client.get('/api/health')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['status'], 'error')
        self.assertEqual(response.json()['database'], 'error')

    def test_is_listed_in_openapi_schema(self):
        response = self.client.get(
            '/api/schema/',
            HTTP_ACCEPT='application/vnd.oai.openapi+json',
        )

        self.assertIn('/api/health', response.json()['paths'])
