import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ApiError } from '../models/api-error';
import { InviteAcceptance } from '../models/invite-acceptance';
import { InviteService } from '../services/invite.service';

@Component({
  selector: 'app-invite-acceptance-form',
  templateUrl: './invite-acceptance-form.component.html',
  styleUrls: ['./invite-acceptance-form.component.scss']
})
export class InviteAcceptanceFormComponent {
  USERNAME_MIN_LENGTH = 3; // Should match backend settings
  PASSWORD_MIN_LENGTH = 9; // Should match backend settings

  inviteAcceptanceFormGroup = new FormGroup({
    username: new FormControl('',
      [
        Validators.required,
        Validators.minLength(this.USERNAME_MIN_LENGTH)
      ]
    ),
    password: new FormControl('',
      [
        Validators.required,
        Validators.minLength(this.PASSWORD_MIN_LENGTH)
      ]
    )
  });
  @Input() token: string;
  submitted = false;
  apiErrors: any;
  @Output() inviteAccepted: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private inviteService: InviteService) { }

  onSubmit() {
    this.submitted = true;
    this.apiErrors = null;
    const inviteAcceptance = new InviteAcceptance(this.inviteAcceptanceFormGroup.value);
    this.inviteService.acceptInvite(this.token, inviteAcceptance).subscribe(
      (result) => {
        this.submitted = false;
        if (result instanceof ApiError) {
          this.apiErrors = result;
        } else {
          this.inviteAccepted.emit();
        }
      });
  }
}
