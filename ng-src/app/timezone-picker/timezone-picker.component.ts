import { TimezonePickerService, Timezone } from './timezone-picker.service';
import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  ElementRef,
  EventEmitter,
  forwardRef,
  OnInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as moment from 'moment-timezone';
import * as $ from 'jquery';
import 'select2';

@Component({
  selector: 'app-timezone-picker',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TimezonePickerComponent),
    multi: true
  }],
  template: `
  <select #select id="select" style="width: 100%" class="form-control" [disabled]="disabled">
    <option></option>
    <ng-template let-c ngFor [ngForOf]="allTimezones">
      <optgroup *ngIf="c.zones.length > 1" [label]="c.iso | iso2CountryPipe">
        <option *ngFor="let t of c.zones" [value]="t">{{c.iso | iso2CountryPipe}} - {{formatTimezoneString(t)}}
            <span *ngIf="showOffset">{{offsetOfTimezone(t)}}</span>
        </option>
      </optgroup>
        <option *ngIf="c.zones.length === 1" [value]="c.zones[0]">{{c.iso | iso2CountryPipe}}
          <span *ngIf="showOffset">{{offsetOfTimezone(c.zones[0])}}</span>
      </option>
    </ng-template>
  </select>`
})
export class TimezonePickerComponent implements OnInit, AfterViewInit, ControlValueAccessor {

  /**
   * Contructor function to define all the timezones
   */
  constructor(public service: TimezonePickerService) {
    this.allTimezones = service.getZones();
  }
  /**
   * all time zones combined in one array, for each country
   */
  allTimezones: Timezone[];
  /**
   * ElementRef for the select element
   */
  @ViewChild('select') select: ElementRef;
  nativeSelectElement;

  /**
   * Input (optional) bound to [disabled]
   */
  @Input() disabled = false;

  placeholderString = 'Select timezone';

  /**
   * The current selected timezone.
   */
  currentTimezone: string;
  /**
   * onChange event handler
   */
  onChange: any = () => { };

  ngOnInit() {
    this.nativeSelectElement = $(this.select.nativeElement).select2({
      placeholder: this.placeholderString,
      matcher: (term, text) => this.matcher(term, text)
    });
  }

  /**
   * $ bounding of select2 framework in the selectElement
   */
  ngAfterViewInit() {
    this.nativeSelectElement.on('change', (e: any) => {
        this.onChange($(e.target).val());
    });
    console.log('afterViewInit is done');
  }

  formatTimezoneString(zone: string): string {
    const arr = zone.split('/');
    return arr[arr.length - 1].replace('_', ' ');
  }

  offsetOfTimezone(zone: string): string {
    let offset = moment.tz(zone).utcOffset();
    const neg = offset < 0;
    if (neg) {
      offset = -1 * offset;
    }
    const hours = Math.floor(offset / 60);
    const minutes = (offset / 60 - hours) * 60;
    return `(GMT${neg ? '-' : '+'}${this.rjust(
      hours.toString(),
      2
    )}:${this.rjust(minutes.toString(), 2)})`;
  }

  writeValue(value) {
    this.currentTimezone = value;
    if (this.nativeSelectElement && value) {
      console.log(value);
      this.nativeSelectElement
        .val(this.currentTimezone)
        .trigger('change.select2');
    }
  }
  registerOnChange(fn) { this.onChange = fn;  }
  registerOnTouched(fn) {  }

  /**
   * Matcher function to search in the select options
   * @param params contains the search term
   * @param data contains the data of each row
   */
  private matcher(params, data) {
    // Always return the object if there is nothing to compare
    if ($.trim(params.term) === '') {
      return data;
    }

    let original = data.text.toUpperCase();
    const term = params.term.toUpperCase();

    // Replace '_' with ' ' to be able to search for 'New York'
    if (original.indexOf('_') !== -1) {
      original += original.replace('_', ' ');
    }

    // Check if the text contains the term
    if (original.indexOf(term) > -1) {
      return data;
    }

    // Do a recursive check for options with children
    if (data.children && data.children.length > 0) {
      // Clone the data object if there are children
      // This is required as we modify the object to remove any non-matches
      const match = $.extend(true, {}, data);
      // Check each child of the option
      for (let c = data.children.length - 1; c >= 0; c--) {
        const child = data.children[c];
        const matches = this.matcher(params, child);
        // If there wasn't a match, remove the object in the array
        if (matches == null) {
          match.children.splice(c, 1);
        }
      }
      // If any children matched, return the new object
      if (match.children.length > 0) {
        return match;
      }
      // If there were no matching children, check just the plain object
      return this.matcher(params, match);
    }
    // If it doesn't contain the term, don't return anything
    return null;
  }

  private rjust(inputString: string, width: number, padding = '0'): string {
    padding = padding || ' ';
    padding = padding.substr(0, 1);
    if (inputString.length < width) {
      return padding.repeat(width - inputString.length) + inputString;
    } else {
      return inputString;
    }
  }
}
