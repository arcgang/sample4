const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let detail = `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed.detail) detail = parsed.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  description: string;
  accessoryCatalog: Accessory[];
  serviceCatalog: Service[];
  onboardedAt: string | null;
}

export interface Accessory {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface OnboardPartnerRequest {
  name: string;
  category: string;
  description: string;
}

export function fetchPartners(page = 1, pageSize = 20): Promise<ListResponse<Partner>> {
  return request<ListResponse<Partner>>(`/partners?page=${page}&page_size=${pageSize}`);
}

export function onboardPartner(body: OnboardPartnerRequest): Promise<Partner> {
  return request<Partner>("/partners", { method: "POST", body: JSON.stringify(body) });
}

export function fetchAccessories(page = 1, pageSize = 20): Promise<ListResponse<Accessory>> {
  return request<ListResponse<Accessory>>(`/catalog/accessories?page=${page}&page_size=${pageSize}`);
}

export function fetchServices(page = 1, pageSize = 20): Promise<ListResponse<Service>> {
  return request<ListResponse<Service>>(`/catalog/services?page=${page}&page_size=${pageSize}`);
}
