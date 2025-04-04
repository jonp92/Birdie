const api_mapping = [
    {
        id: 'getConfig',
        url: '/config',
        method: 'GET',
        description: 'Get configuration',
        params: []
    },
]

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
    return url;
}

async function apiRequest(id, params, body = null) {
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