export type Category = "accessory" | "equipment";

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
}

export type TrainerLevel = "beginner" | "intermediate" | "advanced" | "elite";
export type TrainerSpecialty =
  | "strength"
  | "cardio"
  | "yoga"
  | "pilates"
  | "crossfit"
  | "rehabilitation"
  | "nutrition";

export interface TrainerService {
  id: string;
  name: string;
  level: TrainerLevel;
  specialty: TrainerSpecialty;
  description: string;
  hourlyRate: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

const catalogItems: CatalogItem[] = [
  {
    id: "cat-001",
    name: "Resistance Bands Set",
    category: "accessory",
    description: "Set of 5 resistance bands for strength and flexibility training",
    price: 29.99,
  },
  {
    id: "cat-002",
    name: "Foam Roller",
    category: "accessory",
    description: "High-density foam roller for muscle recovery and myofascial release",
    price: 24.99,
  },
  {
    id: "cat-003",
    name: "Jump Rope",
    category: "accessory",
    description: "Speed jump rope with adjustable length for cardio workouts",
    price: 14.99,
  },
  {
    id: "cat-004",
    name: "Treadmill Pro 3000",
    category: "equipment",
    description: "Commercial-grade treadmill with incline and heart-rate monitor",
    price: 1299.0,
  },
  {
    id: "cat-005",
    name: "Adjustable Dumbbells",
    category: "equipment",
    description: "Space-saving adjustable dumbbell set from 5 to 52.5 lbs",
    price: 349.0,
  },
  {
    id: "cat-006",
    name: "Power Rack",
    category: "equipment",
    description: "Heavy-duty squat rack with pull-up bar and safety spotter arms",
    price: 699.0,
  },
  {
    id: "cat-007",
    name: "Yoga Mat",
    category: "accessory",
    description: "Non-slip 6mm thick yoga mat with alignment lines",
    price: 39.99,
  },
  {
    id: "cat-008",
    name: "Stationary Bike",
    category: "equipment",
    description: "Indoor cycling bike with magnetic resistance and LCD display",
    price: 549.0,
  },
];

const trainerServices: TrainerService[] = [
  {
    id: "svc-001",
    name: "Alex Chen",
    level: "elite",
    specialty: "strength",
    description: "15 years of competitive powerlifting coaching; specializes in strength periodization",
    hourlyRate: 120,
  },
  {
    id: "svc-002",
    name: "Maria Santos",
    level: "advanced",
    specialty: "cardio",
    description: "Certified running coach with marathon and triathlon experience",
    hourlyRate: 85,
  },
  {
    id: "svc-003",
    name: "Jordan Lee",
    level: "intermediate",
    specialty: "yoga",
    description: "200-hour RYT certified yoga instructor focusing on alignment and breath",
    hourlyRate: 65,
  },
  {
    id: "svc-004",
    name: "Taylor Brooks",
    level: "beginner",
    specialty: "cardio",
    description: "Entry-level certified trainer; excellent for beginners starting their fitness journey",
    hourlyRate: 45,
  },
  {
    id: "svc-005",
    name: "Sam Rivera",
    level: "advanced",
    specialty: "crossfit",
    description: "CrossFit Level 2 coach with 8 years of functional fitness programming",
    hourlyRate: 90,
  },
  {
    id: "svc-006",
    name: "Dr. Priya Nair",
    level: "elite",
    specialty: "rehabilitation",
    description: "Physical therapist and CSCS; specializes in injury recovery and corrective exercise",
    hourlyRate: 150,
  },
  {
    id: "svc-007",
    name: "Chris Walton",
    level: "intermediate",
    specialty: "nutrition",
    description: "Certified sports nutritionist providing meal planning and supplement guidance",
    hourlyRate: 70,
  },
  {
    id: "svc-008",
    name: "Nina Park",
    level: "advanced",
    specialty: "pilates",
    description: "Comprehensive Pilates instructor trained in mat and reformer techniques",
    hourlyRate: 80,
  },
];

function paginate<T>(
  collection: T[],
  page: number,
  page_size: number
): PaginatedResponse<T> {
  const offset = (page - 1) * page_size;
  return {
    items: collection.slice(offset, offset + page_size),
    total: collection.length,
    page,
    page_size,
  };
}

export function getCatalogItems(opts: {
  category?: Category;
  page: number;
  page_size: number;
}): PaginatedResponse<CatalogItem> {
  const filtered = opts.category
    ? catalogItems.filter((i) => i.category === opts.category)
    : catalogItems;
  return paginate(filtered, opts.page, opts.page_size);
}

export function getTrainerServices(opts: {
  level?: TrainerLevel;
  specialty?: TrainerSpecialty;
  page: number;
  page_size: number;
}): PaginatedResponse<TrainerService> {
  let filtered = trainerServices;
  if (opts.level) filtered = filtered.filter((s) => s.level === opts.level);
  if (opts.specialty) filtered = filtered.filter((s) => s.specialty === opts.specialty);
  return paginate(filtered, opts.page, opts.page_size);
}
