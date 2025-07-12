import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScanResult } from '../../services/barcode-scanner.service';

@Component({
  selector: 'app-barcode-scanner-modal',
  templateUrl: './barcode-scanner-modal.component.html',
  styleUrls: ['./barcode-scanner-modal.component.scss'],
})
export class BarcodeScannerModalComponent implements OnInit, OnDestroy {
  public isScanning = false;
  public errorMessage = '';
  public scanningInstructions = 'Point your camera at the product barcode';

  constructor(private modalController: ModalController) {}

  async ngOnInit() {
    await this.startScanning();
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  /**
   * Start the barcode scanning process
   */
  async startScanning() {
    try {
      this.isScanning = true;
      this.errorMessage = '';

      // Check if MLKit barcode scanning is available
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        throw new Error(
          'MLKit barcode scanning is not supported on this device'
        );
      }

      // Request camera permissions
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted') {
        throw new Error(
          'Camera permission denied. Please enable camera access in settings.'
        );
      }

      // Start scanning
      await BarcodeScanner.startScan();

      // Listen for scan results
      BarcodeScanner.addListener('barcodesScanned', (result) => {
        this.handleScanResult(result);
      });
    } catch (error) {
      console.error('Error starting barcode scan:', error);
      this.errorMessage =
        error instanceof Error ? error.message : 'Failed to start scanning';
      this.isScanning = false;
    }
  }

  /**
   * Handle scan results
   */
  private handleScanResult(result: {
    barcodes: Array<{ rawValue: string; format: string }>;
  }) {
    try {
      if (result && result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0];
        const scanResult: BarcodeScanResult = {
          barcode: barcode.rawValue,
          format: barcode.format,
          cancelled: false,
        };

        this.dismiss(scanResult);
      }
    } catch (error) {
      console.error('Error handling scan result:', error);
      this.errorMessage = 'Error processing scan result';
    }
  }

  /**
   * Stop scanning
   */
  async stopScanning() {
    try {
      await BarcodeScanner.stopScan();
      BarcodeScanner.removeAllListeners();
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }

  /**
   * Dismiss the modal with result
   */
  dismiss(result?: BarcodeScanResult) {
    this.stopScanning();
    this.modalController.dismiss(result);
  }

  /**
   * Cancel scanning
   */
  cancel() {
    const cancelledResult: BarcodeScanResult = {
      barcode: '',
      format: '',
      cancelled: true,
    };
    this.dismiss(cancelledResult);
  }

  /**
   * Retry scanning
   */
  async retry() {
    this.errorMessage = '';
    await this.startScanning();
  }
}
