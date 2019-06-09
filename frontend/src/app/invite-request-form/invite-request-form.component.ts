import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ViewChild } from '@angular/core';

import { ApiError } from '../models/api-error';
import { InviteService } from '../services/invite.service';
import { InviteRequest } from '../models/invite-request';

@Component({
  selector: 'app-invite-request-form',
  templateUrl: './invite-request-form.component.html',
  styleUrls: ['./invite-request-form.component.scss']
})
export class InviteRequestFormComponent {
  @ViewChild('inviteRequestForm') requestInviteForm: any;
  inviteRequestFormGroup = new FormGroup({
    email: new FormControl('',
      [
        Validators.required
      ]
    ),
  });
  @Input() token: string;
  submitted = false;
  apiErrors: any;
  @Output() inviteRequested: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private inviteService: InviteService) { }

  onSubmit() {
    this.submitted = true;
    this.apiErrors = null;
    const inviteRequest = new InviteRequest(this.inviteRequestFormGroup.value);
    this.inviteService.createInviteRequest(inviteRequest).subscribe(
      (result) => {
        this.submitted = false;
        if (result instanceof ApiError) {
          this.apiErrors = result;
        } else {
          this.inviteRequested.emit();
        }
      });
  }
}
