# test_App.py
import unittest
from App import app  # Assicurati di importare 'app' dal file App.py
import os
from unittest.mock import patch

class FlaskTest(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_run_script_no_references(self):
        response = self.app.post('/run-script', json={})
        self.assertEqual(response.status_code, 400)
        self.assertIn('No references provided', response.json['error'])

    def test_run_script_valid_references(self):
        response = self.app.post('/run-script', json={'references': ['FR205127567']})
        self.assertEqual(response.status_code, 200)
        self.assertIn('output', response.json)

    @patch.dict(os.environ, {'JIRA_USERNAME': '', 'JIRA_PASSWORD': ''})
    def test_run_script_missing_jira_credentials(self):
        response = self.app.post('/run-script', json={'references': ['FR205127567']})
        self.assertEqual(response.status_code, 500)
        self.assertIn('JIRA_USERNAME and JIRA_PASSWORD environment variables are required', response.json['error'])

if __name__ == "__main__":
    unittest.main()