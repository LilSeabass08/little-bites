import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NutritionData, NutritionFacts } from '../models/nutrition-data.model';
import { StorageService } from './storage.service';

export interface NutritionApiResponse {
  foods: Array<{
    food_name: string;
    brand_name?: string;
    serving_qty: number;
    serving_unit: string;
    nix_item_id?: string;
    nix_brand_id?: string;
    nix_brand_name?: string;
    nix_item_name?: string;
    nix_item_description?: string;
    nix_item_ingredients?: string;
    nix_item_allergen_info?: string;
    nix_item_nutrition_info?: {
      calories: number;
      total_fat: number;
      saturated_fat: number;
      trans_fat: number;
      cholesterol: number;
      sodium: number;
      total_carbohydrate: number;
      dietary_fiber: number;
      total_sugars: number;
      added_sugars: number;
      protein: number;
      vitamin_d: number;
      calcium: number;
      iron: number;
      potassium: number;
    };
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class NutritionApiService {
  private readonly API_CONFIG = environment.nutritionApi;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  /**
   * Get nutrition data for a product by barcode
   */
  async getNutritionDataByBarcode(barcode: string): Promise<NutritionData> {
    try {
      // Check cache first
      const cachedData = await this.getCachedNutritionData(barcode);
      if (cachedData) {
        return cachedData;
      }

      // Fetch from API
      const nutritionData = await this.fetchNutritionDataFromApi(barcode);

      // Cache the result
      if (environment.features.enableCaching) {
        await this.storageService.cacheNutritionData(barcode, nutritionData);
      }

      return nutritionData;
    } catch (error) {
      console.error('Error getting nutrition data:', error);
      throw new Error(
        `Failed to retrieve nutrition data for barcode: ${barcode}`
      );
    }
  }

  /**
   * Fetch nutrition data from external API
   */
  private async fetchNutritionDataFromApi(
    barcode: string
  ): Promise<NutritionData> {
    const url = `${this.API_CONFIG.baseUrl}/search/item`;
    const headers = new HttpHeaders({
      'x-app-id': this.API_CONFIG.appId,
      'x-app-key': this.API_CONFIG.appKey,
      'x-remote-user-id': '0',
    });

    const params = {
      upc: barcode,
    };

    const response = await this.http
      .get<NutritionApiResponse>(url, { headers, params })
      .pipe(
        timeout(this.API_CONFIG.timeout),
        retry(2),
        map((response) => this.transformApiResponse(response, barcode)),
        catchError(this.handleApiError.bind(this))
      )
      .toPromise();

    if (!response) {
      throw new Error('No response from nutrition API');
    }

    return response;
  }

  /**
   * Transform API response to our NutritionData format
   */
  private transformApiResponse(
    response: NutritionApiResponse,
    barcode: string
  ): NutritionData {
    if (!response.foods || response.foods.length === 0) {
      throw new Error('No nutrition data found for this product');
    }

    const food = response.foods[0];
    const nutrition = food.nix_item_nutrition_info;

    if (!nutrition) {
      throw new Error('Nutrition information not available for this product');
    }

    return {
      barcode,
      productName: food.food_name,
      brandName: food.brand_name || food.nix_brand_name,
      servingSize: `${food.serving_qty} ${food.serving_unit}`,
      nutritionFacts: {
        calories: nutrition.calories || 0,
        totalFat: nutrition.total_fat || 0,
        saturatedFat: nutrition.saturated_fat || 0,
        transFat: nutrition.trans_fat || 0,
        cholesterol: nutrition.cholesterol || 0,
        sodium: nutrition.sodium || 0,
        totalCarbohydrates: nutrition.total_carbohydrate || 0,
        dietaryFiber: nutrition.dietary_fiber || 0,
        totalSugars: nutrition.total_sugars || 0,
        addedSugars: nutrition.added_sugars || 0,
        protein: nutrition.protein || 0,
        vitaminD: nutrition.vitamin_d || 0,
        calcium: nutrition.calcium || 0,
        iron: nutrition.iron || 0,
        potassium: nutrition.potassium || 0,
      },
      ingredients: this.parseIngredients(food.nix_item_ingredients),
      allergens: this.parseAllergens(food.nix_item_allergen_info),
      timestamp: new Date(),
    };
  }

  /**
   * Parse ingredients string into array
   */
  private parseIngredients(ingredientsString?: string): string[] {
    if (!ingredientsString) return [];

    return ingredientsString
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0);
  }

  /**
   * Parse allergens string into array
   */
  private parseAllergens(allergensString?: string): string[] {
    if (!allergensString) return [];

    return allergensString
      .split(',')
      .map((allergen) => allergen.trim())
      .filter((allergen) => allergen.length > 0);
  }

  /**
   * Get cached nutrition data
   */
  private async getCachedNutritionData(
    barcode: string
  ): Promise<NutritionData | null> {
    try {
      const cachedData = await this.storageService.getCachedNutritionData();
      const cached = cachedData[barcode];

      if (cached) {
        const cacheAge = Date.now() - cached.timestamp.getTime();
        const maxAge = environment.appConfig.cacheExpiryHours * 60 * 60 * 1000;

        if (cacheAge < maxAge) {
          return cached;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached nutrition data:', error);
      return null;
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching nutrition data';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid API credentials';
          break;
        case 403:
          errorMessage = 'API access denied';
          break;
        case 404:
          errorMessage = 'Product not found in nutrition database';
          break;
        case 429:
          errorMessage = 'API rate limit exceeded. Please try again later';
          break;
        case 500:
          errorMessage = 'Nutrition database server error';
          break;
        default:
          errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    }

    console.error('Nutrition API error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Search for products by name (fallback when barcode not found)
   */
  async searchProductsByName(query: string): Promise<NutritionData[]> {
    try {
      const url = `${this.API_CONFIG.baseUrl}/search/instant`;
      const headers = new HttpHeaders({
        'x-app-id': this.API_CONFIG.appId,
        'x-app-key': this.API_CONFIG.appKey,
        'x-remote-user-id': '0',
      });

      const params = {
        query,
        detailed: 'true',
      };

      const response = await this.http
        .get<NutritionApiResponse>(url, { headers, params })
        .pipe(
          timeout(this.API_CONFIG.timeout),
          map((response) =>
            response.foods.map((food) => this.transformSearchResult(food))
          ),
          catchError(this.handleApiError.bind(this))
        )
        .toPromise();

      if (!response) {
        return [];
      }

      return response;
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search for products');
    }
  }

  /**
   * Transform search result to NutritionData
   */
  private transformSearchResult(food: any): NutritionData {
    return {
      barcode: '', // Not available in search results
      productName: food.food_name,
      brandName: food.brand_name,
      servingSize: `${food.serving_qty || 1} ${food.serving_unit || 'serving'}`,
      nutritionFacts: this.getDefaultNutritionFacts(),
      ingredients: [],
      allergens: [],
      timestamp: new Date(),
    };
  }

  /**
   * Get default nutrition facts for search results
   */
  private getDefaultNutritionFacts(): NutritionFacts {
    return {
      calories: 0,
      totalFat: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrates: 0,
      dietaryFiber: 0,
      totalSugars: 0,
      addedSugars: 0,
      protein: 0,
      vitaminD: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
    };
  }

  /**
   * Check if API is available
   */
  async isApiAvailable(): Promise<boolean> {
    try {
      const url = `${this.API_CONFIG.baseUrl}/search/item`;
      const headers = new HttpHeaders({
        'x-app-id': this.API_CONFIG.appId,
        'x-app-key': this.API_CONFIG.appKey,
        'x-remote-user-id': '0',
      });

      await this.http
        .get(url, { headers })
        .pipe(
          timeout(5000),
          catchError(() => of(null))
        )
        .toPromise();

      return true;
    } catch (error) {
      return false;
    }
  }
}
