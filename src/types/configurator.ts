export interface FoodTruckType {
  id: string;
  name: string;
  nameHe: string;
  image: string;
  sizes: FoodTruckSize[];
}

export interface FoodTruckSize {
  id: string;
  name: string;
  dimensions: string;
  baseFeatures: string[];
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  image: string;
}

export type EquipmentCategory = 
  | 'cooking' 
  | 'refrigeration' 
  | 'furniture' 
  | 'utilities' 
  | 'extras';

export interface ConfiguratorState {
  step: number;
  selectedType: string | null;
  selectedSize: string | null;
  selectedEquipment: Map<string, number>;
  contactDetails: ContactDetails | null;
}

export interface ContactDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
}

// Updated steps for 6-step flow (model and size separate)
export const STEPS = [
  { id: 0, title: 'ברוכים הבאים', icon: 'sparkles' },
  { id: 1, title: 'פרטים אישיים', icon: 'user' },
  { id: 2, title: 'בחירת דגם', icon: 'truck' },
  { id: 3, title: 'בחירת גודל', icon: 'ruler' },
  { id: 4, title: 'בחירת ציוד', icon: 'utensils' },
  { id: 5, title: 'סיכום ושליחה', icon: 'check' },
] as const;
