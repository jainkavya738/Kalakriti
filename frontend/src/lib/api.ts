/**
 * API client for communicating with the Kala-Kriti FastAPI backend.
 * All API calls are centralized here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get stored auth token from localStorage (client-side only).
 */
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

/**
 * Generic fetch wrapper with error handling and optional auth.
 */
async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit & { auth?: boolean }
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string>),
    };

    // Auto-attach auth token if requested
    if (options?.auth) {
        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    // Remove our custom 'auth' from options before passing to fetch
    const { auth: _, ...fetchOptions } = options || {};

    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...fetchOptions,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `API error: ${res.status}`);
    }

    return res.json();
}

// --- Auth ---
export const authAPI = {
    register: (data: {
        name: string;
        email: string;
        password: string;
        role: string;
        phone?: string;
        location?: string;
    }) => apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

    // Fixed: send credentials as JSON body, not query params
    login: (email: string, password: string) =>
        apiFetch<{ message: string; token: string; user: { id: string; email: string; role: string; name: string } }>(
            "/api/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) }
        ),
};

// --- Products ---
export const productsAPI = {
    list: (params?: {
        category?: string;
        craft_type?: string;
        region?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) => {
        const query = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined) query.append(key, String(val));
            });
        }
        return apiFetch(`/api/products/?${query.toString()}`);
    },

    get: (id: string) => apiFetch(`/api/products/${id}`),

    create: (data: { artisan_id: string; price: number; image_url?: string; audio_url?: string }) =>
        apiFetch("/api/products/", { method: "POST", body: JSON.stringify(data) }),

    update: (id: string, data: Record<string, unknown>) =>
        apiFetch(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

    generateAI: (id: string) =>
        apiFetch(`/api/products/${id}/generate`, { method: "POST" }),

    publish: (id: string) =>
        apiFetch(`/api/products/${id}/publish`, { method: "POST" }),
};

// --- Upload ---
export const uploadAPI = {
    image: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/api/upload/image`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Image upload failed");
        return res.json();
    },

    audio: async (blob: Blob): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        const res = await fetch(`${API_BASE}/api/upload/audio`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Audio upload failed");
        return res.json();
    },
};

// --- Artisans ---
export const artisansAPI = {
    get: (id: string) => apiFetch(`/api/artisans/${id}`),

    createProfile: (data: Record<string, unknown>) =>
        apiFetch("/api/artisans/profile", { method: "POST", body: JSON.stringify(data), auth: true }),

    updateProfile: (id: string, data: Record<string, unknown>) =>
        apiFetch(`/api/artisans/${id}`, { method: "PUT", body: JSON.stringify(data), auth: true }),

    getProducts: (id: string) => apiFetch(`/api/artisans/${id}/products`),
};

// --- Orders ---
export const ordersAPI = {
    place: (data: {
        product_id: string;
        buyer_id?: string;
        buyer_name: string;
        buyer_email: string;
        buyer_phone?: string;
        message?: string;
    }) => apiFetch("/api/orders/", { method: "POST", body: JSON.stringify(data) }),

    get: (id: string) => apiFetch(`/api/orders/${id}`),
};
