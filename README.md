# Daily Writing

This project is a working application for daily writing.

The main technologies used to build the app are:
- [Angular.io](https://angular.io/) ([TypeScript](https://www.typescriptlang.org))
- [SASS](http://sass-lang.com/)
- [Foundation for Sites](https://foundation.zurb.com/sites.html)
- [Django](https://djangoproject.com)
- [Django REST framework](http://www.django-rest-framework.org/).

## Project setup

1. Install the frontend dependencies with Yarn:

```(bash)
yarn
```

2. Install the backend API dependencies with Pip:

```(bash)
pipenv install
```

3. Create the database:

```(bash)
python manage.py migrate
```

4. Create a superuser account:

```(bash)
python manage.py createsuperuser
```

5. Run the frontend development server:

```(bash)
ng serve
```

Then navigate to `http://localhost:4200/`.

6. Run the backend API development server:

```(bash)
python manage.py runserver
```

Now navigate to `http://localhost:8000/api/`.

## Development

### Angular.io - Frontend Development with Angular CLI

This frontend for this project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.2.7.

The frontend developer tooling and experience is consistent with the Angular CLI, with the following adjustments:
 - Linting

#### Linting

To lint both TypeScript and SASS, run `npm run lint`.

#### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

### Django - Backend API Development

The backend API for this project is built upon the [Django Framework](https://www.djangoproject.com).

The backed developer tooling and experience is consistent with the Django Framework, with the following adjustments:
 - Linting

#### Linting

To lint Python, run `black`.

#### Further help

To get more help on the Django Framework use `python manage.py help`, go check out the [Django Framework Documentation] and the [Django REST framework API guide](http://www.django-rest-framework.org/#api-guide).

## Copyright and License Information

Copyright (c) 2017-2019 Dwight Gunning, and individual contributors. All rights reserved.

See the file "LICENSE" for information on the history of this software, terms & conditions for usage, and a DISCLAIMER OF ALL WARRANTIES.
