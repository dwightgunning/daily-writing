export class ApiError {
  errors?: Array<any>|object;
  nonFieldErrors?: Array<any>;

  constructor(errors: object) {
    Object.assign(this, errors);
  }
}
