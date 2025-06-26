/**
 * Obtiene el token de autenticación de diferentes fuentes
 */
export const getAuthToken = (): string | null => {
    const getCookieValue = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop()?.split(';').shift();
            return cookieValue ? decodeURIComponent(cookieValue) : null;
        }
        return null;
    };

    const token =
        getCookieValue('jwtToken') ||
        sessionStorage.getItem('jwtToken') ||
        localStorage.getItem('jwtToken');

    return token ? token.replace(/^["']|["']$/g, '') : null;
};

/**
 * Wrapper para hacer fetch requests autenticados
 */
export const authenticatedFetch = async (
    url: string,
    options: RequestInit = {},
): Promise<Response> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
};

/**
 * Manejo de errores específicos de la API
 */
export class ApiError extends Error {
    public status: number;
    public statusText: string;

    constructor(status: number, statusText: string, message?: string) {
        super(message || `API Error: ${status} ${statusText}`);
        this.status = status;
        this.statusText = statusText;
        this.name = 'ApiError';
    }
} 