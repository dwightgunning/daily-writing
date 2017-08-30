from django.conf.urls import include, url
from rest_framework_jwt.views import obtain_jwt_token

from users.views import DailyWordsProfileView

urlpatterns = [
    url(r'^profile/$', DailyWordsProfileView.as_view(), name='profile'),
]
