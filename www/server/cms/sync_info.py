# coding=utf-8
import os
import re

from os.path import dirname, abspath
import sys
try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')
from django import setup

setup()


from utils.decrypt import decstr
from utils.log import log
from utils.rabbitmq import DevRabbitMq
from base.settings import BASE_DIR
logname = "cmslog"
logger = log(logname)
logging = logger.logger
def sync_info(dev_rabbit):
    """
    同步设备信息
    :return:
    """
    cms_addr = os.popen("cat %s/log/cms_addr" % BASE_DIR).read()[:-1]
    if cms_addr:
        dev_sn = str(os.popen('cat /etc/SerialNumber').read())[0:-1]
        dev_model = str(os.popen('cat /etc/product').read())[0:-1]
        if dev_sn and dev_model:
            queue = '%s|%s' % (dev_sn, dev_model)
            wan_info = {}
            user_info = {}
            wan1={}  # 以后多wan口的时候这个要改
            wan1["macaddr"] = str(os.popen('cat /sys/class/net/eth0/address').read())[0:-1]  # p4p1这个真实设备要改为eth0
            wan1["ipaddr"] = str(os.popen('sudo lsap --wan_ip').read())[0:-1]
            wan1["proto"] = "static"
            web_conf_info = os.popen("sed -n '/listen.*$/p' /usr/local/openresty/nginx/conf/vhost/web_server.conf").read()
            httport = re.findall(r'(\w*[0-9]+)\w*',web_conf_info)
            wan1["http_port"] = httport[0] if len(httport) else 80
            wan_info["wan1"] = wan1
            user_info["username"] = "admin"
            users = os.popen('cat /etc/web_user').read()[:-1]
            if users:
                pwd = users.split(':')[1]
                pwd = decstr(pwd)
                user_info["password"] = pwd
            msg = {"event": "data_sync", "user":user_info, "wan": wan_info}
            properties = {"reply_to": queue}
            data = {"event": "data_sync","data": msg, "dev_sn": dev_sn}
            dev_rabbit.send_msg('', "data_sync", data, properties)
            logging.info('send data_sync %s '% msg)
    else:
        logging.info('sync fail cms_addr is null')

def sync_info_api():
    addr = (os.popen("cat %s/log/cms_addr" % BASE_DIR).read())[0:-1]
    if addr:
        try:
            dev_rabbit = DevRabbitMq(addr, "test")
            sync_info(dev_rabbit)
        except Exception as e:
            logging.error('sync error is %s' % e.message)
if __name__ == '__main__':
    sync_info_api()