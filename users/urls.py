from django.conf.urls import include, url
from rest_framework_jwt.views import obtain_jwt_token

from users.views import DailyWritingProfileView

urlpatterns = [
    url(r'^profile/$', DailyWritingProfileView.as_view(), name='profile'),
]
