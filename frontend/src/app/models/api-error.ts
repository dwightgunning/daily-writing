export class ApiError {
  /*
  DRF backend typically sends errors in a json object with a single root-level
  attribute named 'errors'.

  Example #1
  {
    errors: [
      'Not found.'
    ]
  }

  Example #2
  {
    errors: {
      username: [
        'This username already exists.'
      ],
      password: [
        'Too short.',
        'Too simple.'
      ],
      nonFieldErrors: [
        'Passwords did not match.'
      ]
    }
  }
  */
  errors?: Array<any>|object;

  constructor(errorObj: object) {
    Object.assign(this, errorObj);
  }
}
