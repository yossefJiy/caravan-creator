import cafeTruck from '@/assets/foodtruck-cafe.png';
import pizzaTruck from '@/assets/foodtruck-pizza.png';
import meatTruck from '@/assets/foodtruck-meat.png';
import type { FoodTruckType, Equipment } from '@/types/configurator';

export const foodTruckTypes: FoodTruckType[] = [
  {
    id: 'cafe',
    name: 'Cafe Truck',
    nameHe: 'קפה טראק',
    image: cafeTruck,
    sizes: [
      {
        id: 'cafe-small',
        name: 'Vesuvia 28',
        dimensions: '2.8 x 2 מטר',
        baseFeatures: [
          'חלון הגשה 2 מטר',
          'מקפיא שוכב',
          'מקרר הגשה',
          'תאורה חיצונית',
        ],
      },
      {
        id: 'cafe-medium',
        name: 'Vesuvia 40',
        dimensions: '4 x 2 מטר',
        baseFeatures: [
          'חלון הגשה 2 מטר',
          'מקפיא שוכב',
          'מקרר הגשה',
          'תאורה חיצונית',
          'מזגן 1.25 כ"ס',
          'טאבון/תנור אפייה',
        ],
      },
      {
        id: 'cafe-large',
        name: 'Vesuvia 50',
        dimensions: '5 x 2 מטר',
        baseFeatures: [
          'חלון הגשה 2 מטר',
          'מקפיא שוכב',
          'מקרר הגשה',
          'תאורה חיצונית',
          'מזגן 1.25 כ"ס',
          'טאבון/תנור אפייה',
          '2 משטחי עבודה מנירוסטה',
          'כיור ודלפק נירוסטה',
        ],
      },
    ],
  },
  {
    id: 'pizza',
    name: 'Pizza Truck',
    nameHe: 'פיצה טראק',
    image: pizzaTruck,
    sizes: [
      {
        id: 'pizza-small',
        name: 'Vesuvia 28',
        dimensions: '2.8 x 2 מטר',
        baseFeatures: [
          'תנור פיצה',
          'משטח הכנה',
          'מקרר מרכיבים',
          'כיור',
        ],
      },
      {
        id: 'pizza-medium',
        name: 'Vesuvia 40',
        dimensions: '4 x 2 מטר',
        baseFeatures: [
          'תנור פיצה כפול',
          'משטח הכנה גדול',
          'מקרר מרכיבים',
          'כיור כפול',
          'מזגן',
        ],
      },
      {
        id: 'pizza-large',
        name: 'Vesuvia 50',
        dimensions: '5 x 2 מטר',
        baseFeatures: [
          'תנור פיצה כפול',
          'משטח הכנה גדול',
          'מקרר מרכיבים',
          'כיור כפול',
          'מזגן',
          'אזור ישיבה',
        ],
      },
    ],
  },
  {
    id: 'meat',
    name: 'Meat Truck',
    nameHe: 'בשר טראק',
    image: meatTruck,
    sizes: [
      {
        id: 'meat-small',
        name: 'Vesuvia 28',
        dimensions: '2.8 x 2 מטר',
        baseFeatures: [
          'גריל מקצועי',
          'מקרר בשר',
          'משטח חיתוך',
          'כיור',
        ],
      },
      {
        id: 'meat-medium',
        name: 'Vesuvia 40',
        dimensions: '4 x 2 מטר',
        baseFeatures: [
          'גריל מקצועי גדול',
          'מעשנה',
          'מקרר בשר',
          'משטח חיתוך',
          'כיור כפול',
          'מזגן',
        ],
      },
      {
        id: 'meat-large',
        name: 'Vesuvia 50',
        dimensions: '5 x 2 מטר',
        baseFeatures: [
          'גריל מקצועי גדול',
          'מעשנה',
          'מקרר בשר כפול',
          'משטח חיתוך',
          'כיור כפול',
          'מזגן',
          'פלנצ\'ה',
        ],
      },
    ],
  },
];

export const equipment: Equipment[] = [
  // Cooking
  {
    id: 'gas-fryer',
    name: 'ציפסר גז',
    description: '28 ליטר',
    category: 'cooking',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/2feccc72d14dbf525a64245e2c51b41e_77d0c4fcfef170bdacbfecc275e327ab.jpg',
  },
  {
    id: 'electric-fryer',
    name: 'ציפסר חשמלי',
    description: '20 ליטר',
    category: 'cooking',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/shopping_98cc84a5e1e3c137d75222b30952a74d.webp',
  },
  {
    id: 'electric-griddle',
    name: 'פלנצ\'ה חשמלית',
    description: '1 מטר',
    category: 'cooking',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/96501_4f6e5ddc21b71e07497e57f4f2567901.jpg',
  },
  {
    id: 'gas-griddle',
    name: 'פלנצ\'ה גז',
    description: '',
    category: 'cooking',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/atmg48_hotpoint_griddle_1_833267d0f477138c333edcd18fb4a1dd.jpg',
  },
  {
    id: 'induction-cooktop',
    name: 'כירת אינדוקציה',
    description: 'תעשייתית 3500W',
    category: 'cooking',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/%D7%9B%D7%99%D7%A8%D7%AA_%D7%90%D7%99%D7%A0%D7%93%D7%95%D7%A7%D7%A6%D7%99%D7%94_%D7%AA%D7%A2%D7%A9%D7%99%D7%99%D7%AA%D7%99%D7%AA_3500_01_1024x1024_1a2db91037eb07073aaeec768b5cbb91.jpg',
  },
  // Refrigeration
  {
    id: 'drink-fridge',
    name: 'מקרר שתייה',
    description: '400 ליטר',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/1284f8e4_10e1_474f_b129_1a31706c0c26_2203_zywl0rcr_cccad6b58992c18c39f9363f61170963.webp',
  },
  {
    id: 'counter-freezer',
    name: 'מקפיא דלפק',
    description: '',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/untitled_image_33_bb3f49aeadfaaf77650ed249230dfc8a.png',
  },
  {
    id: 'counter-fridge-3door',
    name: 'מקרר דלפק',
    description: '3 דלתות נירוסטה',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/%D7%9E%D7%A7%D7%A8%D7%A8_%D7%93%D7%9C%D7%A4%D7%A7_%D7%A0%D7%99%D7%A8%D7%95%D7%A1%D7%98%D7%94_3_%D7%93%D7%9C%D7%AA%D7%95%D7%AA_5019f7c8ff4858ce09fcc1b89b1922f4.jpg',
  },
  {
    id: 'freezer-600',
    name: 'מקפיא',
    description: '600 ליטר',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/hotpoint_12387_freezer_1_1_2f33c8e7589f5d9723b3920b09784295.jpg',
  },
  {
    id: 'fridge-600',
    name: 'מקרר',
    description: '600 ליטר',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/hotpoint_fridge_xcw_823e0f7b37042e2e151c8fedd8e7e9af.jpg',
  },
  {
    id: 'ice-machine',
    name: 'מכונת קרח',
    description: '25 ק"ג',
    category: 'refrigeration',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/e8cd07e3cf7eee5cc45f9edb0388d30e_3ecd6df41d665de2a5b71c3cc3142d1d.jpg',
  },
  // Furniture
  {
    id: 'counter-table',
    name: 'שולחן דלפקי',
    description: '1×0.6 מטר',
    category: 'furniture',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/%D7%92%D7%9C%D7%90%D7%95%D7%9F_1_1_ae8050b4ea90850f6c82bac9fa19d01c.webp',
  },
  {
    id: 'sink-50',
    name: 'כיור',
    description: '50×50 ס"מ',
    category: 'furniture',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/4479734_0_1_596cf566ab153f4f27147d541a839475.webp',
  },
  {
    id: 'sink-60',
    name: 'כיור גדול',
    description: '60×60 ס"מ',
    category: 'furniture',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/4479734_0_1_02f369a08da1c54d781786e25a213c92.webp',
  },
  {
    id: 'storage-shelf',
    name: 'מדפי אחסון',
    description: '1 מטר',
    category: 'furniture',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/hot_point_israel_stailness_stell_20_1_c4f4448236d059b539bdd5e29194751f.jpg',
  },
  {
    id: 'aluminum-panel',
    name: 'אלומיניום מרוג',
    description: '1 מטר',
    category: 'furniture',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/%D7%A4%D7%97_%D7%9E%D7%A8%D7%95%D7%92_20220331083816_016_d7dfc31cec874b52e735fdf2061f89a7.jpg',
  },
  // Utilities
  {
    id: 'ac-125',
    name: 'מזגן',
    description: '1.25 כ"ס',
    category: 'utilities',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/4205_19122023181731_large_6454d6ed1003c4bc4b1fe1ce49a57bf6.jpg',
  },
  {
    id: 'ac-150',
    name: 'מזגן',
    description: '1.5 כ"ס',
    category: 'utilities',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/4205_19122023181731_large_200ae20a6fba9d0b2d5876e917b6e737.jpg',
  },
  // Extras
  {
    id: 'slush-machine',
    name: 'מכונת ברד',
    description: '2 טעמים',
    category: 'extras',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/hotpoint_slushy_2s_1_012d9be92350046d7179b1f0ae11f954.jpg',
  },
  {
    id: 'salamander-2',
    name: 'סלמנדרה',
    description: '2 קומות',
    category: 'extras',
    image: 'https://www.jotform.com/uploads/eliyacarsale/form_files/%D7%A1%D7%9C%D7%9E%D7%A0%D7%93%D7%A8%D7%94_2_%D7%A7%D7%95%D7%9E%D7%95%D7%AA_hot_point_eb02e63be7c0b89f5567433876067c6b.png',
  },
];

export const categoryNames: Record<string, string> = {
  cooking: 'ציוד בישול',
  refrigeration: 'קירור',
  furniture: 'ריהוט ומשטחים',
  utilities: 'מיזוג ותשתיות',
  extras: 'תוספות',
};
