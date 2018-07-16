from django.conf.urls import url, include
from base.views import login, logout, req_set_pwd, rw_dev_info, over_view, get_snmp, set_snmp, upload_soft, reboot, \
    reset_conf, cpu_status, cli_status, get_logs, set_webport, get_webport

urlpatterns = [
    url(r'^apis/diagnosis/', include('diagnosis.urls')),
    url(r'^apis/conf/', include('config.urls')),
    url(r'^apis/login/', login),
    url(r'^apis/logout/', logout),
    url(r'^apis/set_pwd/', req_set_pwd),
    url(r'^apis/rw_dev_info/', rw_dev_info),
    url(r'^apis/get_snmp/', get_snmp),
    url(r'^apis/set_snmp/', set_snmp),
    url(r'^apis/upload/', upload_soft),
    url(r'^apis/reboot/', reboot),
    url(r'^apis/reset_conf/', reset_conf),
    url(r'^apis/over_view/', over_view),
    url(r'^apis/cpu_status/', cpu_status),
    url(r'^apis/cli_status/', cli_status),
    url(r'^apis/get_logs/', get_logs),
    url(r'^apis/set_webport/', set_webport),
    url(r'^apis/get_webport/', get_webport),
    url(r'^apis/log/', include('log_center.urls')),
]
