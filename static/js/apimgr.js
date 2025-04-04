const api_mapping = [
    {
        id: 'getConfig',
        url: '/config/:path?',
        method: 'GET',
        description: 'Get configuration',
    },
    {
        id: 'updateConfig',
        url: '/config',
        method: 'POST',
        description: 'Update configuration',
    },
    {
        id: 'deleteConfig',
        url: '/config/:path?',
        method: 'DELETE',
        description: 'Delete configuration',
    },
    {
        id: 'stopServer',
        url: '/stop',
        method: 'POST',
        description: 'Stop the Caddy server',
    },
    {
        id: 'addToConfigArray',
        url: '/config/array',
        method: 'POST',
        description: 'Add items to a configuration array',
    },
    {
        id: 'insertIntoConfigArray',
        url: '/config/array/insert',
        method: 'POST',
        description: 'Insert an item into a configuration array',
    },
    {
        id: 'adaptConfig',
        url: '/adapt',
        method: 'POST',
        description: 'Adapt configuration to Caddy JSON',
    },
    {
        id: 'getPkiCa',
        url: '/pki/ca/:id',
        method: 'GET',
        description: 'Get PKI CA configuration',
    },
    {
        id: 'getPkiCaCertificates',
        url: '/pki/ca/:id/certificates',
        method: 'GET',
        description: 'Get PKI CA certificates',
    },
    {
        id: 'getProxyUpstreams',
        url: '/reverse_proxy/upstreams',
        method: 'GET',
        description: 'Get proxy upstreams',
    },
    {
        id: 'loadConfig',
        url: '/load',
        method: 'POST',
        description: 'Load a new configuration',
    },
];

function genUrl(id, params) {
    const api = api_mapping.find(api => api.id === id);
    if (!api) {
        throw new Error(`API with id ${id} not found`);
    }
    let url = api.url;
    if (params) {
        params.forEach(([key, value]) => {
            url = url.replace(`:${key}`, value);
        });
    }
    // Remove optional placeholders (e.g., ":path?") if not provided
    url = url.replace(/\/:[^/]+\?/g, '');
    return url;
}

async function apiRequest(id, params = [], body = null) {
    const api = api_mapping.find(api => api.id === id);
    if (!api) {
        throw new Error(`API with id ${id} not found`);
    }
    const url = genUrl(id, params);
    const options = {
        method: api.method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
    };
    const response = await fetch(url, options);
    return response.json();
}