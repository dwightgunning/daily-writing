export class UserTokens {
  username: string;
  access: string;
  refresh: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
