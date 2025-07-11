export const environment = {
  production: true,
  appName: 'Little Bites',
  appVersion: '1.0.0',

  // External Nutrition API Configuration
  nutritionApi: {
    baseUrl: 'https://api.nutritionix.com/v2',
    appId: 'PRODUCTION_NUTRITION_API_APP_ID',
    appKey: 'PRODUCTION_NUTRITION_API_APP_KEY',
    timeout: 15000,
  },

  // Internal Database API (for comparison criteria)
  internalApi: {
    baseUrl: 'https://your-production-internal-api.com/api',
    timeout: 10000,
  },

  // Storage Keys
  storageKeys: {
    SCANNED_PRODUCTS: 'scanned_products',
    USER_PREFERENCES: 'user_preferences',
    CACHED_NUTRITION_DATA: 'cached_nutrition_data',
    GRADING_CRITERIA: 'grading_criteria',
  },

  // Feature Flags
  features: {
    enableCaching: true,
    enableOfflineMode: true,
    enableCrashReporting: true,
  },

  // App Configuration
  appConfig: {
    maxCachedProducts: 100,
    cacheExpiryHours: 48,
    maxScanHistory: 200,
  },
};
