# coding=utf-8
from django.conf.urls import url

from log_center.log_views import user_log, sys_log

urlpatterns = [
    url(r'^user_log/$', user_log),
    url(r'^sys_log/$', sys_log),
]
