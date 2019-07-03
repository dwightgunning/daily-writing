import { AfterViewInit, Component, Input, OnDestroy  } from '@angular/core';

import 'foundation-sites';
import * as $ from 'jquery';
import { Observable } from 'rxjs';

import { Entry } from '../../models/entry';
import { EntryServiceActionState } from '../../services/entry.service';

@Component({
  selector: 'app-entry-drawer',
  templateUrl: './entry-drawer.component.html',
  styleUrls: ['./entry-drawer.component.scss']
})
export class EntryDrawerComponent implements AfterViewInit, OnDestroy {
  EntryServiceActionState: typeof EntryServiceActionState = EntryServiceActionState;

  entryMetaAccordion: FoundationSites.Accordion;
  @Input() entryObs: Observable<Entry>;
  @Input() updateEntryStateObs: Observable<EntryServiceActionState>;

  constructor() { }

  ngAfterViewInit() {
    this.entryMetaAccordion = new Foundation.Accordion($('#entry-drawer'), {allowAllClosed: true});
  }

  ngOnDestroy() {
    this.entryMetaAccordion.destroy();
  }
}
