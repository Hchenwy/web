from django.conf.urls import url

from diagnosis.views import diag

urlpatterns = [
    url(r'^diag/$', diag),
]