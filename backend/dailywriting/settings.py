import datetime
import os

import dj_database_url

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sites",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "raven.contrib.django.raven_compat",
    "rest_framework",
    "rest_framework.authtoken",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "rest_auth",
    "rest_auth.registration",
    "timezone_field",
    "api.apps.ApiConfig",
    "entries.apps.EntriesConfig",
    "users.apps.UsersConfig",
]

MIDDLEWARE = [
    "raven.contrib.django.raven_compat.middleware.Sentry404CatchMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",  #  Must be after Session Middleware
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
WHITENOISE_ROOT = os.path.join(BASE_DIR, "frontend", "dist")

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

AUTH_USER_MODEL = "users.User"

JWT_AUTH = {"JWT_EXPIRATION_DELTA": datetime.timedelta(days=7)}

# django-rest-auth
REST_USE_JWT = True

# django-allauth
ACCOUNT_ADAPTER = "users.account_adapters.DailyWritingAccountAdapter"
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 7
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = True
ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE = False
ACCOUNT_USERNAME_REQUIRED = True

# Environment specific settings
try:
    from dailywriting.settings_local import *  # NOQA
except:
    import raven  # NOQA

    print("No settings_local.py available.")
    ADMINS = [(os.environ["ADMIN_NAME"], os.environ["ADMIN_EMAIL"])]
    API_BASE_URL = os.environ["API_BASE_URL"]
    SITE_BASE_URL = os.environ["SITE_BASE_URL"]
    ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")
    DATABASES = {"default": dj_database_url.config(default=os.environ["DATABASE_URL"])}
    DEBUG = os.environ["DEBUG"] == "True"
    DEFAULT_FROM_EMAIL = os.environ["DEFAULT_FROM_EMAIL"]
    EMAIL_BACKEND = os.environ["EMAIL_BACKEND"]
    RAVEN_CONFIG = {
        "dsn": os.environ["SENTRY_DSN"],
        "release": os.environ["SOURCE_VERSION"],
    }
    SECRET_KEY = os.environ["SECRET_KEY"]
    SECURE_SSL_REDIRECT = os.environ["SECURE_SSL_REDIRECT"] == "True"
    SESSION_COOKIE_SECURE = os.environ["SESSION_COOKIE_SECURE"] == "True"
    CSRF_COOKIE_SECURE = os.environ["CSRF_COOKIE_SECURE"] == "True"
    SENDGRID_API_KEY = os.environ["SENDGRID_API_KEY"]
    if SECURE_SSL_REDIRECT:
        SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
try:
    from dailywriting.settings_logging import *  # NOQA
except:
    print("Error loading logging configuration")
    raise
