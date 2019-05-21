from django.conf.urls import include, url
from django.urls import path
from django.contrib import admin
from django.views.generic import TemplateView

urlpatterns = [
    path("api/", include("entries.urls")),
    path("api/", include("users.urls")),
    path("admin/", admin.site.urls),
    # Whitenoise cannot serve a static index for the website root root URL.
    # See also settings.TEMPLATES
    path("", TemplateView.as_view(template_name="index.html")),
]
