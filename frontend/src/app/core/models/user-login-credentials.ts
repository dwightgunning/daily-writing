export class UserLoginCredentials {
  username?: string;
  password?: string;
  token?: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
