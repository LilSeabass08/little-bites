import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NutritionData, NutritionFacts } from '../models/nutrition-data.model';
import { StorageService } from './storage.service';
import { FatSecretAuthService } from './fatsecret-auth.service';

export interface FatSecretFoodResponse {
  foods: {
    food: {
      food_id: string;
      food_name: string;
      food_description?: string;
      food_url?: string;
      brand_name?: string;
      servings: {
        serving: Array<{
          serving_id: string;
          serving_description: string;
          metric_serving_amount: number;
          metric_serving_unit: string;
          number_of_units: number;
          measurement_description: string;
          calories: number;
          carbohydrate: number;
          protein: number;
          fat: number;
          saturated_fat: number;
          polyunsaturated_fat: number;
          monounsaturated_fat: number;
          trans_fat: number;
          cholesterol: number;
          sodium: number;
          potassium: number;
          fiber: number;
          sugar: number;
          vitamin_c: number;
          vitamin_a: number;
          calcium: number;
          iron: number;
        }>;
      };
    };
  };
}

export interface FatSecretSearchResponse {
  foods: {
    food: Array<{
      food_id: string;
      food_name: string;
      food_description?: string;
      brand_name?: string;
      food_type: string;
      food_url?: string;
    }>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NutritionApiService {
  private readonly API_CONFIG = environment.nutritionApi;

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private fatSecretAuth: FatSecretAuthService
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
   * Fetch nutrition data from FatSecret API
   */
  private async fetchNutritionDataFromApi(
    barcode: string
  ): Promise<NutritionData> {
    try {
      // Get access token
      const accessToken = await this.fatSecretAuth.getAccessToken();

      // Search for food by barcode
      const searchParams = new HttpParams()
        .set('method', 'foods.search')
        .set('search_expression', barcode)
        .set('format', 'json');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      });

      const searchResponse = await this.http
        .get<FatSecretSearchResponse>(this.API_CONFIG.baseUrl, {
          headers,
          params: searchParams,
        })
        .pipe(
          timeout(this.API_CONFIG.timeout),
          retry(2),
          catchError(this.handleApiError.bind(this))
        )
        .toPromise();

      if (
        !searchResponse?.foods?.food ||
        searchResponse.foods.food.length === 0
      ) {
        throw new Error('No food found for this barcode');
      }

      // Get detailed nutrition info for the first result
      const foodId = searchResponse.foods.food[0].food_id;
      const nutritionData = await this.getFoodNutritionData(
        foodId,
        accessToken
      );

      return {
        barcode,
        productName: searchResponse.foods.food[0].food_name,
        brandName: searchResponse.foods.food[0].brand_name,
        servingSize: nutritionData.servingSize,
        nutritionFacts: nutritionData.nutritionFacts,
        ingredients: [], // FatSecret doesn't provide ingredients in basic API
        allergens: [], // FatSecret doesn't provide allergens in basic API
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching nutrition data from FatSecret:', error);
      throw error;
    }
  }

  /**
   * Get detailed nutrition data for a specific food ID
   */
  private async getFoodNutritionData(
    foodId: string,
    accessToken: string
  ): Promise<{ servingSize: string; nutritionFacts: NutritionFacts }> {
    const params = new HttpParams()
      .set('method', 'food.get.v2')
      .set('food_id', foodId)
      .set('format', 'json');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    const response = await this.http
      .get<FatSecretFoodResponse>(this.API_CONFIG.baseUrl, {
        headers,
        params,
      })
      .pipe(
        timeout(this.API_CONFIG.timeout),
        retry(2),
        catchError(this.handleApiError.bind(this))
      )
      .toPromise();

    if (!response?.foods?.food?.servings?.serving) {
      throw new Error('No nutrition data available for this food');
    }

    // Use the first serving for nutrition data
    const serving = response.foods.food.servings.serving[0];

    return {
      servingSize: serving.serving_description,
      nutritionFacts: {
        calories: serving.calories || 0,
        totalFat: serving.fat || 0,
        saturatedFat: serving.saturated_fat || 0,
        transFat: serving.trans_fat || 0,
        cholesterol: serving.cholesterol || 0,
        sodium: serving.sodium || 0,
        totalCarbohydrates: serving.carbohydrate || 0,
        dietaryFiber: serving.fiber || 0,
        totalSugars: serving.sugar || 0,
        addedSugars: 0, // FatSecret doesn't provide added sugars
        protein: serving.protein || 0,
        vitaminD: 0, // FatSecret doesn't provide vitamin D
        calcium: serving.calcium || 0,
        iron: serving.iron || 0,
        potassium: serving.potassium || 0,
      },
    };
  }

  /**
   * Search for products by name
   */
  async searchProductsByName(query: string): Promise<NutritionData[]> {
    try {
      const accessToken = await this.fatSecretAuth.getAccessToken();

      const params = new HttpParams()
        .set('method', 'foods.search')
        .set('search_expression', query)
        .set('max_results', '10')
        .set('format', 'json');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      });

      const response = await this.http
        .get<FatSecretSearchResponse>(this.API_CONFIG.baseUrl, {
          headers,
          params,
        })
        .pipe(
          timeout(this.API_CONFIG.timeout),
          retry(2),
          map((response) => this.transformSearchResults(response)),
          catchError(this.handleApiError.bind(this))
        )
        .toPromise();

      return response || [];
    } catch (error) {
      console.error('Error searching products:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to search products: ${errorMessage}`);
    }
  }

  /**
   * Transform search results to NutritionData format
   */
  private transformSearchResults(
    response: FatSecretSearchResponse
  ): NutritionData[] {
    if (!response?.foods?.food) {
      return [];
    }

    return response.foods.food.map((food) => ({
      barcode: '', // FatSecret doesn't provide barcodes in search results
      productName: food.food_name,
      brandName: food.brand_name,
      servingSize: 'Per serving',
      nutritionFacts: this.getDefaultNutritionFacts(),
      ingredients: [],
      allergens: [],
      timestamp: new Date(),
    }));
  }

  /**
   * Get default nutrition facts
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
      await this.fatSecretAuth.getAccessToken();
      return true;
    } catch (error) {
      console.error('API availability check failed:', error);
      return false;
    }
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
          errorMessage = 'Invalid API credentials or token expired';
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
          errorMessage = 'FatSecret server error';
          break;
        default:
          errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    }

    console.error('FatSecret API error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
