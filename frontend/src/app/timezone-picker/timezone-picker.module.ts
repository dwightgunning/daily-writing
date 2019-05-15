import { TimezonePickerService } from './timezone-picker.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimezonePickerComponent } from './timezone-picker.component';
import { TimezonePickerPipe } from './timezone-picker.pipe';


@NgModule({
  imports: [CommonModule],
  declarations: [TimezonePickerComponent, TimezonePickerPipe],
  providers: [TimezonePickerService],
  exports: [TimezonePickerComponent, TimezonePickerPipe]
})
export class TimezonePickerModule {}
