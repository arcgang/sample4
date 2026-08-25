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

export interface OnboardPartnerRequest {
  name: string;
  category: string;
  description: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ErrorEnvelope {
  detail: string;
  status_code: number;
}

const accessories: Accessory[] = [
  { id: "acc-1", name: "Resistance Bands Set", description: "Set of 5 resistance bands for strength training", price: 29.99 },
  { id: "acc-2", name: "Foam Roller", description: "High-density foam roller for muscle recovery", price: 24.99 },
  { id: "acc-3", name: "Yoga Mat", description: "Non-slip 6mm yoga mat for floor exercises", price: 39.99 },
  { id: "acc-4", name: "Jump Rope", description: "Speed jump rope with ball bearings", price: 14.99 },
  { id: "acc-5", name: "Dumbbells (pair)", description: "Adjustable dumbbells 5–25 lbs", price: 149.99 },
];

const services: Service[] = [
  { id: "svc-1", name: "Personal Training Session", description: "One-on-one coaching with a certified trainer", durationMinutes: 60 },
  { id: "svc-2", name: "Nutrition Consultation", description: "Personalised meal planning with a dietitian", durationMinutes: 45 },
  { id: "svc-3", name: "Group Fitness Class", description: "High-energy group workout session", durationMinutes: 50 },
  { id: "svc-4", name: "Body Composition Analysis", description: "Full-body scan with detailed report", durationMinutes: 30 },
  { id: "svc-5", name: "Recovery & Mobility Session", description: "Guided stretching and mobility work", durationMinutes: 45 },
];

let nextId = 1;
const partners: Partner[] = [
  {
    id: "p-1",
    name: "FitZone Pro",
    category: "Gym",
    description: "Full-service gym with strength, cardio, and recovery facilities.",
    accessoryCatalog: [accessories[0], accessories[1], accessories[4]],
    serviceCatalog: [services[0], services[2]],
    onboardedAt: "2025-01-15T09:00:00Z",
  },
  {
    id: "p-2",
    name: "Zen Wellness Studio",
    category: "Yoga & Wellness",
    description: "Holistic wellness studio specialising in yoga, meditation, and recovery.",
    accessoryCatalog: [accessories[2], accessories[1]],
    serviceCatalog: [services[4], services[1]],
    onboardedAt: "2025-03-10T10:00:00Z",
  },
];
nextId = 3;

function page<T>(items: T[], pageNum: number, pageSize: number): ListResponse<T> {
  const total = items.length;
  const start = (pageNum - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: pageNum, page_size: pageSize };
}

export function listPartners(pageNum = 1, pageSize = 20): ListResponse<Partner> {
  return page(partners, pageNum, pageSize);
}

export function onboardPartner(body: OnboardPartnerRequest): Partner | ErrorEnvelope {
  const name = body.name?.trim();
  const category = body.category?.trim();
  const description = body.description?.trim();

  if (!name) return { detail: "name is required", status_code: 400 };
  if (!category) return { detail: "category is required", status_code: 400 };
  if (!description) return { detail: "description is required", status_code: 400 };

  const partner: Partner = {
    id: `p-${nextId++}`,
    name,
    category,
    description,
    accessoryCatalog: accessories.slice(0, 2),
    serviceCatalog: services.slice(0, 2),
    onboardedAt: new Date().toISOString(),
  };
  partners.push(partner);
  return partner;
}

export function getAccessoryCatalog(pageNum = 1, pageSize = 20): ListResponse<Accessory> {
  return page(accessories, pageNum, pageSize);
}

export function getServiceCatalog(pageNum = 1, pageSize = 20): ListResponse<Service> {
  return page(services, pageNum, pageSize);
}
