from django.conf.urls import url

from config.views import req_conf, set_conf, test, unbind_inter, reload_auth, auth_list, kick_auth, get_part_conf, \
    switch_mode, switch_lanwan, get_lanwan_sta

urlpatterns = [
    url(r'^get_conf/$', req_conf),
    url(r'^set_conf/$', set_conf),
    url(r'^reload_auth/$', reload_auth),
    url(r'^unbind_inter/$', unbind_inter),
    url(r'^auth_list/$', auth_list),
    url(r'^kick_auth/$', kick_auth),
    url(r'^get_part_conf/$', get_part_conf),
    url(r'^switch_mode/$', switch_mode),
    url(r'^switch_lanwan/$', switch_lanwan),
    url(r'^lanwan_status/$', get_lanwan_sta),
    url(r'^test/$', test),
]