import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';

import { finalize } from 'rxjs/operators';

import { InviteRequestService } from '../services/invite-request.service';
import { InviteRequest } from '../models/invite-request';

@Component({
  selector: 'app-invite-request-form',
  templateUrl: './invite-request-form.component.html',
  styleUrls: ['./invite-request-form.component.scss']
})
export class InviteRequestFormComponent {
  @ViewChild('inviteRequestForm') requestInviteForm: any;
  submitting = false;
  success = false;
  error: any;
  model = new InviteRequest();

  constructor(private inviteRequestService: InviteRequestService) { }

  inviteRequestFormSubmit() {
    this.submitting = true;
    this.inviteRequestService.createInviteRequest(this.model)
    .pipe(
      finalize(() => this.submitting = false),
    ).subscribe(
      (next: null) => this.confirmSubmission(),
      (error) => {
        this.error = 'An error occurred. Please try again.';
      });
  }

  confirmSubmission() {
    this.success = true;
    ((component) => {
      setTimeout(() => {
        component.success = false;
      }, 3000);
    })(this);
  }
}
