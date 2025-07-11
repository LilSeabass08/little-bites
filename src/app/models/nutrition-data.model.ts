export interface NutritionData {
  barcode: string;
  productName: string;
  brandName?: string;
  servingSize: string;
  nutritionFacts: NutritionFacts;
  ingredients: string[];
  allergens?: string[];
  timestamp: Date;
}

export interface NutritionFacts {
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbohydrates: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
}

export interface ProductGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0-100
  highlights: GradeHighlight[];
  recommendations: string[];
  timestamp: Date;
}

export interface GradeHighlight {
  category:
    | 'sugar'
    | 'sodium'
    | 'fat'
    | 'artificial'
    | 'allergens'
    | 'nutrition';
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact: string;
}

export interface ScannedProduct {
  barcode: string;
  nutritionData: NutritionData;
  grade: ProductGrade;
  scanDate: Date;
  isFavorite: boolean;
}
