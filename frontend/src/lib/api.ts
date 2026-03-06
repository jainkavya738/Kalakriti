/** API utility for communicating with the FastAPI backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  verifyToken: (token: string, data: { id_token: string; role?: string; name?: string; phone?: string }) =>
    apiFetch('/auth/verify', { method: 'POST', body: JSON.stringify(data), token }),
  getMe: (token: string) => apiFetch('/auth/me', { token }),

  // Products
  getProducts: (params?: URLSearchParams) =>
    apiFetch(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => apiFetch(`/products/${id}`),
  uploadProduct: (token: string, data: unknown) =>
    apiFetch('/products/upload', { method: 'POST', body: JSON.stringify(data), token }),
  updateProduct: (token: string, id: string, data: unknown) =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
  publishProduct: (token: string, id: string) =>
    apiFetch(`/products/${id}/publish`, { method: 'POST', token }),
  deleteProduct: (token: string, id: string) =>
    apiFetch(`/products/${id}`, { method: 'DELETE', token }),
  getProductTranslations: (productId: string) =>
    apiFetch(`/products/${productId}/translations`),

  // Artisans
  getArtisan: (id: string) => apiFetch(`/artisans/${id}`),
  getArtisanProducts: (artisanId: string) => apiFetch(`/artisans/${artisanId}/products`),
  registerArtisan: (token: string, data: unknown) =>
    apiFetch('/artisans/register', { method: 'POST', body: JSON.stringify(data), token }),
  getMyArtisanProfile: (token: string) => apiFetch('/artisans/me', { token }),
  getMyProducts: (token: string) => apiFetch('/artisans/me/products', { token }),

  // Orders
  getOrders: (token: string) => apiFetch('/orders', { token }),
  getOrder: (token: string, id: string) => apiFetch(`/orders/${id}`, { token }),
  getArtisanOrders: (token: string) => apiFetch('/orders/artisan', { token }),
  updateShipping: (token: string, orderId: string, data: unknown) =>
    apiFetch(`/orders/${orderId}/shipping`, { method: 'PUT', body: JSON.stringify(data), token }),

  // Payments
  createCheckout: (token: string, data: unknown) =>
    apiFetch('/payments/create-checkout-session', { method: 'POST', body: JSON.stringify(data), token }),

  // Reviews
  getProductReviews: (productId: string) => apiFetch(`/products/${productId}/reviews`),
  createReview: (token: string, data: unknown) =>
    apiFetch('/reviews', { method: 'POST', body: JSON.stringify(data), token }),

  // AI
  generateListing: (token: string, productId: string) =>
    apiFetch(`/ai/generate-listing?product_id=${productId}`, { method: 'POST', token }),
  translateProduct: (token: string, productId: string) =>
    apiFetch(`/ai/translate/${productId}`, { method: 'POST', token }),

  // Storage
  getPresignedUrl: (token: string, fileType: string, ext: string) =>
    apiFetch(`/storage/presigned-url?file_type=${fileType}&file_extension=${ext}`, { token }),

  // Admin
  getPendingArtisans: (token: string) => apiFetch('/admin/artisans/pending', { token }),
  verifyArtisan: (token: string, artisanId: string, data: unknown) =>
    apiFetch(`/admin/artisans/${artisanId}/verify`, { method: 'PUT', body: JSON.stringify(data), token }),
  getFlaggedProducts: (token: string) => apiFetch('/admin/products/flagged', { token }),

  // Custom Orders
  createCustomOrder: (token: string, data: unknown) =>
    apiFetch('/custom-orders', { method: 'POST', body: JSON.stringify(data), token }),
  getMyCustomOrders: (token: string) => apiFetch('/custom-orders', { token }),
};

