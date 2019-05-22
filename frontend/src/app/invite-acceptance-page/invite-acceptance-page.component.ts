import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiError } from '../models/api-error';
import { InviteService } from '../services/invite.service';

export enum TokenCheckStates {
  NotStarted,
  InProgress,
  Complete,
  Error
}

@Component({
  selector: 'app-invite-acceptance-page',
  templateUrl: './invite-acceptance-page.component.html',
  styleUrls: ['./invite-acceptance-page.component.scss']
})
export class InviteAcceptancePageComponent implements OnInit {
  TokenCheckStates: typeof TokenCheckStates = TokenCheckStates;
  token: string;
  tokenCheckState = TokenCheckStates.NotStarted;
  errors: ApiError;
  inviteAccepted: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private inviteService: InviteService
    ) { }

  ngOnInit() {
    this.token = this.activatedRoute.snapshot.paramMap.get('token');
    this.tokenCheckState = TokenCheckStates.InProgress;
    this.inviteService.checkInviteTokenIsValid(this.token).subscribe((result) => {
      if (result instanceof ApiError) {
        this.tokenCheckState = TokenCheckStates.Error;
        this.errors = result;
      } else {
        this.tokenCheckState = TokenCheckStates.Complete;
      }
    });
  }

  onInviteAccepted() {
    this.inviteAccepted = true;
  }
}
