import datetime
import os

import dj_database_url

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "raven.contrib.django.raven_compat",
    "rest_framework",
    "timezone_field",
    "api.apps.ApiConfig",
    "entries.apps.EntriesConfig",
    "users.apps.UsersConfig",
]

MIDDLEWARE = [
    "raven.contrib.django.raven_compat.middleware.Sentry404CatchMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "dailywriting.urls"

WSGI_APPLICATION = "dailywriting.wsgi.application"

# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth."
        "password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth." "password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth." "password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth." "password_validation.NumericPasswordValidator"},
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

STATIC_ROOT = os.path.join(BASE_DIR, "django-staticfiles")
STATIC_URL = "/static/"

WHITENOISE_INDEX_FILE = True
WHITENOISE_ROOT = os.path.join(BASE_DIR, "ng-dist")

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
        "DIRS": (WHITENOISE_ROOT,),  # For dailywriting.urls catch all mapping
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# Django Rest Framework

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_jwt.authentication.JSONWebTokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "DEFAULT_PARSER_CLASSES": (
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
    ),
    "PAGE_SIZE": 10,
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    "TEST_REQUEST_RENDERER_CLASSES": (
        "rest_framework.renderers.MultiPartRenderer",
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.TemplateHTMLRenderer",
    ),
}

JWT_AUTH = {"JWT_EXPIRATION_DELTA": datetime.timedelta(days=7)}

# Environment specific settings

try:
    from dailywriting.settings_local import *  # NOQA
except:
    import raven  # NOQA

    print("No settings_local.py available.")
    ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")
    DATABASES = {"default": dj_database_url.config(default=os.environ["DATABASE_URL"])}
    DEBUG = os.environ["DEBUG"] == "True"
    EMAIL_BACKEND = os.environ["EMAIL_BACKEND"]
    RAVEN_CONFIG = {
        "dsn": os.environ["SENTRY_DSN"],
        "release": os.environ["SOURCE_VERSION"],
    }
    SECRET_KEY = os.environ["SECRET_KEY"]

try:
    from dailywriting.settings_logging import *  # NOQA
except:
    print("Error loading logging configuration")
    raise
