import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BarcodeScannerModalComponent } from './barcode-scanner-modal.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [BarcodeScannerModalComponent],
  exports: [BarcodeScannerModalComponent],
})
export class BarcodeScannerModalModule {}
