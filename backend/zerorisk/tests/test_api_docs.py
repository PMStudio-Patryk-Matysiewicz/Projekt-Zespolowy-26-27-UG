from django.test import TestCase


class ApiDocsTests(TestCase):
    def test_openapi_schema_is_public(self):
        response = self.client.get(
            '/api/schema/',
            HTTP_ACCEPT='application/vnd.oai.openapi+json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['info']['title'], 'ZeroRisk API')

    def test_swagger_ui_is_public(self):
        response = self.client.get('/api/docs/')

        self.assertEqual(response.status_code, 200)
