import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  ScannedProduct,
  NutritionData,
  ProductGrade,
} from '../models/nutrition-data.model';
import { GradingCriteria } from '../models/grading-criteria.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly STORAGE_KEYS = environment.storageKeys;

  constructor() {}

  /**
   * Store scanned product data
   */
  async saveScannedProduct(product: ScannedProduct): Promise<void> {
    try {
      const products = await this.getScannedProducts();
      const existingIndex = products.findIndex(
        (p) => p.barcode === product.barcode
      );

      if (existingIndex >= 0) {
        products[existingIndex] = product;
      } else {
        products.unshift(product);

        // Limit the number of stored products
        if (products.length > environment.appConfig.maxScanHistory) {
          products.splice(environment.appConfig.maxScanHistory);
        }
      }

      localStorage.setItem(
        this.STORAGE_KEYS.SCANNED_PRODUCTS,
        JSON.stringify(products)
      );
    } catch (error) {
      console.error('Error saving scanned product:', error);
      throw new Error('Failed to save scanned product data');
    }
  }

  /**
   * Retrieve all scanned products
   */
  async getScannedProducts(): Promise<ScannedProduct[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SCANNED_PRODUCTS);
      if (!data) return [];

      const products = JSON.parse(data) as ScannedProduct[];
      return products.map((product) => ({
        ...product,
        nutritionData: {
          ...product.nutritionData,
          timestamp: new Date(product.nutritionData.timestamp),
        },
        grade: {
          ...product.grade,
          timestamp: new Date(product.grade.timestamp),
        },
        scanDate: new Date(product.scanDate),
      }));
    } catch (error) {
      console.error('Error retrieving scanned products:', error);
      return [];
    }
  }

  /**
   * Get a specific scanned product by barcode
   */
  async getScannedProduct(barcode: string): Promise<ScannedProduct | null> {
    try {
      const products = await this.getScannedProducts();
      return products.find((p) => p.barcode === barcode) || null;
    } catch (error) {
      console.error('Error retrieving scanned product:', error);
      return null;
    }
  }

  /**
   * Cache nutrition data for offline access
   */
  async cacheNutritionData(
    barcode: string,
    nutritionData: NutritionData
  ): Promise<void> {
    try {
      const cachedData = await this.getCachedNutritionData();
      cachedData[barcode] = {
        ...nutritionData,
        timestamp: new Date(),
      };

      // Clean up old cached data
      const expiryTime =
        Date.now() - environment.appConfig.cacheExpiryHours * 60 * 60 * 1000;
      Object.keys(cachedData).forEach((key) => {
        if (cachedData[key].timestamp.getTime() < expiryTime) {
          delete cachedData[key];
        }
      });

      localStorage.setItem(
        this.STORAGE_KEYS.CACHED_NUTRITION_DATA,
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.error('Error caching nutrition data:', error);
    }
  }

  /**
   * Get cached nutrition data
   */
  async getCachedNutritionData(): Promise<Record<string, NutritionData>> {
    try {
      const data = localStorage.getItem(
        this.STORAGE_KEYS.CACHED_NUTRITION_DATA
      );
      if (!data) return {};

      const cachedData = JSON.parse(data) as Record<string, NutritionData>;
      const result: Record<string, NutritionData> = {};

      Object.keys(cachedData).forEach((key) => {
        result[key] = {
          ...cachedData[key],
          timestamp: new Date(cachedData[key].timestamp),
        };
      });

      return result;
    } catch (error) {
      console.error('Error retrieving cached nutrition data:', error);
      return {};
    }
  }

  /**
   * Store grading criteria
   */
  async saveGradingCriteria(criteria: GradingCriteria): Promise<void> {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.GRADING_CRITERIA,
        JSON.stringify(criteria)
      );
    } catch (error) {
      console.error('Error saving grading criteria:', error);
      throw new Error('Failed to save grading criteria');
    }
  }

  /**
   * Get stored grading criteria
   */
  async getGradingCriteria(): Promise<GradingCriteria | null> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.GRADING_CRITERIA);
      if (!data) return null;

      const criteria = JSON.parse(data) as GradingCriteria;
      return {
        ...criteria,
        lastUpdated: new Date(criteria.lastUpdated),
      };
    } catch (error) {
      console.error('Error retrieving grading criteria:', error);
      return null;
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: any): Promise<void> {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<any> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error retrieving user preferences:', error);
      return {};
    }
  }

  /**
   * Clear all stored data
   */
  async clearAllData(): Promise<void> {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear stored data');
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { totalSize: number; itemCount: number } {
    try {
      let totalSize = 0;
      let itemCount = 0;

      Object.values(this.STORAGE_KEYS).forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          itemCount++;
        }
      });

      return { totalSize, itemCount };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalSize: 0, itemCount: 0 };
    }
  }
}
