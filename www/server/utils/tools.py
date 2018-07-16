# -*- coding: utf-8 -*-
import os
import re
import time
from netaddr import IPAddress
from netaddr import IPNetwork
from netaddr import IPRange

from Jhin.jhin import Jhin
from network.network import get_all_interfaces_info
from utils.decrypt import encrypt
from threading import Thread

from utils.log import log
from utils.netaddr_tools import is_subnet_include
jhin = Jhin()
logname = "server.log"
logger = log(logname)
logging = logger.logger


def strbin(ip):
    """
    ip 转换为 32位的 二进制字符串
    :param ip:
    :return:
    """
    subnet_str = ''
    for x in ip.split("."):
        str_bin = str(bin(int(x)))[2:]  # startwith 0b
        subnet_str += (8 - len(str_bin)) * '0' + str_bin
    return subnet_str


def check_subnet_rep(subnet):
    """
    检测是否有包含的ip网段关系
    ["192.168.1.1/255.255.255.0","192.168.2.1/255.255.255.0"]
    :param subnet:
    :return:
    """
    len_subnet = len(subnet)
    for i in range(0, len_subnet-1):
        net, mask = subnet[i].split('/')
        mask_c = sum([bin(int(x)).count("1") for x in mask.split(".")])
        net_m_i = '%s/%s' % (net, mask_c)
        for j in range(i+1, len_subnet):  # (int j = i + 1;j < n.length;j++){
            net_j, mask_j = subnet[j].split('/')
            mask_j = sum([bin(int(x)).count("1") for x in mask_j.split(".")])
            net_m_j = '%s/%s' % (net_j, mask_j)
            if IPNetwork(net_m_i) in IPNetwork(net_m_j) or IPNetwork(net_m_j) in IPNetwork(net_m_i):
                return True, '%s  %s' %(net_m_i, net_m_j)
    return False, None


def ip_range_include(ips):
    """
    检测传入的ip范围是否有包含关系
    :param mask: 掩码
    :param ips: [{start:192.168.1.1,end:192.168.1.100},{start:192.168.1.1,end:192.168.1.100}]
    :return:
    """
    len_subnet = len(ips)
    for i in range(0, len_subnet - 1):
        start_i = ips[i].get('start')
        end_i = ips[i].get('end')
        ipsi = IPRange(start_i, end_i)
        for j in range(i + 1, len_subnet):  # (int j = i + 1;j < n.length;j++){
            start_j = ips[j].get('start')
            end_j = ips[j].get('end')
            ipsj = IPRange(start_j, end_j)
            if len(list(set(ipsi).intersection(set(ipsj)))):
                return True, '%s-%s  %s-%s' %(start_i, end_i, start_j, end_j)
    return False, None


def ip_in_nets(ip, net, mask):
    mask_c = sum([bin(int(x)).count("1") for x in mask.split(".")])
    return IPAddress(ip) in IPNetwork('%s/%s'%(net, mask_c))


def get_pppoe_dns(ethx):
    # jhin = Jhin()
    jhin.load_whisper('ppp-dns', '/tmp')
    gateway = ''
    ip = ''
    mask = ''
    dns = jhin.get('dns-%s' % ethx) if jhin.get('dns-%s' % ethx) else ''
    all_interface = get_all_interfaces_info()
    if 'ppp-%s' % ethx in all_interface.keys():
        ip = all_interface['ppp-%s' % ethx]['ip']
        mask = all_interface['ppp-%s' % ethx]['mask']
        try:
            gateway = all_interface['ppp-%s' % ethx]['gateway']
        except:
            gateway = ''
    return gateway, dns, ip, mask


def get_dhcp_info(ethx):
    # jhin = Jhin()
    jhin.load_whisper('dhcp-info', '/tmp')
    gateway = jhin.get('gateway-%s' % ethx) if jhin.get('gateway-%s' % ethx) else ''
    dns = (jhin.get('dns-%s' % ethx) if jhin.get('dns-%s' % ethx) else '').replace(',', ' ')
    ip = jhin.get('ip-%s' % ethx) if jhin.get('ip-%s' % ethx) else ''
    mask = jhin.get('netmask-%s' % ethx) if jhin.get('netmask-%s' % ethx) else ''
    return ip, gateway, dns, mask


def get_ppp_time(eth_name):
    def str2time(str_time):
        h = str_time / 3600
        min = str_time % 3600 / 60
        s = str_time % 3600 % 60
        return '%s时%s分%s秒' % (h, min, s)

    # jhin = Jhin()
    jhin.load_whisper('ppp-time', '/tmp')
    ppp_time = int(jhin.get('ppp-%s' % eth_name)) if jhin.get('ppp-%s' % eth_name) else ''
    if ppp_time:
        now_time = time.time()
        return str2time(int(now_time - ppp_time))
    else:
        return ''


def flow_change(flow):
    flow = float(flow)
    if flow < 1024:
        flow_str = '%sB/s' % flow
    elif flow > 1024 * 1024:
        flow_str = '%sM/s' % float('%.1f' % (float(flow) / (1024 * 1024)))
    else:
        flow_str = '%sK/s' % float('%.1f' % (float(flow) / 1024))
    return flow_str


def set_pwd(pwd):
    """
    密码修改
    :param pwd:
    :return:
    """
    pwd = encrypt(pwd)
    os.popen('echo admin:%s >/etc/web_user' % pwd)
    return True


def init_conf(mode):
    set_pwd('admin')
    # 恢复出厂配置
    os.popen('cp /etc/config/default/*  /etc/config')
    if mode == 'bridge':
        os.popen('cp /etc/config/default/network.bridge.json /etc/config/network.json')
        os.popen('cp /etc/config/default/dhcpd.bridge.json /etc/config/dhcpd.json')
    elif mode == 'bypass':
        os.popen('cp /etc/config/default/network.bypass.json /etc/config/network.json')
        os.popen('cp /etc/config/default/dhcpd.bypass.json /etc/config/dhcpd.json')
    else:
        os.popen('cp /etc/config/default/network.gateway.json /etc/config/network.json')
        os.popen('cp /etc/config/default/dhcpd.gateway.json /etc/config/dhcpd.json')
    os.popen(
        'rm  /etc/config/network.gateway.json  /etc/config/dhcpd.gateway.json  '
             '/etc/config/network.bridge.json  /etc/config/dhcpd.bridge.json '
             '/etc/config/network.bypass.json  /etc/config/dhcpd.bypass.json')
    os.popen("sed -i s/listen.*$/'listen 80;'/g /usr/local/openresty/nginx/conf/vhost/web_server.conf")
    return


class TimeoutException(Exception):
    pass

ThreadStop = Thread._Thread__stop


# 超时装饰器
def timelimited(timeout):
    def decorator(function):
        def decorator2(*args, **kwargs):
            class TimeLimited(Thread):
                def __init__(self,_error= None,):
                    Thread.__init__(self)
                    self._error = _error

                def run(self):
                    try:
                        self.result = function(*args,**kwargs)
                    except Exception, e:
                        self._error = e

                def _stop(self):
                    if self.isAlive():
                        ThreadStop(self)
            t = TimeLimited()
            t.start()
            t.join(timeout)
            if isinstance(t._error, TimeoutException):
                t._stop()
                raise TimeoutException('%s(s) timeout for %s' % (timeout, repr(function)))
            if t.isAlive():
                t._stop()
                raise TimeoutException('%s(s) timeout for %s' % (timeout, repr(function)))
            if t._error is None:
                return t.result
        return decorator2
    return decorator


# 根据三层交换机ip查询查询下面的连接的终端列表
def gam_status(switch_ip):
    gam_status_dir = '/tmp/gam/sta_status/ip_mac/'
    status_list = os.listdir(gam_status_dir)
    gams = []
    for item_file in status_list:
        if not item_file.endswith('.info'):
            continue
        gam_key = item_file.split('_')[0]  # 10.18.75.25_1.info
        if gam_key != switch_ip:
            continue
        file_gam_status = open('%s%s' % (gam_status_dir, item_file), 'r')
        gams += file_gam_status.readlines()
        file_gam_status.close()
    item_gams_list = []
    for item in gams:
        item = str(item).strip('\n')
        if item:
            v_ip, v_mac = str(item).split('=')
            item_gams_list.append({'ip': v_ip, 'mac': v_mac})
        else:
            continue
    return item_gams_list


def dhcp2dhcpd(conf):
    pools = conf.get('pools')
    dhcpd = ""
    def get_bind_ip(hosts_conf, routers, mask):
        """
        for dhcp to dchpd son func
        :param hosts_conf:
        :param routers:
        :param mask:
        :return:
        """
        can_bind_list = ""
        if not hosts_conf or not routers or not mask:
            return can_bind_list
        for item in hosts_conf:
            if ip_in_nets(item.get('ip'), routers, mask):
                can_bind_list += "  host %s {\n    hardware ethernet %s;\n    fixed-address %s;\n  }\n" \
                                 % (item.get('name'), item.get('mac'), item.get('ip'))
        return can_bind_list
    for item in pools:
        can_bind_ip = get_bind_ip(conf.get('hosts'), item.get('subnet'), item.get('netmask'))
        ip_network = IPNetwork('%s/%s' %(item.get('subnet'), item.get('netmask'))).network
        dhcpd += 'subnet %s netmask %s{\n' % (ip_network, item.get('netmask'))
        dhcpd += '  max-lease-time %s;\n' % (int(item.get('lease_time'))*60)
        dhcpd += '  option subnet-mask %s;\n' % (item.get('netmask'))
        dhcpd += '  option routers %s;\n' % (item.get('routers'))
        dhcpd += '  option domain-name-servers %s' % (item.get('dns1'))
        if item.get('dns2'):
            dhcpd += ',%s' % item.get('dns2')
        dhcpd += ';\n'
        if item.get('ranges'):
            for item_range in item.get('ranges'):
                dhcpd += '  range %s %s;\n' % (item_range.get('start'), item_range.get('end'))
        if can_bind_ip:
            dhcpd += can_bind_ip
        dhcpd += "}\n"
    file_object = open('/etc/dhcpd.conf', 'w')
    file_object.write(dhcpd)
    file_object.close()


def factory_reset(mode):
    # 恢复出厂配置
    # jhin = Jhin()
    # jhin.load_whisper("network")
    # mode = jhin.get("mode")
    init_conf(mode)
    # set_pwd('admin')
    os.popen('cp /etc/config/default/web_user /etc/')
    # 恢复dhcp配置
    # jhin = Jhin()
    jhin.load_whisper("dhcpd")
    dhcpd_conf = jhin.get_all()
    dhcp2dhcpd(dhcpd_conf)
    #  删除记录文件


def is_subnetin_lan(subnet):
    """
    判断是否网段被lan口使用了,或者将包含lan口的网段
    :param subnet: '192.168.1.1/255.255.255.0'
    :return:bool, True存在包含关系
    """
    # jhin = Jhin()
    jhin.load_whisper('network')
    bridges = jhin.get('bridges')
    for item in bridges:
        if is_subnet_include('%s/%s' % (item.get('ip'), item.get('mask')), subnet):
            return True
    return False


def get_network_mode():
    jhin.load_whisper('network')
    mode = str(jhin.get("mode"))
    return mode


def change_br_to_value(mode, br_name):
    num = int(re.findall("\d+", br_name)[-1])
    if str(br_name).startswith('vbr'):
        ret = 'VLAN%s' %num
    elif mode == 'gateway':
        ret = 'LAN%s' % (num+1)
    elif mode == 'bridge':
        ret = '网桥%s' % (num+1)
    else:
        ret = '监控口%s' % (num+1)
    return ret


def change_wan_to_value(mode, br_name):
    num = int(re.findall("\d+", br_name)[-1])
    ret = br_name
    if mode == 'bypass':
        if str(br_name) == 'eth0':
            ret = '上网口'
        elif str(br_name) == 'eth1':
            ret = '管理口'
        else:
            ret = br_name
    elif mode == 'gateway':
        ret = 'wan%s' % (num+1)
    return ret

########################################### 检测网口被使用情况 ######################################

def check_br_used(br_list):
    """
    检测使用了br_list中口的配置,br_list将要配置下去的配置的口
    :param br_list: [br0,br1,vbr10]
    :return:
    """
    from config.object_used import NetworkUsed
    network_used = NetworkUsed()
    be_deled = network_used.deled_brs(br_list)
    auth_used = network_used.check_br_used_by_auth(be_deled)
    out_ctrl_used = network_used.check_br_used_by_out_ctrl(be_deled)
    mode = get_network_mode()
    msg = ''
    if auth_used:
        for item in auth_used:
            msg += '%s ' % change_br_to_value(mode, item)
        msg += '被 >上网认证>认证网络 使用<br />'
    if out_ctrl_used:
        for item in out_ctrl_used:
            msg += '%s ' % change_br_to_value(mode, item)
        msg += '被 >网络安全>外网访问列表 使用<br />'
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg


def check_wan_used(wan_list):
    """
    检测使用了wan_list中的wan口的配置
    :param wan_list: [eth0,eht1]
    :return:
    """
    from config.object_used import NetworkUsed
    network_used = NetworkUsed()
    dmz_used = network_used.check_wans_used_by_dmz(wan_list)
    msg = ''
    mode = get_network_mode()
    if dmz_used:
        for item in dmz_used:
            msg += '%s ' % change_wan_to_value(mode, item)
        msg += '被 >网络配置>网络服务>端口映射 使用<br />'
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg


###################################### 检测对象被使用情况 ######################################

def check_time_obj_used(time_list):
    """
    根据将要配置下去的时间对象名列表，计算出将要被删除的时间对象，从而判断删除的时间对象有没有被使用
    :param time_list:
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('time_class')
    deled_times = obj.deled_objs(time_list)
    msg = ''
    if not deled_times:
        return True, msg
    acl_used = obj.check_time_used_by_acl(deled_times)
    if acl_used:
        msg = '时间对象:%s 被 >网络安全>acl访问控制列表>ACL访问 使用<br />' % (','.join(str(i) for i in acl_used))
        logging.info(msg)
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg


def check_ip_obj_used(ip_list):
    """
    根据将要配置下去的ip对象名列表，计算出将要被删除的ip对象，从而判断删除的ip对象有没有被使用
    :param ip_list:
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('ip_class')
    deleds = obj.deled_objs(ip_list)
    msg = ''
    if not deleds:
        return True, msg
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('ip', deleds)
    # todo 有其它对象使用的时候在ObjectUsed要加上相应的检测模块
    if out_ctrl_used:
        msg = 'ip对象:%s 被 >网络安全>外网访问控制列表>外网访问控制 使用<br />' % (','.join(str(i) for i in out_ctrl_used))
        logging.info(msg)
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg


def check_mac_obj_used(mac_list):
    """
    根据将要配置下去的ip对象名列表，计算出将要被删除的ip对象，从而判断删除的ip对象有没有被使用
    :param ip_list:
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('mac_class')
    deleds = obj.deled_objs(mac_list)
    msg = ''
    if not deleds:
        return True, msg
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('mac', deleds)
    if out_ctrl_used:
        msg = 'mac对象:%s 被 >网络安全>外网访问控制列表>外网访问控制 使用<br />' % (','.join(str(i) for i in out_ctrl_used))
        logging.info(msg)
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg


def check_domain_obj_used(domain_list):
    """
    根据将要配置下去的域名对象名列表，计算出将要被删除的域名对象，从而判断删除的域名对象有没有被使用
    :param ip_list:
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('domain_class')
    deleds = obj.deled_objs(domain_list)
    msg = ''
    if not deleds:
        return True, msg
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('domain', deleds)
    if out_ctrl_used:
        msg = '外网域名对象:%s 被 >网络安全>外网访问控制列表>外网访问控制 使用<br />' % (','.join(str(i) for i in out_ctrl_used))
        logging.info(msg)
    if msg:
        return False, msg + '请先往相应菜单项删除使用关系!'
    else:
        return True, msg

# todo 有使用自定义对象的时候补充这个函数
def check_app_obj_used(app_list):
    msg = ''
    return True, msg


###################################根据对象的修改判断是否要重启相应的服务#############################


def __cmp_times(used ,news ,obj, conf_old):
    new_dict = dict()
    old_dict = dict()
    for item in news:
        name = item.get('name')
        if name in used:
            new_dict[name] = item
    for item in conf_old:
        name = item.get('name')
        if name in used:
            old_dict[name] = item
    for item in new_dict.keys():
        if not obj.cmp_obj(new_dict.get(item), old_dict.get(item)):
            return False
    return True


def time_obj_restart_service(conf, key_list, conf_old):
    """
    检测传入的时间配置是否改变了对应的对象值，需要重启服务
    :param conf:
    :param key_list: 配置对象的名字集合
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('time_class')
    times = conf.get('time')
    acl_used = obj.check_time_used_by_acl(key_list)  # 获取交集，也就是计算出被acl使用的时间对象
    if not __cmp_times(acl_used, times, obj, conf_old):
        logging.info('acl 引用的时间对象值改变，将进行重启acl服务')
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua acl').read()
    return


def ip_obj_restart_service(conf, key_list, conf_old):
    """
    检测传入的ip配置是否改变了对应的对象值，需要重启服务
    :param conf:
    :param key_list: 配置对象的名字集合
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('ip_class')
    ips = conf.get('ip')
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('ip', key_list)
    if not __cmp_times(out_ctrl_used, ips, obj, conf_old):
        logging.info('out_ctrl 引用的ip对象值改变，将进行重启out_ctrl服务')
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua out_ctrl').read()
    return


def mac_obj_restart_service(conf, key_list, conf_old):
    """
    检测传入的时间配置是否改变了对应的对象值，需要重启服务
    :param conf:
    :param key_list: 配置对象的名字集合
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('mac_class')
    macs = conf.get('mac')
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('mac', key_list)
    if not __cmp_times(out_ctrl_used, macs, obj, conf_old):
        logging.info('out_ctrl 引用的mac对象值改变，将进行重启out_ctrl服务')
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua out_ctrl').read()
    return


def domain_obj_restart_service(conf, key_list, conf_old):
    """
    检测传入的时间配置是否改变了对应的对象值，需要重启服务
    :param conf:
    :param key_list: 配置对象的名字集合
    :return:
    """
    from config.object_used import ObjectUsed
    obj = ObjectUsed()
    obj.load_whisper('domain_class')
    domains = conf.get('domain')
    out_ctrl_used = obj.check_objs_used_by_out_ctrl('mac', key_list)
    if not __cmp_times(out_ctrl_used, domains, obj, conf_old):
        logging.info('out_ctrl 引用的域名对象值改变，将进行重启out_ctrl服务')
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua out_ctrl').read()
    return


def app_obj_restart_service(conf, key_list, conf_old):
    """
    检测传入的app配置是否改变了对应的对象值，需要重启服务
    :param conf:
    :param key_list: 配置对象的名字集合
    :return:
    """
    # from config.object_used import ObjectUsed
    # obj = ObjectUsed()
    # obj.load_whisper('app_class')
    # apps = conf.get('app')
    pass
    return



