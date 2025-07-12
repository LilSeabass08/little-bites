import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { ProductScannerPageRoutingModule } from './product-scanner-routing.module';
import { ProductScannerPage } from './product-scanner.page';
import { BarcodeScannerModalModule } from '../../components/barcode-scanner-modal/barcode-scanner-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule,
    ProductScannerPageRoutingModule,
    BarcodeScannerModalModule,
  ],
  declarations: [ProductScannerPage],
})
export class ProductScannerPageModule {}
