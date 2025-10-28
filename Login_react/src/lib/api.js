const DEFAULT_API_BASE = 'http://127.0.0.1:9292';

export const API_BASE_URL = import.meta.env.VITE_API_SERVER || DEFAULT_API_BASE;

export async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const text = await response.text();
    let data;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (error) {
            data = text;
        }
    }

    if (!response.ok) {
        const error = new Error(
            (data && typeof data === 'object' && data.message) || response.statusText || 'Request failed'
        );
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data ?? null;
}