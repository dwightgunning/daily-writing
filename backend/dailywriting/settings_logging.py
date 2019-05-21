# Django built-in loggers: django, django.request,
#                          django.db.backends, django.security.*
from django.conf import settings

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "root": {"level": "WARNING", "handlers": ["console", "sentry"]},
    "formatters": {
        "verbose": {
            "format": "[%(name)s - %(asctime)s %(levelname)s %(module)s "
            "%(process)d %(thread)d] %(message)s"
        },
        "simple": {"format": "[%(asctime)s: %(levelname)s] %(message)s"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "sentry": {
            "level": "WARNING",
            "class": "raven.contrib.django.raven_compat.handlers.SentryHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "api": {"handlers": ["sentry"], "level": "WARNING"},
        "dailywriting": {"handlers": ["sentry"], "level": "WARNING"},
        "entries": {"handlers": ["sentry"], "level": "WARNING"},
        "users": {"handlers": ["sentry"], "level": "WARNING"},
        #  Django framework logging
        "django.db.backends": {
            "handlers": ["sentry"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["sentry"],
            "level": "WARNING",
            "propagate": False,
        },
        "django": {"handlers": ["sentry"], "level": "WARNING"},
        "django.db": {"handlers": ["sentry"], "level": "WARNING"},
        #  Ops related logging
        "raven": {"level": "DEBUG", "handlers": ["sentry"], "propagate": False},
        "sentry.errors": {"level": "DEBUG", "handlers": ["sentry"], "propagate": False},
        #  Test related logging
        "selenium.webdriver.remote.remote_connection": {
            "level": "WARNING",
            "handlers": [],
            "propagate": False,
        },
        "sentry.errors": {
            "level": "DEBUG",
            "handlers": ["console", "sentry"],
            "propagate": False,
        },
    },
}

if settings.DEBUG:
    LOGGING["loggers"]["selenium.webdriver.remote.remote_connection"] = {
        "level": "WARNING",
        "handlers": ["console"],
        "propagate": False,
    }
    # make all loggers use the console.
    LOGGING["handlers"]["console"] = {
        "level": "DEBUG",
        "class": "logging.StreamHandler",
        "formatter": "verbose",
    }
    for logger in LOGGING["loggers"]:
        LOGGING["loggers"][logger]["handlers"] = ["console"]
        LOGGING["loggers"][logger]["propagate"] = False
        LOGGING["loggers"][logger]["level"] = "INFO"
