"""
    Caddy API client for managing Caddy server configurations.
    This module provides a class `CaddyAPI` that allows you to interact with the Caddy server's API.
    It includes methods for getting, updating, and deleting Caddy configurations, as well as managing
    Caddy's storage and certificates.
    The `CaddyAPI` class is initialized with the Caddy server's API URL and an optional auth token.
"""
import requests
import logging

class CaddyAPI:
    """
    A class to interact with the Caddy server API.

    Attributes:
        api_url (str): The base URL for the Caddy API.
        auth_token (str): Optional authentication token for the API.
    """

    def __init__(self, api_url, auth_token=None):
        """
        Initializes the CaddyAPI with the given API URL and optional auth token.

        Args:
            api_url (str): The base URL for the Caddy API.
            auth_token (str, optional): Optional authentication token for the API.
        """
        self.api_url = api_url
        self.auth_token = auth_token
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if auth_token:
            self.headers['Authorization'] = f'Bearer {auth_token}'
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler()
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.debug(f'Initialized CaddyAPI with URL: {self.api_url}')
        
    def _request(self, method, endpoint, **kwargs):
        """
        Helper method to make a request to the Caddy API.
        Args:
            method (str): The HTTP method to use (GET, POST, PUT, DELETE).
            endpoint (str): The API endpoint to call.
            **kwargs: Additional arguments to pass to the requests library.
        Returns:
            Response: The response from the API.
        Raises:
            requests.RequestException: If the request fails.
        """
        url = f'{self.api_url}{endpoint}'
        self.logger.debug(f'Making {method} request to {url} with params: {kwargs}')
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            self.logger.debug(f'Response: {response.status_code} - {response.text}')
            return response
        except requests.RequestException as e:
            self.logger.error(f'Error making request to {url}: {e}')
            raise
        
    def get_config(self, path=None):
        """
        Get the current Caddy configuration or a specific configuration at the given path.
        Args:
            path (str, optional): The configuration path to retrieve. Defaults to None.
        Returns:
            dict: The current Caddy configuration or the configuration at the specified path.
        """
        endpoint = f'/config/{path}' if path else '/config'
        response = self._request('GET', endpoint)
        return response.json()
    
    def add_to_config_array(self, path, items):
        """
        Add one or more items to an array in the Caddy configuration.

        Args:
            path (str): The configuration path to the array.
            items (list): The items to add to the array.

        Returns:
            dict: The updated Caddy configuration.
        """
        if not isinstance(items, list):
            raise ValueError("Items must be a list.")
        endpoint = f'/config/{path}/...'
        response = self._request('POST', endpoint, json=items)
        return response.json()

    def insert_into_config_array(self, path, index, item):
        """
        Insert an item into an array in the Caddy configuration at a specific index.

        Args:
            path (str): The configuration path to the array.
            index (int): The index at which to insert the item.
            item (any): The item to insert.

        Returns:
            dict: The updated Caddy configuration.
        """
        endpoint = f'/config/{path}/{index}'
        response = self._request('PUT', endpoint, json=item)
        return response.json()
    
    def replace_config_value(self, path, value):
        """
        Replace a value in the Caddy configuration.

        Args:
            path (str): The configuration path to replace the value.
            value (any): The new value to set.

        Returns:
            dict: The updated Caddy configuration.
        """
        endpoint = f'/config/{path}'
        response = self._request('PATCH', endpoint, json=value)
        return response.json()
    
    def delete_config(self, path=None):
        """
        Delete the Caddy configuration at the specified path or the entire configuration if no path is provided.

        Args:
            path (str, optional): The configuration path to delete. Defaults to None.

        Returns:
            dict: The response from the Caddy server.
        """
        endpoint = f'/config/{path}' if path else '/config'
        response = self._request('DELETE', endpoint)
        return response.json()
    
    def adapt_config(self, config, content_type='application/json'):
        """
        Adapt a configuration to Caddy JSON without loading or running it.

        Args:
            config (dict or str): The new Caddy configuration. Can be a dictionary or a string (e.g., Caddyfile).
            content_type (str): The Content-Type header specifying the configuration format. Defaults to 'application/json'.

        Returns:
            dict: The adapted Caddy configuration.
        """
        headers = self.headers.copy()
        headers['Content-Type'] = content_type
        response = self._request('POST', '/adapt', json=config if content_type == 'application/json' else None, data=config if content_type != 'application/json' else None, headers=headers)
        return response.json()
    
    def get_pki_ca(self, id):
        """
        Get the current PKI CA configuration.
        Returns:
            dict: The current PKI CA configuration.
        """
        response = self._request('GET', f'/pki/ca/{id}')
        return response.json()
    
    def get_pki_ca_certificates(self, id):
        """
        Get the current PKI CA certificates.
        Returns:
            dict: The current PKI CA certificates.
        """
        response = self._request('GET', f'/pki/ca/{id}/certificates')
        return response.json()
    
    def get_proxy_upstreams(self):
        """
        Get the current proxy upstreams.
        Returns:
            dict: The current proxy upstreams.
        """
        response = self._request('GET', '/reverse_proxy/upstreams')
        return response.json()
    
    def load_config(self, config, content_type='application/json'):
        """
        Set Caddy's configuration, overriding any previous configuration.

        Args:
            config (dict or str): The new Caddy configuration. Can be a dictionary or a string (e.g., Caddyfile).
            content_type (str): The Content-Type header specifying the configuration format. Defaults to 'application/json'.

        Returns:
            dict: The response from the Caddy server.
        """
        headers = self.headers.copy()
        headers['Content-Type'] = content_type
        response = self._request('POST', '/load', json=config if content_type == 'application/json' else None, data=config if content_type != 'application/json' else None, headers=headers)
        return response.json()

    def stop_server(self):
        """
        Gracefully shuts down the Caddy server and exits the process.

        Returns:
            dict: The response from the Caddy server.
        """
        response = self._request('POST', '/stop')
        return response.json()


if __name__ == "__main__":
    # Example usage
    api_url = "http://localhost:2019"
    caddy_api = CaddyAPI(api_url)
    
    # Get current configuration
    config = caddy_api.get_config()
    print("Current Configuration:", config)
    
    proxies = caddy_api.get_proxy_upstreams()
    print("Proxy Upstreams:", proxies)
    
    