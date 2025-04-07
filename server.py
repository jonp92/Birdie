from flask import Flask, request, jsonify, render_template, send_from_directory
import flask_compress
import logging
import os
from caddy_api import CaddyAPI

class BirdieServer:
    """
    Flask server to provide access to the CaddyAPI.
    """

    def __init__(self, api_url, auth_token=None, port=5002, host='0.0.0.0'):
        """
        Initializes the Flask server and the CaddyAPI client.

        Args:
            api_url (str): The base URL for the Caddy API.
            auth_token (str, optional): Optional authentication token for the API.
        """
        __name__ = "BirdieServer"
        self.app = Flask(__name__)
        self.port = port
        self.host = host
        self.caddy_api = CaddyAPI(api_url, auth_token)
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler()
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.debug('Initialized BirdieServer, Caddy Admin API URL: %s', api_url)
        
        # Enable compression for all responses
        flask_compress.Compress(self.app)

        # Define routes
        self.app.add_url_rule('/config', 'get_config', self.get_config, methods=['GET'])
        self.app.add_url_rule('/config', 'update_config', self.update_config, methods=['POST'])
        self.app.add_url_rule('/config', 'delete_config', self.delete_config, methods=['DELETE'])
        self.app.add_url_rule('/stop', 'stop_server', self.stop_server, methods=['POST'])
        self.app.add_url_rule('/config/array', 'add_to_config_array', self.add_to_config_array, methods=['POST'])
        self.app.add_url_rule('/config/array/insert', 'insert_into_config_array', self.insert_into_config_array, methods=['POST'])
        self.app.add_url_rule('/adapt', 'adapt_config', self.adapt_config, methods=['POST'])
        self.app.add_url_rule('/pki/ca', 'get_pki_ca', self.get_pki_ca, methods=['GET'])
        self.app.add_url_rule('/pki/ca/certificates', 'get_pki_ca_certificates', self.get_pki_ca_certificates, methods=['GET'])
        self.app.add_url_rule('/reverse_proxy/upstreams', 'get_proxy_upstreams', self.get_proxy_upstreams, methods=['GET'])
        self.app.add_url_rule('/load', 'load_config', self.load_config, methods=['POST'])
        self.app.add_url_rule('/test', 'test', self.test, methods=['GET'])
        self.app.add_url_rule('/add_site', 'add_site', self.add_site, methods=['GET'])
        self.app.add_url_rule('/dragdrop', 'drag_drop', self.drag_drop, methods=['GET'])

    def get_config(self):
        """
        Endpoint to get the current Caddy configuration or a specific configuration path.
        """
        path = request.args.get('path')
        try:
            config = self.caddy_api.get_config(path)
            return jsonify(config), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def update_config(self):
        """
        Endpoint to update the Caddy configuration.
        """
        data = request.json
        if not data or 'path' not in data or 'value' not in data:
            return jsonify({'error': 'Invalid request. "path" and "value" are required.'}), 400

        try:
            updated_config = self.caddy_api.replace_config_value(data['path'], data['value'])
            return jsonify(updated_config), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def delete_config(self):
        """
        Endpoint to delete the Caddy configuration at a specific path or the entire configuration.
        """
        path = request.args.get('path')
        try:
            response = self.caddy_api.delete_config(path)
            return jsonify(response), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def stop_server(self):
        """
        Endpoint to gracefully shut down the Caddy server.
        """
        try:
            response = self.caddy_api.stop_server()
            return jsonify(response), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    def add_to_config_array(self):
        """
        Endpoint to add items to an array in the Caddy configuration.
        """
        data = request.json
        if not data or 'path' not in data or 'items' not in data:
            return jsonify({'error': 'Invalid request. "path" and "items" are required.'}), 400
        path = data['path']
        items = data['items']
        self.logger.debug(f"Items to be added to config array at path: {path} with items: {items}")
        updated_config = self.caddy_api.add_to_config_array(data['path'], data['items'])
        self.logger.debug(f"Updated config: {updated_config}")
        try:
            self.logger.debug("Trying to add items to config array")
            
            self.logger.debug(f"Updated config: {updated_config}")
            return jsonify(updated_config), 200
        except Exception as e:
            self.logger.error(f"Error adding to config array: {e}")
            return jsonify({'error': str(e)}), 500

    def insert_into_config_array(self):
        """
        Endpoint to insert an item into an array in the Caddy configuration.
        """
        data = request.json
        if not data or 'path' not in data or 'index' not in data or 'item' not in data:
            return jsonify({'error': 'Invalid request. "path", "index", and "item" are required.'}), 400

        try:
            updated_config = self.caddy_api.insert_into_config_array(data['path'], data['index'], data['item'])
            return jsonify(updated_config), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def adapt_config(self):
        """
        Endpoint to adapt a configuration to Caddy JSON.
        """
        data = request.json
        if not data or 'config' not in data:
            return jsonify({'error': 'Invalid request. "config" is required.'}), 400

        content_type = request.headers.get('Content-Type', 'application/json')
        try:
            adapted_config = self.caddy_api.adapt_config(data['config'], content_type)
            return jsonify(adapted_config), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def get_pki_ca(self):
        """
        Endpoint to get the current PKI CA configuration.
        """
        ca_id = request.args.get('id')
        if not ca_id:
            return jsonify({'error': '"id" query parameter is required.'}), 400

        try:
            ca_config = self.caddy_api.get_pki_ca(ca_id)
            return jsonify(ca_config), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def get_pki_ca_certificates(self):
        """
        Endpoint to get the current PKI CA certificates.
        """
        ca_id = request.args.get('id')
        if not ca_id:
            return jsonify({'error': '"id" query parameter is required.'}), 400

        try:
            certificates = self.caddy_api.get_pki_ca_certificates(ca_id)
            return jsonify(certificates), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def get_proxy_upstreams(self):
        """
        Endpoint to get the current proxy upstreams.
        """
        try:
            upstreams = self.caddy_api.get_proxy_upstreams()
            return jsonify(upstreams), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def load_config(self):
        """
        Endpoint to load a new Caddy configuration.
        """
        data = request.json
        if not data or 'config' not in data:
            return jsonify({'error': 'Invalid request. "config" is required.'}), 400

        content_type = request.headers.get('Content-Type', 'application/json')
        try:
            response = self.caddy_api.load_config(data['config'], content_type)
            return jsonify(response), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def test(self):
        """
        Load the test.html file.
        """
        return render_template('test.html')
    
    def add_site(self):
        """
        Serve the add_site.html file.
        """
        templates_path = os.path.join(os.path.dirname(__file__), 'static', 'templates')
        with open(os.path.join(templates_path, 'route_templates.html'), 'r') as f:
            templates = f.read()
        print(templates)
        return render_template('add_site.html', templates=templates)
    
    def drag_drop(self):
        """
        Serve the dragdrop.html file.
        """
        return render_template('dragdrop.html')
    
    def run(self):
        """
        Runs the Flask server.

        Args:
            host (str): The host to bind the server to. Defaults to '0.0.0.0'.
            port (int): The port to bind the server to. Defaults to 5002.
        """
        self.logger.info(f'Server starting on http://{self.host}:{self.port}')
        self.app.run(host=self.host, port=self.port, debug=True)
        
if __name__ == "__main__":
    # Example usage
    api_url = "http://localhost:2019"
    server = BirdieServer(api_url)
    server.run()
else:
    # export app for gunicorn
    from dotenv import load_dotenv
    load_dotenv()
    caddy_admin_url = os.getenv('CADDY_ADMIN_API_URL', 'http://localhost:2019')
    caddy_auth_token = os.getenv('CADDY_AUTH_TOKEN')
    if caddy_auth_token:
        server = BirdieServer(caddy_admin_url, caddy_auth_token).app
    else:
        server = BirdieServer(caddy_admin_url).app