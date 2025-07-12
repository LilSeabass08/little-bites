// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  appName: 'Little Bites',
  appVersion: '1.0.0',

  // FatSecret API Configuration
  nutritionApi: {
    baseUrl: 'https://platform.fatsecret.com/rest/server.api',
    clientId: 'f28cb6e8959f49aebe907601c64b8272',
    clientSecret: 'f4f9f8818a784721a2e009d69848e9ec',
    timeout: 15000,
  },

  // Internal Database API (for comparison criteria)
  internalApi: {
    baseUrl: 'https://your-internal-api.com/api',
    timeout: 8000,
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
    enableOfflineMode: false,
    enableCrashReporting: false,
  },

  // App Configuration
  appConfig: {
    maxCachedProducts: 50,
    cacheExpiryHours: 24,
    maxScanHistory: 100,
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
