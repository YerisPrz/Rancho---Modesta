import { User, ProductionRecord, ExpenseRecord, PropertyRecord, ConfigItem, AuditLog } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u-1', username: 'rafael', fullName: 'Rafael Pérez (Padre)', role: 'Admin', avatar: '👨‍🌾' },
  { id: 'u-2', username: 'maria', fullName: 'María Pérez (Hija - Finanzas)', role: 'Miembro', avatar: '👩', ...({ id: 'u-2', username: 'maria', fullName: 'María Pérez (Hija - Finanzas)', role: 'Miembro', avatar: '👩‍🌾' }) },
  { id: 'u-3', username: 'carlos', fullName: 'Carlos Gómez (Supervisor Conucos)', role: 'Miembro', avatar: '👨‍🔧' }
];

export const INITIAL_PRODUCTION: ProductionRecord[] = [
  {
    id: 'p-1',
    date: '2026-05-22',
    product: 'Plátano Criollo',
    quantity: 400,
    unit: 'racimos',
    cost: 20000,
    revenue: 65000,
    profit: 45000,
    location: 'Conuco Los Ríos',
    notes: 'Distribución local directa a supermercados.'
  },
  {
    id: 'p-2',
    date: '2026-05-18',
    product: 'Aguacate Hass',
    quantity: 350,
    unit: 'cajas',
    cost: 35000,
    revenue: 95050,
    profit: 60050,
    location: 'Conuco Clavellina',
    notes: 'Recogida temprana por alertas de vaguada.'
  },
  {
    id: 'p-3',
    date: '2026-05-15',
    product: 'Mango Banilejo',
    quantity: 500,
    unit: 'cajas',
    cost: 40000,
    revenue: 120000,
    profit: 80000,
    location: 'Conuco Los Ríos',
    notes: 'Excelente cosecha, calibre óptimo para exportación.'
  },
  {
    id: 'p-4',
    date: '2026-05-08',
    product: 'Café Orgánico',
    quantity: 120,
    unit: 'sacos',
    cost: 25000,
    revenue: 82000,
    profit: 57000,
    location: 'Conuco Clavellina',
    notes: 'Secado al sol artesanal en patio loma.'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'e-1',
    date: '2026-05-22',
    category: 'Mantenimiento de Propiedades',
    description: 'Cambio de cerradura de puerta principal y llaves nuevas [Apartamento 1A]',
    amount: 3200,
    registeredBy: 'María Pérez'
  },
  {
    id: 'e-2',
    date: '2026-05-21',
    category: 'Herramientas',
    description: 'Serruchos de podar, guantes y tijeras recolectoras nuevas',
    amount: 8000,
    registeredBy: 'Carlos Gómez'
  },
  {
    id: 'e-3',
    date: '2026-05-20',
    category: 'Mantenimiento de Conucos',
    description: 'Reparación de cerco y compuerta de riego Conuco Los Ríos',
    amount: 18000,
    registeredBy: 'Carlos Gómez'
  },
  {
    id: 'e-4',
    date: '2026-05-18',
    category: 'Mantenimiento de Propiedades',
    description: 'Sustitución de compresor y limpieza de filtros de aire acondicionado split [Apartamento 3B]',
    amount: 7800,
    registeredBy: 'Carlos Gómez'
  },
  {
    id: 'e-5',
    date: '2026-05-17',
    category: 'Combustible de Maquinaria',
    description: 'Gasoil comercial para tractor y motobombas de agua',
    amount: 12000,
    registeredBy: 'Carlos Gómez'
  },
  {
    id: 'e-6',
    date: '2026-05-15',
    category: 'Sueldos y Jornales',
    description: 'Pago de quincena a recolectores de Conuco Los Ríos',
    amount: 55000,
    registeredBy: 'María Pérez'
  },
  {
    id: 'e-7',
    date: '2026-05-10',
    category: 'Insumos / Fertilizantes',
    description: 'Abono foliar y reguladores de crecimiento para mangos',
    amount: 15000,
    registeredBy: 'María Pérez'
  },
  {
    id: 'e-8',
    date: '2026-05-04',
    category: 'Mantenimiento de Propiedades',
    description: 'Pintura y resane de grietas menores en balcón frontal [Apartamento A-3]',
    amount: 4500,
    registeredBy: 'María Pérez'
  }
];

export const INITIAL_PROPERTIES: PropertyRecord[] = [
  {
    id: 'prop-1',
    name: 'Apartamento 1A',
    type: 'Apartamento',
    tenant: 'Carmen de la Cruz',
    monthlyRent: 16000,
    status: 'En Mora',
    debt: 32000,
    vouchers: []
  },
  {
    id: 'prop-2',
    name: 'Apartamento 3B',
    type: 'Apartamento',
    tenant: 'Ramón Almonte',
    monthlyRent: 22000,
    status: 'Pendiente',
    debt: 22000,
    vouchers: []
  },
  {
    id: 'prop-3',
    name: 'Apartamento A-3',
    type: 'Apartamento',
    tenant: 'Juan Pérez',
    monthlyRent: 18000,
    status: 'Al Día',
    debt: 0,
    vouchers: []
  },
  {
    id: 'prop-4',
    name: 'Tractorera & Almacén Jarabacoa',
    type: 'Nave Industrial',
    tenant: 'Agroquímicos del Valle',
    monthlyRent: 45000,
    status: 'Al Día',
    debt: 0,
    vouchers: []
  }
];

export const INITIAL_CONFIG: ConfigItem[] = [
  { id: 'c-1', type: 'producto', value: 'Plátano Criollo' },
  { id: 'c-2', type: 'producto', value: 'Aguacate Hass' },
  { id: 'c-3', type: 'producto', value: 'Mango Banilejo' },
  { id: 'c-4', type: 'producto', value: 'Café Orgánico' },
  { id: 'c-5', type: 'terreno', value: 'Conuco Clavellina (Café)' },
  { id: 'c-6', type: 'terreno', value: 'Conuco Los Ríos (Plátanos)' },
  { id: 'c-7', type: 'terreno', value: 'Conuco Clavellina (Aguacates)' },
  { id: 'c-8', type: 'terreno', value: 'Conuco Los Ríos (Mangos)' },
  { id: 'c-9', type: 'gasto', value: 'Mantenimiento de Conucos' },
  { id: 'c-10', type: 'gasto', value: 'Insumos / Fertilizantes' },
  { id: 'c-11', type: 'gasto', value: 'Servicios de Agua/Luz' },
  { id: 'c-12', type: 'gasto', value: 'Combustible de Maquinaria' },
  { id: 'c-13', type: 'gasto', value: 'Herramientas' },
  { id: 'c-14', type: 'gasto', value: 'Sueldos y Jornales' }
];

export const INITIAL_AUDIT: AuditLog[] = [
  {
    id: 'a-1',
    username: 'Rafael Pérez (Padre)',
    role: 'Admin',
    action: 'Sesión Iniciada',
    details: 'Ingresó al sistema Rancho Modesta.',
    timestamp: '2026-05-25 15:18:57'
  },
  {
    id: 'a-2',
    username: 'Rafael Pérez (Padre)',
    role: 'Admin',
    action: 'Sesión Cerrada',
    details: 'Salió de la aplicación de forma voluntaria.',
    timestamp: '2026-05-25 15:18:39'
  },
  {
    id: 'a-3',
    username: 'Rafael Pérez (Padre)',
    role: 'Admin',
    action: 'Sesión Iniciada',
    details: 'Ingresó al sistema Rancho Modesta.',
    timestamp: '2026-05-25 15:07:44'
  },
  {
    id: 'a-4',
    username: 'Carlos Gómez (Supervisor Conucos)',
    role: 'Miembro',
    action: 'Registro de Producción',
    details: 'Añadió lote de 400 racimos de Plátano Criollo.',
    timestamp: '2026-05-25 10:45:00'
  },
  {
    id: 'a-5',
    username: 'María Pérez (Hija - Finanzas)',
    role: 'Miembro',
    action: 'Registro de Gasto',
    details: 'Registró pago de quincena por RD$ 55,000 en Conuco Los Ríos.',
    timestamp: '2026-05-25 09:12:45'
  },
  {
    id: 'a-6',
    username: 'Rafael Pérez (Padre)',
    role: 'Admin',
    action: 'Inicio de Sistema',
    details: 'Inicio del sistema de administración familiar.',
    timestamp: '2026-05-25 08:30:12'
  }
];

// Localstorage state savers
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const record = localStorage.getItem(`rancho_modesta_${key}`);
    if (record) {
      return JSON.parse(record) as T;
    }
  } catch (err) {
    console.error("Local storage read error for:", key, err);
  }
  return defaultValue;
}

export function saveState<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`rancho_modesta_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error("Local storage save error for:", key, err);
  }
}

// Generate secure random standard UUID
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'uuid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}
