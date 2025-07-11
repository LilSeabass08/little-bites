import { Injectable } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScannerModalComponent } from '../components/barcode-scanner-modal/barcode-scanner-modal.component';

export interface BarcodeScanResult {
  barcode: string;
  format: string;
  cancelled: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BarcodeScannerService {
  private isNativePlatform: boolean;

  constructor(
    private platform: Platform,
    private modalController: ModalController
  ) {
    this.isNativePlatform = this.platform.is('capacitor');
  }

  /**
   * Scan a barcode using native camera or web fallback
   */
  async scanBarcode(): Promise<BarcodeScanResult> {
    try {
      if (this.isNativePlatform) {
        return await this.scanWithNativeCamera();
      } else {
        return await this.scanWithWebFallback();
      }
    } catch (error) {
      console.error('Barcode scanning failed:', error);
      return {
        barcode: '',
        format: '',
        cancelled: true,
        error: 'Failed to scan barcode',
      };
    }
  }

  /**
   * Native camera barcode scanning using MLKit
   */
  private async scanWithNativeCamera(): Promise<BarcodeScanResult> {
    try {
      // Check if MLKit barcode scanning is available
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        throw new Error(
          'MLKit barcode scanning is not supported on this device'
        );
      }

      // Open the barcode scanner modal
      const modal = await this.modalController.create({
        component: BarcodeScannerModalComponent,
        componentProps: {},
        backdropDismiss: false,
        showBackdrop: false,
        cssClass: 'barcode-scanner-modal',
      });

      await modal.present();

      // Wait for the modal to dismiss with result
      const { data } = await modal.onWillDismiss();

      if (data) {
        return data as BarcodeScanResult;
      } else {
        return {
          barcode: '',
          format: '',
          cancelled: true,
        };
      }
    } catch (error) {
      console.error('Native barcode scanning failed:', error);
      return {
        barcode: '',
        format: '',
        cancelled: true,
        error:
          error instanceof Error ? error.message : 'Native scanning failed',
      };
    }
  }

  /**
   * Web fallback for barcode scanning
   */
  private async scanWithWebFallback(): Promise<BarcodeScanResult> {
    try {
      // For web, we could use a JavaScript-based barcode scanner
      // or provide a manual input option
      return await this.provideManualInput();
    } catch (error) {
      console.error('Web barcode scanning failed:', error);
      return {
        barcode: '',
        format: '',
        cancelled: true,
        error: 'Web scanning not available',
      };
    }
  }

  /**
   * Provide manual barcode input for web platform
   */
  private async provideManualInput(): Promise<BarcodeScanResult> {
    return new Promise((resolve) => {
      const barcode = prompt('Please enter the product barcode:');

      if (barcode && barcode.trim()) {
        resolve({
          barcode: barcode.trim(),
          format: 'MANUAL',
          cancelled: false,
        });
      } else {
        resolve({
          barcode: '',
          format: '',
          cancelled: true,
        });
      }
    });
  }

  /**
   * Simulate native scanning delay
   */
  private async simulateNativeScan(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000); // Simulate 2-second scan time
    });
  }

  /**
   * Validate barcode format
   */
  validateBarcode(barcode: string): boolean {
    if (!barcode || barcode.length < 8) {
      return false;
    }

    // Basic validation for common barcode formats
    const numericBarcode = barcode.replace(/\D/g, '');

    // EAN-13 validation
    if (numericBarcode.length === 13) {
      return this.validateEAN13(numericBarcode);
    }

    // UPC-A validation
    if (numericBarcode.length === 12) {
      return this.validateUPCA(numericBarcode);
    }

    // EAN-8 validation
    if (numericBarcode.length === 8) {
      return this.validateEAN8(numericBarcode);
    }

    return false;
  }

  /**
   * Validate EAN-13 barcode
   */
  private validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13) return false;

    const digits = barcode.split('').map(Number);
    const checkDigit = digits[12];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate UPC-A barcode
   */
  private validateUPCA(barcode: string): boolean {
    if (barcode.length !== 12) return false;

    const digits = barcode.split('').map(Number);
    const checkDigit = digits[11];

    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate EAN-8 barcode
   */
  private validateEAN8(barcode: string): boolean {
    if (barcode.length !== 8) return false;

    const digits = barcode.split('').map(Number);
    const checkDigit = digits[7];

    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Check if barcode scanning is available
   */
  isScanningAvailable(): boolean {
    return this.isNativePlatform || environment.features.enableOfflineMode;
  }

  /**
   * Get platform-specific scanning instructions
   */
  getScanningInstructions(): string {
    if (this.isNativePlatform) {
      return 'Point your camera at the product barcode to scan it automatically.';
    } else {
      return 'Enter the product barcode manually or use a barcode scanner app.';
    }
  }
}
