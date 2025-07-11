import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import {
  BarcodeScannerService,
  BarcodeScanResult,
} from '../../services/barcode-scanner.service';
import { NutritionApiService } from '../../services/nutrition-api.service';
import { ProductGradingService } from '../../services/product-grading.service';
import { StorageService } from '../../services/storage.service';
import {
  NutritionData,
  ProductGrade,
  ScannedProduct,
} from '../../models/nutrition-data.model';

@Component({
  selector: 'app-product-scanner',
  templateUrl: './product-scanner.page.html',
  styleUrls: ['./product-scanner.page.scss'],
})
export class ProductScannerPage implements OnInit {
  public isLoading = false;
  public currentProduct: ScannedProduct | null = null;
  public scanHistory: ScannedProduct[] = [];
  public selectedAgeGroup = '6-12months';
  public isScanningAvailable = false;

  constructor(
    private barcodeScannerService: BarcodeScannerService,
    private nutritionApiService: NutritionApiService,
    private productGradingService: ProductGradingService,
    private storageService: StorageService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.initializePage();
  }

  /**
   * Initialize the page
   */
  private async initializePage() {
    try {
      this.isScanningAvailable =
        this.barcodeScannerService.isScanningAvailable();
      await this.loadScanHistory();
    } catch (error) {
      console.error('Error initializing page:', error);
      await this.showError('Failed to initialize scanner');
    }
  }

  /**
   * Load scan history from storage
   */
  private async loadScanHistory() {
    try {
      this.scanHistory = await this.storageService.getScannedProducts();
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  }

  /**
   * Start the barcode scanning process
   */
  async scanBarcode() {
    if (!this.isScanningAvailable) {
      await this.showError('Barcode scanning is not available on this device');
      return;
    }

    this.isLoading = true;
    const loading = await this.showLoading('Scanning barcode...');

    try {
      // Step 1: Scan barcode
      const scanResult = await this.barcodeScannerService.scanBarcode();

      if (scanResult.cancelled) {
        await this.hideLoading(loading);
        this.isLoading = false;
        return;
      }

      if (!this.barcodeScannerService.validateBarcode(scanResult.barcode)) {
        await this.hideLoading(loading);
        this.isLoading = false;
        await this.showError('Invalid barcode format. Please try again.');
        return;
      }

      // Step 2: Get nutrition data
      await this.updateLoadingMessage(loading, 'Retrieving nutrition data...');
      const nutritionData =
        await this.nutritionApiService.getNutritionDataByBarcode(
          scanResult.barcode
        );

      // Step 3: Grade the product
      await this.updateLoadingMessage(loading, 'Analyzing nutrition...');
      const grade = await this.productGradingService.gradeProduct(
        nutritionData,
        this.selectedAgeGroup
      );

      // Step 4: Create scanned product
      const scannedProduct: ScannedProduct = {
        barcode: scanResult.barcode,
        nutritionData,
        grade,
        scanDate: new Date(),
        isFavorite: false,
      };

      // Step 5: Save to storage
      await this.storageService.saveScannedProduct(scannedProduct);

      // Step 6: Update UI
      this.currentProduct = scannedProduct;
      await this.loadScanHistory();

      await this.hideLoading(loading);
      this.isLoading = false;

      await this.showSuccess('Product scanned successfully!');
    } catch (error) {
      console.error('Error scanning product:', error);
      await this.hideLoading(loading);
      this.isLoading = false;
      await this.showError(
        error instanceof Error ? error.message : 'Failed to scan product'
      );
    }
  }

  /**
   * Toggle favorite status of a product
   */
  async toggleFavorite(product: ScannedProduct) {
    try {
      product.isFavorite = !product.isFavorite;
      await this.storageService.saveScannedProduct(product);
      await this.loadScanHistory();

      const message = product.isFavorite
        ? 'Added to favorites'
        : 'Removed from favorites';
      await this.showSuccess(message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showError('Failed to update favorite status');
    }
  }

  /**
   * View detailed information for a product
   */
  async viewProductDetails(product: ScannedProduct) {
    this.currentProduct = product;
  }

  /**
   * Clear current product view
   */
  clearCurrentProduct() {
    this.currentProduct = null;
  }

  /**
   * Change age group for grading
   */
  async changeAgeGroup() {
    const alert = await this.alertController.create({
      header: 'Select Age Group',
      inputs: [
        {
          name: 'ageGroup',
          type: 'radio',
          label: '0-6 months',
          value: '0-6months',
          checked: this.selectedAgeGroup === '0-6months',
        },
        {
          name: 'ageGroup',
          type: 'radio',
          label: '6-12 months',
          value: '6-12months',
          checked: this.selectedAgeGroup === '6-12months',
        },
        {
          name: 'ageGroup',
          type: 'radio',
          label: '12-24 months',
          value: '12-24months',
          checked: this.selectedAgeGroup === '12-24months',
        },
        {
          name: 'ageGroup',
          type: 'radio',
          label: '2-5 years',
          value: '2-5years',
          checked: this.selectedAgeGroup === '2-5years',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: (data) => {
            if (data) {
              this.selectedAgeGroup = data;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Show loading indicator
   */
  private async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent',
    });
    await loading.present();
    return loading;
  }

  /**
   * Hide loading indicator
   */
  private async hideLoading(loading: HTMLIonLoadingElement) {
    await loading.dismiss();
  }

  /**
   * Update loading message
   */
  private async updateLoadingMessage(
    loading: HTMLIonLoadingElement,
    message: string
  ) {
    loading.message = message;
  }

  /**
   * Show success toast
   */
  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  /**
   * Get grade color for UI
   */
  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A':
        return 'success';
      case 'B':
        return 'primary';
      case 'C':
        return 'warning';
      case 'D':
        return 'danger';
      case 'F':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Get severity color for highlights
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'primary';
      default:
        return 'medium';
    }
  }

  /**
   * Get scanning instructions
   */
  getScanningInstructions(): string {
    return this.barcodeScannerService.getScanningInstructions();
  }

  /**
   * Get highlight icon based on category
   */
  getHighlightIcon(category: string): string {
    switch (category) {
      case 'sugar':
        return 'nutrition-outline';
      case 'sodium':
        return 'warning-outline';
      case 'fat':
        return 'alert-circle-outline';
      case 'artificial':
        return 'close-circle-outline';
      case 'allergens':
        return 'medical-outline';
      case 'nutrition':
        return 'information-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }
}
