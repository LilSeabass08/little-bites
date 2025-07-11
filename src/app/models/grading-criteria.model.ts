export interface GradingCriteria {
  ageGroups: AgeGroupCriteria[];
  categories: CategoryCriteria[];
  artificialIngredients: string[];
  allergens: string[];
  lastUpdated: Date;
}

export interface AgeGroupCriteria {
  ageGroup: '0-6months' | '6-12months' | '12-24months' | '2-5years';
  maxSodium: number; // mg per serving
  maxSugar: number; // g per serving
  maxFat: number; // g per serving
  minProtein: number; // g per serving
  minFiber: number; // g per serving
  maxCalories: number; // calories per serving
}

export interface CategoryCriteria {
  category: 'purees' | 'snacks' | 'drinks' | 'cereals' | 'meals';
  maxSodium: number;
  maxSugar: number;
  maxFat: number;
  minProtein: number;
  minFiber: number;
  maxCalories: number;
  bonusPoints: number;
  penaltyPoints: number;
}

export interface GradingWeights {
  sugar: number;
  sodium: number;
  fat: number;
  artificial: number;
  allergens: number;
  nutrition: number;
  protein: number;
  fiber: number;
}
