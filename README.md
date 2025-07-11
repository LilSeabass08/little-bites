# Little Bites - Baby Food Nutrition Scanner

A modern, cross-platform mobile application built with Ionic, Angular, and Capacitor that helps parents make informed decisions about baby food nutrition by scanning product barcodes and providing A-F grades based on age-appropriate nutritional guidelines.

## 🎯 Features

- **Barcode Scanning**: Scan product barcodes using native camera or manual input
- **Nutrition Analysis**: Retrieve detailed nutrition data from external APIs
- **Smart Grading**: A-F grading system based on age-appropriate nutritional criteria
- **Detailed Insights**: Highlight nutritional concerns and provide recommendations
- **Scan History**: Track previously scanned products with favorites support
- **Age Group Support**: Tailored nutrition guidelines for different age groups (0-6 months, 6-12 months, 12-24 months, 2-5 years)
- **Offline Support**: Cache nutrition data for offline access
- **Modern UI**: Clean, intuitive interface optimized for mobile devices

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Ionic 8 + Angular 20 + TypeScript
- **Mobile**: Capacitor 7 for native functionality
- **Styling**: SCSS with modern design principles
- **State Management**: Service-based architecture with local storage
- **API Integration**: External nutrition database with caching

### Project Structure

```
src/
├── app/
│   ├── models/                    # Data models and interfaces
│   │   ├── nutrition-data.model.ts
│   │   └── grading-criteria.model.ts
│   ├── pages/
│   │   └── product-scanner/       # Main scanner page
│   │       ├── product-scanner.page.ts
│   │       ├── product-scanner.page.html
│   │       ├── product-scanner.page.scss
│   │       ├── product-scanner.module.ts
│   │       └── product-scanner-routing.module.ts
│   ├── services/                  # Core business logic
│   │   ├── barcode-scanner.service.ts
│   │   ├── nutrition-api.service.ts
│   │   ├── product-grading.service.ts
│   │   └── storage.service.ts
│   └── tabs/                      # Navigation tabs
├── environments/                   # Environment configuration
│   ├── environment.ts
│   └── environment.prod.ts
└── theme/                         # Global styling
```

### Core Services

#### BarcodeScannerService

- Handles native barcode scanning with web fallback
- Validates barcode formats (EAN-13, UPC-A, EAN-8)
- Provides platform-specific scanning instructions

#### NutritionApiService

- Integrates with external nutrition database
- Implements caching for offline access
- Handles API errors and retry logic
- Transforms API responses to internal format

#### ProductGradingService

- Analyzes nutrition data against age-appropriate criteria
- Calculates A-F grades with detailed scoring
- Generates nutritional highlights and recommendations
- Supports multiple age groups and categories

#### StorageService

- Centralized data persistence
- Manages scan history, favorites, and cached data
- Implements data cleanup and storage optimization
- Provides storage statistics and management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd little-bites
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   - Copy `src/environments/environment.ts` and update with your API credentials
   - Set up your nutrition API keys (e.g., Nutritionix API)

4. **Run the application**

   ```bash
   # Web development
   ionic serve

   # Android development
   ionic capacitor add android
   ionic capacitor run android

   # iOS development (macOS only)
   ionic capacitor add ios
   ionic capacitor run ios
   ```

### Environment Configuration

Update `src/environments/environment.ts` with your API credentials:

```typescript
export const environment = {
  production: false,
  nutritionApi: {
    baseUrl: "https://api.nutritionix.com/v2",
    appId: "YOUR_NUTRITION_API_APP_ID",
    appKey: "YOUR_NUTRITION_API_APP_KEY",
    timeout: 10000,
  },
  // ... other configuration
};
```

## 📱 Usage

### Scanning Products

1. Open the app and navigate to the Scanner tab
2. Select the appropriate age group for your child
3. Tap "Scan Barcode" to start scanning
4. Point the camera at the product barcode or enter manually
5. View the nutrition grade and detailed analysis

### Understanding Grades

- **A (90-100)**: Excellent choice, meets all guidelines
- **B (80-89)**: Good choice with minor concerns
- **C (70-79)**: Moderate nutritional value
- **D (60-69)**: Not recommended for regular consumption
- **F (0-59)**: Not suitable for babies

### Features

- **Favorites**: Tap the heart icon to save products
- **History**: View recently scanned products
- **Age Groups**: Switch between different age ranges for appropriate guidelines
- **Detailed Analysis**: View nutrition facts, ingredients, allergens, and recommendations

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run e2e
```

### Mock Services

The app includes mock services for testing without external dependencies:

- `BarcodeScannerService` with simulated scanning
- `NutritionApiService` with cached responses
- `ProductGradingService` with default criteria

## 🔧 Development

### Code Style

- Follow Angular and Ionic best practices
- Use TypeScript strict mode
- Implement proper error handling
- Write comprehensive unit tests
- Follow the established naming conventions

### Adding Features

1. Create new services in `src/app/services/`
2. Add models in `src/app/models/`
3. Create pages in `src/app/pages/`
4. Update routing in `src/app/app-routing.module.ts`
5. Add tests for new functionality

### Building for Production

```bash
# Build for web
ionic build --prod

# Build for Android
ionic capacitor build android --prod

# Build for iOS
ionic capacitor build ios --prod
```

## 📊 Performance Optimization

- **Lazy Loading**: All pages are lazy-loaded for faster initial load
- **Caching**: Nutrition data is cached for offline access
- **Image Optimization**: Icons and assets are optimized
- **Memory Management**: Proper cleanup of resources
- **Storage Limits**: Configurable limits for cached data

## 🔒 Security

- API keys are stored in environment files
- No sensitive data is logged
- Input validation on all user inputs
- Secure storage for cached data
- HTTPS enforcement for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🔄 Version History

- **v1.0.0**: Initial release with core scanning and grading functionality
- Future versions will include additional features and improvements

---

Built with ❤️ for parents who want the best nutrition for their little ones.
