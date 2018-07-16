import re

from Jhin.jhin import Jhin


def netmask_to_cidr(netmask):
    return sum([bin(int(x)).count("1") for x in netmask.split(".")])


def get_network_address(ip_addr, mask):
    return '.'.join([str(int(x) & int(y)) for x, y in zip(ip_addr.split('.'), mask.split('.'))])

import os


def force_restart():
    # del /tmp
    # del uwsgi
    os.popen2("sleep 1;ps x|grep monitor| grep -v grep| awk '{print $1}' |xargs kill -9;"
              "wait;killall -9 uwsgi;killall -9 udhcpc; killall -9 pppd")
    os.popen2("sleep 3;rm /tmp/ppp* /tmp/dhcp-info.json")
    os.popen2('sleep 35; echo 1 > /proc/sys/kernel/sysrq; echo b > /proc/sysrq-trigger')
    # os.popen2('sleep 1; echo 1 > /proc/sys/kernel/sysrq; sync; echo b > /proc/sysrq-trigger')
    # os.popen2('sleep 1; systemctl reboot')



def get_config_cache(filename):
    jhin = Jhin()
    jhin.load_whisper(filename)
    return jhin.get_all() if jhin.get_all() else None


def create_conf_cach():
    conf = {}
    web_conf_info = os.popen("sed -n '/listen.*$/p' /usr/local/openresty/nginx/conf/vhost/web_server.conf").read()
    httport = re.findall(r'(\w*[0-9]+)\w*',web_conf_info)
    conf['webport'] = httport[0] if len(httport) else 80

    confs = ['auth', 'network', 'snmp_ipmac','audit', 'lic']
    for item in confs:
        item_conf = get_config_cache(item)
        if item_conf:
            if item == 'snmp_ipmac':
                conf['snmp'] = item_conf.get('snmp', [])
            else:
                conf[item] = item_conf
    sync = Jhin()
    sync.load_whisper('sync')
    sync.add_all(conf)
    sync.curtain_call()
