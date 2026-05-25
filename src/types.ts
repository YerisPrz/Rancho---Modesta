export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Miembro' | 'Invitado';
  avatar: string;
}

export interface ProductionRecord {
  id: string;
  date: string;
  product: string;
  quantity: number;
  unit: string;
  cost: number;
  revenue: number;
  profit: number; // calculated as revenue - cost
  location: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  registeredBy: string;
}

export interface PropertyRecord {
  id: string;
  name: string;
  type: string;
  tenant: string;
  monthlyRent: number;
  status: 'Al Día' | 'Pendiente' | 'En Mora';
  debt: number;
  vouchers: string[];
}

export interface ConfigItem {
  id: string;
  type: 'gasto' | 'producto' | 'terreno';
  value: string;
}

export interface AuditLog {
  id: string;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Participant {
  name: string;
  share: number;
  paid: boolean;
}

export interface SplitRecord {
  id: string;
  totalAmount: number;
  description: string;
  date: string;
  participants: Participant[];
}
