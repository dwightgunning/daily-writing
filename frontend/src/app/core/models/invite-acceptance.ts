export class InviteAcceptance {
  username: string;
  password: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
