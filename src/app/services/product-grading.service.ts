import { Injectable } from '@angular/core';
import {
  NutritionData,
  ProductGrade,
  GradeHighlight,
} from '../models/nutrition-data.model';
import {
  GradingCriteria,
  AgeGroupCriteria,
  CategoryCriteria,
  GradingWeights,
} from '../models/grading-criteria.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProductGradingService {
  private readonly DEFAULT_GRADING_WEIGHTS: GradingWeights = {
    sugar: 25,
    sodium: 20,
    fat: 15,
    artificial: 20,
    allergens: 10,
    nutrition: 5,
    protein: 3,
    fiber: 2,
  };

  constructor(private storageService: StorageService) {}

  /**
   * Grade a product based on its nutrition data
   */
  async gradeProduct(
    nutritionData: NutritionData,
    ageGroup: string = '6-12months'
  ): Promise<ProductGrade> {
    try {
      const criteria = await this.getGradingCriteria();
      const highlights = this.analyzeNutritionData(
        nutritionData,
        criteria,
        ageGroup
      );
      const score = this.calculateScore(highlights);
      const grade = this.calculateGrade(score);
      const recommendations = this.generateRecommendations(highlights, grade);

      return {
        grade,
        score,
        highlights,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error grading product:', error);
      throw new Error('Failed to grade product');
    }
  }

  /**
   * Analyze nutrition data against grading criteria
   */
  private analyzeNutritionData(
    nutritionData: NutritionData,
    criteria: GradingCriteria,
    ageGroup: string
  ): GradeHighlight[] {
    const highlights: GradeHighlight[] = [];
    const ageCriteria = this.getAgeGroupCriteria(criteria, ageGroup);
    const nutrition = nutritionData.nutritionFacts;

    // Check sugar content
    if (nutrition.totalSugars > ageCriteria.maxSugar) {
      highlights.push({
        category: 'sugar',
        severity: this.getSeverity(nutrition.totalSugars, ageCriteria.maxSugar),
        message: `High sugar content: ${nutrition.totalSugars}g per serving`,
        impact: `Exceeds recommended limit of ${ageCriteria.maxSugar}g for ${ageGroup}`,
      });
    }

    // Check sodium content
    if (nutrition.sodium > ageCriteria.maxSodium) {
      highlights.push({
        category: 'sodium',
        severity: this.getSeverity(nutrition.sodium, ageCriteria.maxSodium),
        message: `High sodium content: ${nutrition.sodium}mg per serving`,
        impact: `Exceeds recommended limit of ${ageCriteria.maxSodium}mg for ${ageGroup}`,
      });
    }

    // Check fat content
    if (nutrition.totalFat > ageCriteria.maxFat) {
      highlights.push({
        category: 'fat',
        severity: this.getSeverity(nutrition.totalFat, ageCriteria.maxFat),
        message: `High fat content: ${nutrition.totalFat}g per serving`,
        impact: `Exceeds recommended limit of ${ageCriteria.maxFat}g for ${ageGroup}`,
      });
    }

    // Check artificial ingredients
    const artificialIngredients = this.detectArtificialIngredients(
      nutritionData.ingredients,
      criteria.artificialIngredients || []
    );
    if (artificialIngredients.length > 0) {
      highlights.push({
        category: 'artificial',
        severity:
          artificialIngredients.length > 3
            ? 'high'
            : artificialIngredients.length > 1
            ? 'medium'
            : 'low',
        message: `Contains artificial ingredients: ${artificialIngredients.join(
          ', '
        )}`,
        impact: 'Artificial ingredients may not be suitable for young children',
      });
    }

    // Check allergens
    const detectedAllergens = this.detectAllergens(
      nutritionData.allergens || [],
      criteria.allergens || []
    );
    if (detectedAllergens.length > 0) {
      highlights.push({
        category: 'allergens',
        severity: 'high',
        message: `Contains allergens: ${detectedAllergens.join(', ')}`,
        impact: 'May cause allergic reactions in sensitive children',
      });
    }

    // Check protein content
    if (nutrition.protein < ageCriteria.minProtein) {
      highlights.push({
        category: 'nutrition',
        severity: this.getSeverity(ageCriteria.minProtein, nutrition.protein),
        message: `Low protein content: ${nutrition.protein}g per serving`,
        impact: `Below recommended minimum of ${ageCriteria.minProtein}g for ${ageGroup}`,
      });
    }

    // Check fiber content
    if (nutrition.dietaryFiber < ageCriteria.minFiber) {
      highlights.push({
        category: 'nutrition',
        severity: this.getSeverity(
          ageCriteria.minFiber,
          nutrition.dietaryFiber
        ),
        message: `Low fiber content: ${nutrition.dietaryFiber}g per serving`,
        impact: `Below recommended minimum of ${ageCriteria.minFiber}g for ${ageGroup}`,
      });
    }

    // Check calories
    if (nutrition.calories > ageCriteria.maxCalories) {
      highlights.push({
        category: 'nutrition',
        severity: this.getSeverity(nutrition.calories, ageCriteria.maxCalories),
        message: `High calorie content: ${nutrition.calories} calories per serving`,
        impact: `Exceeds recommended limit of ${ageCriteria.maxCalories} calories for ${ageGroup}`,
      });
    }

    return highlights;
  }

  /**
   * Get age group criteria
   */
  private getAgeGroupCriteria(
    criteria: GradingCriteria,
    ageGroup: string
  ): AgeGroupCriteria {
    const ageCriteria = criteria.ageGroups.find(
      (ag) => ag.ageGroup === ageGroup
    );
    if (!ageCriteria) {
      // Return default criteria for 6-12 months if age group not found
      return (
        criteria.ageGroups.find((ag) => ag.ageGroup === '6-12months') || {
          ageGroup: '6-12months',
          maxSodium: 140,
          maxSugar: 6,
          maxFat: 3,
          minProtein: 2,
          minFiber: 1,
          maxCalories: 120,
        }
      );
    }
    return ageCriteria;
  }

  /**
   * Calculate severity level based on value vs limit
   */
  private getSeverity(value: number, limit: number): 'low' | 'medium' | 'high' {
    const ratio = value / limit;
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Detect artificial ingredients
   */
  private detectArtificialIngredients(
    ingredients: string[],
    artificialList: string[]
  ): string[] {
    const detected: string[] = [];

    ingredients.forEach((ingredient) => {
      const lowerIngredient = ingredient.toLowerCase();
      artificialList.forEach((artificial) => {
        if (lowerIngredient.includes(artificial.toLowerCase())) {
          detected.push(artificial);
        }
      });
    });

    return [...new Set(detected)]; // Remove duplicates
  }

  /**
   * Detect allergens
   */
  private detectAllergens(
    productAllergens: string[],
    criteriaAllergens: string[]
  ): string[] {
    const detected: string[] = [];

    productAllergens.forEach((allergen) => {
      const lowerAllergen = allergen.toLowerCase();
      criteriaAllergens.forEach((criteriaAllergen) => {
        if (lowerAllergen.includes(criteriaAllergen.toLowerCase())) {
          detected.push(criteriaAllergen);
        }
      });
    });

    return [...new Set(detected)]; // Remove duplicates
  }

  /**
   * Calculate overall score based on highlights
   */
  private calculateScore(highlights: GradeHighlight[]): number {
    let score = 100;
    const weights = this.DEFAULT_GRADING_WEIGHTS;

    highlights.forEach((highlight) => {
      const weight = weights[highlight.category] || 5;
      const severityMultiplier =
        highlight.severity === 'high'
          ? 2
          : highlight.severity === 'medium'
          ? 1.5
          : 1;
      score -= weight * severityMultiplier;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on highlights and grade
   */
  private generateRecommendations(
    highlights: GradeHighlight[],
    grade: string
  ): string[] {
    const recommendations: string[] = [];

    if (grade === 'A') {
      recommendations.push('Excellent choice for your baby!');
      recommendations.push('This product meets all nutritional guidelines.');
    } else if (grade === 'B') {
      recommendations.push('Good choice with minor concerns.');
      recommendations.push(
        'Consider as an occasional treat rather than daily food.'
      );
    } else if (grade === 'C') {
      recommendations.push('Moderate nutritional value.');
      recommendations.push(
        'Consider healthier alternatives for regular consumption.'
      );
    } else if (grade === 'D') {
      recommendations.push('Not recommended for regular consumption.');
      recommendations.push(
        'Look for products with lower sugar and sodium content.'
      );
    } else {
      recommendations.push('Not suitable for babies.');
      recommendations.push(
        'Choose products specifically designed for infant nutrition.'
      );
    }

    // Add specific recommendations based on highlights
    highlights.forEach((highlight) => {
      switch (highlight.category) {
        case 'sugar':
          recommendations.push('Look for products with no added sugars.');
          break;
        case 'sodium':
          recommendations.push('Choose low-sodium alternatives.');
          break;
        case 'artificial':
          recommendations.push(
            'Prefer products with natural ingredients only.'
          );
          break;
        case 'allergens':
          recommendations.push('Consult with pediatrician before introducing.');
          break;
      }
    });

    return recommendations;
  }

  /**
   * Get grading criteria from storage or use defaults
   */
  private async getGradingCriteria(): Promise<GradingCriteria> {
    try {
      const storedCriteria = await this.storageService.getGradingCriteria();
      if (storedCriteria) {
        return storedCriteria;
      }
    } catch (error) {
      console.error('Error retrieving grading criteria:', error);
    }

    // Return default criteria if none stored
    return this.getDefaultGradingCriteria();
  }

  /**
   * Get default grading criteria
   */
  private getDefaultGradingCriteria(): GradingCriteria {
    return {
      ageGroups: [
        {
          ageGroup: '0-6months',
          maxSodium: 140,
          maxSugar: 0,
          maxFat: 3,
          minProtein: 1,
          minFiber: 0,
          maxCalories: 100,
        },
        {
          ageGroup: '6-12months',
          maxSodium: 140,
          maxSugar: 6,
          maxFat: 3,
          minProtein: 2,
          minFiber: 1,
          maxCalories: 120,
        },
        {
          ageGroup: '12-24months',
          maxSodium: 200,
          maxSugar: 8,
          maxFat: 4,
          minProtein: 3,
          minFiber: 2,
          maxCalories: 150,
        },
        {
          ageGroup: '2-5years',
          maxSodium: 300,
          maxSugar: 12,
          maxFat: 5,
          minProtein: 4,
          minFiber: 3,
          maxCalories: 200,
        },
      ],
      categories: [
        {
          category: 'purees',
          maxSodium: 140,
          maxSugar: 6,
          maxFat: 3,
          minProtein: 2,
          minFiber: 1,
          maxCalories: 120,
          bonusPoints: 5,
          penaltyPoints: 10,
        },
        {
          category: 'snacks',
          maxSodium: 200,
          maxSugar: 8,
          maxFat: 4,
          minProtein: 3,
          minFiber: 2,
          maxCalories: 150,
          bonusPoints: 0,
          penaltyPoints: 15,
        },
      ],
      artificialIngredients: [
        'artificial colors',
        'artificial flavors',
        'artificial sweeteners',
        'aspartame',
        'saccharin',
        'sucralose',
        'acesulfame potassium',
        'high fructose corn syrup',
        'partially hydrogenated',
        'trans fat',
      ],
      allergens: [
        'milk',
        'eggs',
        'fish',
        'shellfish',
        'tree nuts',
        'peanuts',
        'wheat',
        'soy',
      ],
      lastUpdated: new Date(),
    };
  }
}
