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

export const STEPS = [
  { id: 1, title: 'בחירת דגם', icon: 'truck' },
  { id: 2, title: 'בחירת ציוד', icon: 'utensils' },
  { id: 3, title: 'פרטי התקשרות', icon: 'user' },
] as const;
