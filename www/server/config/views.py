# -*- coding: utf-8 -*-
import json
import os
import re
import time
import datetime
import operator
from itertools import islice

from copy import deepcopy
from django.http import JsonResponse
from Jhin.jhin import Jhin
from cms.sync_info import sync_info_api
from config.check_conf import check_auth, check_snmp, check_network, check_webport, check_dhcp, check_security
from config.ipsec_conf import convert_ipsec2conf
from log_center.operate_log import write_operate_log
from network.entities.ifinfo import get_all_normal_interfaces
from network.network import get_interfaces_not_on_bridge, get_all_interfaces_info, start_bridge_netfilter, \
    stop_bridge_netfilter
from utils.log import log
from utils.tools import get_pppoe_dns, get_dhcp_info, dhcp2dhcpd, factory_reset, get_network_mode, check_wan_used, \
    check_ip_obj_used, check_domain_obj_used, check_mac_obj_used, check_time_obj_used, check_app_obj_used, \
    time_obj_restart_service, app_obj_restart_service, mac_obj_restart_service, domain_obj_restart_service, \
    ip_obj_restart_service

logname = "server.log"
logger = log(logname)
logging = logger.logger
jhin = Jhin()

def sync_conf(key, value):
    sync = Jhin()
    sync.load_whisper('sync')
    sync.add(key, value)
    sync.curtain_call()


def save_conf(conf_name, conf):
    logging.info('(config) save conf_name: %s conf: %s' % (conf_name, conf))
    # jhin = Jhin()
    jhin.load_whisper(conf_name)
    jhin.add_all(conf)
    jhin.curtain_call()
    sync_conf(conf_name, conf)


def get_bridges():
    # jhin = Jhin()
    jhin.load_whisper("network")
    conf = jhin.get("bridges") if jhin.get("bridges") else {}
    bridges = []
    mode = get_network_mode()
    for item in conf:
        if item.get('vlan_switch') == '1':
            for item_x in item.get('vlan'):
                if type(item_x) is dict:
                    br_info = {}
                    br_info['name'] = 'vbr' + str(item_x.get('vlan_id'))
                    br_info['ip'] = item_x.get('ip')
                    br_info['mask'] = item_x.get('mask')
                    br_info['value'] = 'VLAN' + str(item_x.get('vlan_id'))
                    bridges.append(br_info)
                else:
                    pass
        else:
            br_info = {}
            br_info['name'] = item.get('name')
            br_info['ip'] = item.get('ip')
            br_info['mask'] = item.get('mask')
            num = int(re.findall("\d+", item.get('name'))[-1]) + 1
            if mode == 'gateway':
                br_info['value'] = 'LAN%s' % num
            elif mode == 'bridge':
                br_info['value'] = '网桥%s' % num
            else:
                br_info['value'] = '监控口%s' % num
            bridges.append(br_info)
    return bridges


def get_conf_confs(conf_name, conf):
    # jhin = Jhin()
    jhin.load_whisper(conf_name)
    conf = jhin.get(conf)
    return conf


def get_auth_enable():
    enable = str(get_conf_confs("auth", "enable"))
    return enable


def get_internals(conf):
    internals = []
    bridges = conf.get('bridges')
    if bridges:
        for item in bridges:
            internals.append(item.get('name'))
        conf['internal'] = internals
    return conf


def interfaces2routers(conf):
    """
    将WAN口gateway配置项转为routers
    :param conf:
    :return:
    """
    interfaces = conf.get('interfaces')
    if not interfaces:
        return conf
    routes = get_conf_confs('network', 'routes')  # conf.get('routes')
    interfaces_routers = []
    for item in interfaces:
        if item.get('proto') == 'static' and item.get('gateway'):
            interfaces_routers.append(
                {'ip':'0.0.0.0',
                'mask': '0.0.0.0',
                 'next_route':item.get('gateway'),
                 'name': item.get('name')
                 })
    routes_cp = []
    for item in routes:
        if not item.has_key('name'):
            routes_cp.append(item)
    routes_cp += interfaces_routers
    conf['routes'] = routes_cp
    return conf


def deal_single_conf(conf_name, conf):
    """
    处理单个配置项修改
    :param conf:
    :return:
    """
    # jhin = Jhin()
    jhin.load_whisper(conf_name)
    logging.info('(config) deal_single_conf save conf_name: %s conf: %s' % (conf_name, conf))
    for item in conf.keys():
        jhin.add(item, conf.get(item))
    jhin.curtain_call()
    sync_conf(conf_name, jhin.get_all())
    return


def deal_audit_conf(conf_name, conf):
    """
    审计配置修改
    :param conf:
    :return:
    """
    deal_single_conf(conf_name, conf)
    if "enable" in conf.keys():
        enable = int(conf.get('enable', 1))
        if enable == 1:
            logging.info('(config) install-gam start')
            os.popen2('install-gam start')
        else:
            logging.info('(config) install-gam stop')
            os.popen2('install-gam stop')
    return


def check_conf(conf):
    logging.info('(config) conf begin check conf')
    if "auth" in conf.keys():
        ret, msg = check_auth(conf.get('auth'))
        if not ret:
            logging.error('(config) auth conf check error:%s' % msg)
            return ret, msg
    if "snmp" in conf.keys():
        ret, msg = check_snmp(conf.get('snmp'))
        if not ret:
            logging.error('(config) snmp conf check error:%s' % msg)
            return ret, msg
    if 'network' in conf.keys():
        ret, msg = check_network(conf.get('network'))
        if not ret:
            logging.error('(config) network conf check error:%s' % msg)
            return ret, msg
    if 'webport' in conf.keys():
        ret, msg = check_webport(conf.get('webport'))
        if not ret:
            logging.error('(config) webport conf check error:%s' % msg)
            return ret, msg
    if 'dhcpd' in conf.keys():
        now_mode = get_network_mode()
        ret, msg = check_dhcp(conf.get('dhcpd'), now_mode)
        if not ret:
            logging.error('(config) dhcp conf check error:%s' % msg)
            return ret, msg
    if 'security' in conf.keys():
        ret, msg = check_security(conf.get('security'))
        if not ret:
            logging.error('(config) security conf check error:%s' % msg)
            return ret, msg
    logging.info('(config) conf check success')
    return True, 'success'


def deal_change_brige(network):
    """
    network修改，判断是否对认证网络的interface有影响
    :param network:
    :return:
    """
    bridges_conf = network.get("bridges")
    if bridges_conf is None:
        return True
    bridges = []
    for item in bridges_conf:
        if item.get('vlan_switch') == '1':
            for item_x in item.get('vlan'):
                if type(item_x) is dict:
                    bridges.append('vbr' + str(item_x.get('vlan_id')))
                else:
                    pass
        else:
            bridges.append(str(item.get('name')))
    # jhin = Jhin()
    jhin.load_whisper("auth")
    interface = jhin.get("interface") if jhin.get("interface") else {}

    interface_cp = []
    is_change = False
    for item in interface:
        if item in bridges:
            interface_cp.append(item)
        else:
            is_change = True
    if is_change:
        jhin.add('interface', interface_cp)
        if not interface_cp:  # 如果没有认证网桥
            jhin.add('enable', '0')
        jhin.curtain_call()
        sync_conf("auth", jhin.get_all())
        logging.info('(config) webauth reload, because network bridges change')
        os.popen2('/etc/init.d/ruiyi.d/webauth reload')
    return True


def deal_mwan3(conf, mwan3=None):
    """
    根据network相关配置同步修改mwan3配置
    :param conf:
    :return:
    """
    if not mwan3:
        mwan3 = get_conf('mwan3')
    tel_operas = ['telecom', 'cernet', 'cmcc', 'crtc', 'unicom', 'othernet']
    for k, v in mwan3.items():  # clear all
        if k in tel_operas:
            v['interface'] = ''
    interfaces = conf.get('interfaces', [])
    isp_dict = {}
    wan_intercaces = ''
    for item in interfaces:
        wan_intercaces += ' %s' % item.get('name') if wan_intercaces else item.get('name')
        mwan3[item.get('name')]['weight'] = item.get('downbw')
        if mwan3[item.get('name')]['metric'] == '1':  # just need main theard
            isp_dict[item.get('isp')] = '%s %s' % (isp_dict[item.get('isp')], item.get('name')) if item.get('isp') in isp_dict.keys() else "%s" % item.get('name')
    if len(isp_dict) > 1:
        for k, v in isp_dict.items():
            mwan3[k]['interface'] = v
    if len(interfaces) >1:  # 多个wan口时默认开启
        mwan3['enable'] = "1"  # 单wan口关闭
    else:
        mwan3['enable'] = "0"
    mwan3['default']['interface'] = wan_intercaces
    deal_single_conf('mwan3', mwan3)
    os.popen2('mwan3 restart')
    return


def deal_snmp(snmp):
    # set snmp conf
    # jhin = Jhin()
    jhin.load_whisper("snmp_ipmac")
    for item in snmp:
        item['community'] = item.get('community').strip() if item.get('community') else 'public'
    jhin.add("snmp", snmp)
    jhin.curtain_call()
    sync_conf("snmp", jhin.get('snmp'))
    return True


def deal_web_port(webport, is_cmsclinet = False):
    # set web port
    logging.info('(base) set webport %s' % webport)
    # os.popen("sed -i s/listen.*$/'listen %s;'/g /usr/local/openresty/nginx/conf/vhost/web_server.conf" % webport).read()
    deal_single_conf('security', {'web_port':int(webport)})
    if not is_cmsclinet:
        sync_conf("webport", webport)
    os.popen('lua /usr/local/lib/lua/5.1/security/security.lua recovery').read()
    sync_info_api()
    # os.popen2("sleep 0.2;nginx reload")
    return True


def deal_auth_conf(conf):
    """
    when set network to deal net bridege had authed
    # 删除不存在的认证的桥配置
    :param conf:
    :return:
    """
    brides = get_bridges()
    auth_bridges = conf.get('interface')
    if auth_bridges is None:
        return conf
    new_bridges = []
    for item in brides:
        br_name = item.get('name')
        if br_name in auth_bridges:
            new_bridges.append(br_name)
    conf['interface'] = new_bridges
    return conf


def deal_dhcp_conf(conf):
    old_enable = get_conf_confs('dhcpd', 'enable')
    new_enable = conf.get('enable')
    dhcp2dhcpd(conf)
    if 'leases' in conf.keys():
        conf.pop('leases')
    deal_single_conf('dhcpd', conf)
    if str(new_enable) == '1':
        logging.info('(config) dhcp-init restart')
        os.popen2('dhcp-init restart')
    elif str(new_enable) == '0':
        logging.info('(config) dhcp-init stop')
        os.popen2('dhcp-init stop')


def set_interfaces_metric(conf):
    """
    设置多wan口优先级
    :param conf:
    :return:
    """
    count_start = (len(conf.get('routes')) if conf.get('routes') else 0) + 1
    interfaces = conf.get('interfaces')
    if interfaces and len(interfaces):
        for item in interfaces:
            item['metric'] = count_start
            count_start += 1
    return interfaces


def ddns2phlinux(conf):
    interfaces = get_conf_confs('network', 'interfaces')
    nicName = conf.get('interface')
    for item in interfaces:
        if item.get('proto') == 'pppoe':
            nicName = 'ppp-%s'%nicName
    host = conf.get('host') if conf.get('host') else 'PhLinux3.Oray.Net'
    phlinux_str = '[settings]\nszHost=%s\nszUserID=%s\nszUserPWD=%s\nnicName=ppp-%s\nszLog=/var/log/phddns.log\n' \
                  % (host, conf.get('username'), conf.get('password'), nicName)
    file_object = open('/etc/phlinux.conf', 'w')
    file_object.write(phlinux_str)
    file_object.close()
    return


def set_mwan3(conf):
    """
    set mwan3 准备线路以及开关
    :param conf:
    :return:
    """
    # jhin = Jhin()
    jhin.load_whisper('mwan3')
    mwan3 = jhin.get_all()
    multi_line = conf.get('multi_line', [])
    mwan3['enable'] = str(conf.get('enable'))
    for item in multi_line:
        mwan3[item.get('name')]['metric'] = str(item.get('type'))
    deal_mwan3(get_conf('network'), mwan3)


def set_security(conf):
    """
    对security一些配置进行处理
    :param conf:
    :return:
    """
    arp_new = list()
    arp_conf = conf.get('arp', list())
    for item in arp_conf:
        if item.get('bind') != "1":
            continue
        else:
            item.pop('status')
            item.pop('bind')
            arp_new.append(item)
    conf['arp'] = arp_new
    deal_single_conf('security', conf)
    # restart service
    if 'web_port' in conf.keys() or 'ping' in conf.keys() or 'Inlimit_enable' in conf.keys():
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua recovery').read()
        if 'web_port' in conf.keys():
            sync_conf("webport", conf.get('web_port'))
            sync_info_api()
    if 'arp' in conf.keys():
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua arp').read()
    if 'acl' in conf.keys():
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua acl').read()
    if 'connlimit' in conf.keys():
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua limit').read()
    if 'out_ctrl' in conf.keys():
        os.popen('lua /usr/local/lib/lua/5.1/security/security.lua out_ctrl').read()


def get_objs_list(module, conf):
    """
    获取配置中的对象的集合
    :param module: 模块
    :param conf: 欲修改的对象配置
    :return:
    """
    new_objs = conf.get(module.split('_')[0], [])
    new_obj_list = list()
    for item in new_objs:
        new_obj_list.append((item.get('name')))
    return new_obj_list


def clear_objsconf(conf):
    """
    清理对象配置下发中的id和used不必要的信息
    :param conf:
    :return:
    """
    for item in conf:
        item.pop('id', '')
        item.pop('used', '')
    return conf


def deal_obj(conf, obj_name):
    """
    对象配置处理
    :param conf: 下发的配置文件
    :param obj_name: 对象名 ip/mac/domain/app/
    :return:
    """
    obj_class_name = '%s_class' % obj_name  # 对象的类名
    conf_old = get_conf_confs(obj_class_name , obj_name)  # 设备上的配置
    obj_class = conf.get(obj_class_name)  # 获取下发的对象配置的列表
    obj_list = get_objs_list(obj_class_name, obj_class)  # 获取下发对象的列表的对象的名字集合
    check_obj_used = 'check_%s_obj_used' % obj_name  # 构造tools里面相应的检测对象呗使用情况的函数名
    ret, msg = eval(check_obj_used)(obj_list)  # 转换为相应的函数调用
    if not ret:  # 有被使用的对象将要被删除返回错误信息
        return False, msg
    obj_class[obj_name] = clear_objsconf(obj_class.get(obj_name))  # 清理下发配置的id等不需要的信息
    deal_single_conf(obj_class_name, obj_class)  # 保存配置
    func_name = '%s_obj_restart_service' % obj_name  # 构造tools里面相应的重启服务的函数名
    eval(func_name)(conf.get(obj_class_name), obj_list, conf_old)  # eval 函数名 直接转换为相应的函数
    return True, 'success'


def deal_conf(conf, is_cmsclinet = False, remote_addr = '', record_log = True):
    """
    设置配置
    :return:
    """
    logging.info('(config) deal conf ... ...')
    logging.info('(config) %s' % conf)
    logging.info('(config) conf keys %s' % conf.keys())
    ret, msg = check_conf(conf)
    if not record_log:
        def write_operate_log(a, b, c):
            pass
    else:
        from log_center.operate_log import write_operate_log
    if not ret:
        return -1, msg
    operator_user = 'admin' if not is_cmsclinet else 'online'
    if "auth" in conf.keys():  # 认证配置
        old_enable = get_auth_enable()
        # auth_conf = conf.get('auth')
        auth_conf = deal_auth_conf(conf.get('auth'))
        # change mac to lower
        if auth_conf. has_key('black_mac'):
            black_mac = []
            for item in auth_conf['black_mac']:
                mac, nickname = item.encode('utf-8').split(',')
                item = mac.lower() + ',' + nickname
                black_mac.append(item)
            auth_conf['black_mac'] = black_mac
        if auth_conf. has_key('white_mac'):
            white_mac = []
            for item in auth_conf['white_mac']:
                mac, nickname = item.encode('utf-8').split(',')
                item = mac.lower() + ',' + nickname
                white_mac.append(item)
            auth_conf['white_mac'] = white_mac
        deal_single_conf("auth", auth_conf)
        if auth_conf:
            logging.info('(config) >>begin conf auth...')
            enable = str(auth_conf. get('enable'))
            logging.info("(config) >>old enable is:%s, now get enable is:%s" % (old_enable, enable))
            if old_enable == '0' and enable == "1":
                start_bridge_netfilter()
                logging.info('(config) webauth start')
                os.popen2('/etc/init.d/ruiyi.d/webauth start')  # 启动脚本
            elif old_enable == '1' and enable == "0":
                os.popen('lua /usr/local/lib/lua/5.1/webauth/kick.lua null null kickall').read()
                os.popen2('/etc/init.d/ruiyi.d/webauth stop')  # 停止脚本
                logging.info('(config) webauth stop')
                stop_bridge_netfilter()
            elif old_enable == '1' and enable == "1":
                start_bridge_netfilter()
                logging.info('(config) webauth reload')
                os.popen2('/etc/init.d/ruiyi.d/webauth reload')  # 重启脚本
            elif old_enable == '1' and enable == "None":
                start_bridge_netfilter()
                logging.info('(config) webauth reload')
                os.popen2('/etc/init.d/ruiyi.d/webauth reload')  # 重启脚本
            logging.info('(config) <<success conf auth!')
        write_operate_log(operator_user, remote_addr, '修改了认证相关配置')
    if "network" in conf.keys():  # 网关配置
        logging.info('(config) >>begin conf network...')
        conf['network'] = get_internals(conf.get('network'))
        conf['network'] = interfaces2routers(conf.get('network'))
        # conf['network']['interfaces'] = set_interfaces_metric(conf.get('network'))
        deal_single_conf("network", conf.get('network'))
        deal_change_brige(conf.get('network'))
        dhcp_enable = get_conf_confs('dhcpd', 'enable')
        deal_mwan3(conf.get('network'))
        if not is_cmsclinet:
            logging.info('(config) >>begin restart network')
            logging.info('(config) >>finish restart network')
            if str(dhcp_enable) == '1':
                os.popen2('sleep 1;wait;`network restart`;wait;dhcp-init restart;webauth reload;lua /usr/local/lib/lua/5.1/security/security.lua net'
                          ';wait;lua /usr/local/lib/lua/5.1/security/security.lua net')
            else:
                os.popen2('sleep 1;wait;`network restart`;wait;webauth reload;wait;lua /usr/local/lib/lua/5.1/security/security.lua net')
            # os.popen2('/etc/init.d/ruiyi.d/webauth reload')
            time.sleep(3)
            logging.info('(config) >>begin to return response')
        else:
            # os.popen2('sleep 3;network restart')
            if str(dhcp_enable) == '1':
                os.popen2('sleep 3;wait;`network restart`;wait;dhcp-init restart;webauth reload;wait;lua /usr/local/lib/lua/5.1/security/security.lua net')
                # os.popen2('sleep 4;dhcp-init restart')
            else:
                os.popen2('sleep 3;wait;`network restart`;wait;webauth reload;wait;lua /usr/local/lib/lua/5.1/security/security.lua net')
            # os.popen2('sleep 6;/etc/init.d/ruiyi.d/webauth reload')
        logging.info('(config) network restart')
        logging.info('(config) <<success conf network!')
        if 'dns_addr' in conf.get('network').keys():
            write_operate_log(operator_user, remote_addr, '修改了dns配置')
        else:
            write_operate_log(operator_user, remote_addr, '修改了网络配置')
    # network.sync_mac_address()
    if "snmp" in conf.keys():
        logging.info('(config) >>begin conf snmp...')
        deal_snmp(conf.get('snmp'))
        os.popen2('snmp_scan restart')
        logging.info('(config) snmp_scan restart')
        logging.info('(config) <<success conf snmp!')
        write_operate_log(operator_user, remote_addr, '修改了用户扫描配置')
    # 审计配置
    if "audit" in conf.keys():
        logging.info('(config) >>begin conf audit...')
        deal_audit_conf("audit", conf.get('audit'))
        logging.info('(config) <<success conf audit!')
        write_operate_log(operator_user, remote_addr, '修改了网监审计开关')
    # mem cpu alert set
    if "alert" in conf.keys():
        logging.info('(config) >>begin conf alert...')
        deal_single_conf("alert", conf.get('alert'))
        logging.info('(config) <<success conf alert!')
        write_operate_log(operator_user, remote_addr, '修改了内存告警百分比')
    # lic set
    if "lic" in conf.keys():
        logging.info('(config) >>begin conf lic...')
        deal_single_conf("lic", conf.get("lic"))
        write_operate_log(operator_user, remote_addr, '修改了license地址')
        os.popen2('syslc restart')
    if "webport" in conf.keys():
        logging.info('(config) >>begin conf webport...')
        deal_web_port(conf.get("webport"), is_cmsclinet)
        write_operate_log(operator_user, remote_addr, '修改了外网端口')
    if "dhcpd" in conf.keys():
        logging.info('(config) >>begin conf dhcp...')
        deal_dhcp_conf(conf.get('dhcpd'))
        write_operate_log(operator_user, remote_addr, '下发了dhcp配置')
    if "ddns" in conf.keys():
        logging.info('(config) >>begin conf ddns...')
        ddns_conf = conf.get('ddns')
        ddns_conf.pop('status')
        ddns2phlinux(ddns_conf)
        deal_single_conf('ddns', ddns_conf)
        write_operate_log(operator_user, remote_addr, '下发了花生壳配置')
    if "mwan3" in conf.keys():
        logging.info('(config) >>begin conf mwan3...')
        set_mwan3(conf.get('mwan3'))
        os.popen2('mwan3 restart')
        write_operate_log(operator_user, remote_addr, '修改了负载均衡配置')
    if "security" in conf.keys():
        logging.info('(config) >>begin conf security...')
        if 'Inlimit_enable' in conf.get('security').keys():
            write_operate_log(operator_user, remote_addr, '修改了本地防攻击配置')
        if 'arp' in conf.get('security').keys():
            write_operate_log(operator_user, remote_addr, '修改了ARP表项')
        if 'acl' in conf.get('security').keys():
            write_operate_log(operator_user, remote_addr, '修改了ACL访问控制')
        if 'out_ctrl' in conf.get('security').keys():
            write_operate_log(operator_user, remote_addr, '修改了外网访问控制')
        if 'connlimit' in conf.get('security').keys():
            write_operate_log(operator_user, remote_addr, '修改了连接数限制')
        set_security(conf.get('security'))
    if "ip_class" in conf.keys():
        ret, msg = deal_obj(conf, 'ip')
        if not ret:
            return -1, msg
        write_operate_log(operator_user, remote_addr, '修改了ip对象')
    if "domain_class" in conf.keys():
        ret, msg = deal_obj(conf, 'domain')
        if not ret:
            return -1, msg
        write_operate_log(operator_user, remote_addr, '修改了域名对象')
    if "mac_class" in conf.keys():
        ret, msg = deal_obj(conf, 'mac')
        if not ret:
            return -1, msg
        write_operate_log(operator_user, remote_addr, '修改了mac对象')
    if "time_class" in conf.keys():
        ret, msg = deal_obj(conf, 'time')
        if not ret:
            return -1, msg
        write_operate_log(operator_user, remote_addr, '修改了时间对象')
    if "app_class" in conf.keys():
        ret, msg = deal_obj(conf, 'app')
        if not ret:
            return -1, msg
        write_operate_log(operator_user, remote_addr, '修改了自定义对象')
    if 'netserver' in conf.keys():
        netserver_conf = conf.get('netserver')
        netserver_conf.pop('natlist', '')
        netserver_conf.pop('dmzlist', '')
        deal_single_conf('netserver', netserver_conf)
        write_operate_log(operator_user, remote_addr, '修改了端口映射')
    if 'ipsec' in conf.keys():
        ipsec_conf = conf.get('ipsec')
        deal_single_conf('ipsec', ipsec_conf)
        convert_ipsec2conf(ipsec_conf.get('server'))
        enable = str(ipsec_conf.get('enable'))
        if enable == '1':
            os.popen2('ipsec-init restart')
        else:
            os.popen2('ipsec-init stop')
        write_operate_log(operator_user, remote_addr, '修改了vpn配置')
    logging.info('(config) <<success conf all !!!!')
    return 0, 'success'


def get_conf(conf_name, target=None):
    """
    获取配置文件
    :param conf_name:
    :return:
    """
    # jhin = Jhin()
    logging.info('(config) get %s conf' % conf_name)
    jhin.load_whisper(conf_name)
    if target:
        conf = dict()
        for item in target:
            conf[item] = jhin.get(item)
    else:
        conf = jhin.get_all()
    logging.info('(config) conf %s' % conf)
    return conf


def get_host_leases(conf):
    hosts = conf.get('hosts', [])
    host_lease = []
    for item in hosts:
        if item.get('ip'):
            lease_dict = {}
            host_name = (os.popen(
                "cat /tmp/dhcp.leases | grep %s | awk '{print $3}'" % item.get('ip')).read()).replace(
            '\n', '')
            if host_name:
                lease_dict['ip'] = item.get('ip')
                lease_dict['mac'] = item.get('mac')
                lease_dict['client_hostname'] = item.get('name')
                lease_dict['start'] = '--'
                lease_dict['end'] = '--'
                host_lease.append(lease_dict)
    return host_lease


def get_leases():
    file_leases = open('/var/db/dhcpd.leases', 'r')
    lease_list = []
    lease_dict = {}
    ips = []
    rmips = {}
    while True:
        line = file_leases.readline()
        if line:
            if str(line).startswith('  ') or str(line).startswith('lease') or str(line).startswith('}'):
                if 'lease' in line:
                    lease_dict = {}
                    ip = line.split(' ')[1]
                    if ip in ips:  # 保留最新的一条租约时间
                        for item in lease_list:
                            if item.get('ip') == ip and item.get('mac', ''):
                                rmips[item.get('ip')] = item.get('mac', '')
                                lease_list.remove(item)
                    else:
                        ips.append(ip)
                    lease_dict['ip'] = ip
                if 'starts' in line:
                    starts = line.strip().strip(';\n').split(' ')
                    start = '%s %s' % (starts[2], starts[3])
                    start = (datetime.datetime.strptime(start, "%Y/%m/%d %H:%M:%S")) + datetime.timedelta(
                        hours=8) if start else ''
                    lease_dict['start'] = str(start)
                if 'ends' in line:
                    ends = line.strip().strip(';\n').split(' ')
                    end = '%s %s' % (ends[2], ends[3])
                    end = (datetime.datetime.strptime(end, "%Y/%m/%d %H:%M:%S")) + datetime.timedelta(
                        hours=8) if end else ''
                    lease_dict['end'] = str(end)
                if 'hardware' in line:
                    hardware = line.strip().strip(';\n').split(' ')
                    lease_dict['mac'] = hardware[2]
                if 'client-hostname' in line:
                    client_hostname = line.strip().strip(';\n').split(' ')
                    lease_dict['client_hostname'] = (client_hostname[1]).strip("\"")
                if '}' in line:
                    if 'client_hostname' not in lease_dict.keys():
                        client_hostname = (os.popen(
                            "cat /tmp/dhcp.leases | grep %s | awk '{print $3}'" % lease_dict['ip']).read()).replace(
                            '\n', '')
                        lease_dict['client_hostname'] = client_hostname
                    if 'mac' not in lease_dict.keys():
                        if lease_dict.get('ip') in rmips.keys():
                            lease_dict['mac'] = rmips[lease_dict.get('ip')]
                        else:
                            lease_dict['mac'] = (os.popen(
                                "cat /tmp/dhcp.leases | grep %s | awk '{print $1}'" % lease_dict['ip']).read()).replace(
                                '\n', '')
                    lease_list.append(lease_dict)
        else:
            break
    file_leases.close()
    return lease_list


def req_conf_auth_get_bridges(conf):
    bridges = get_bridges()
    conf['brides'] = bridges
    return conf


def req_conf_network_deal_interface(conf):
    not_bind = get_interfaces_not_on_bridge()
    not_bind_cp = []
    for item in not_bind:
        if 'eth' in item and 'ppp' not in item and '.' not in item:
        # if item in ['eth0', 'eth1', 'eth2', 'eth3', 'eth4', 'eth5']:
            not_bind_cp.append(item)
    not_bind = not_bind_cp
    logging.info('(config) not bind bridge %s' % not_bind)
    bridges = conf.get("bridges")
    wan_ports = []
    if conf.get('mode') in ['gateway', 'bypass']:
        wan_ports = conf.get('external', [])
    interface_bind = []
    if bridges:
        for item in bridges:
            item['proto'] = 'static'
            if item.get('interface'):
                item['interface_all'] = item.get('interface') + not_bind
                interface_bind += item.get('interface')
            else:
                item['interface_all'] = not_bind
            if wan_ports:
                item['interface_all'] = list(set(item['interface_all']).difference(set(wan_ports)))
        conf['bridges'] = bridges
    interface_all = list(set(interface_bind+not_bind))
    if wan_ports:
        conf['interface_all'] = list(set(interface_all).difference(set(wan_ports)))
    else:
        conf['interface_all'] = interface_all
    return conf


def req_conf_network_deal_router(conf):
    routes = conf.get("routes")
    if routes:
        cc = 1
        for item in routes:
            item['id'] = cc
            cc += 1
        conf['routes'] = routes
    return conf


def req_conf_network_deal_interfaces(conf):
    """
    返回dhcp，pppoe等协议的外网口ip信息等
    :param conf:
    :return:
    """
    interfaces = conf.get('interfaces')
    route = conf.get('routes')
    if not interfaces:
        return conf
    info = get_all_interfaces_info()
    for item in interfaces:
        name = item.get('name')
        if item.get('proto') in ['dhcp', 'pppoe']:
            item['ip'] = info[name]['ip']
            item['mask'] = info[name]['mask']
        elif item.get('proto') == 'static':
            item['gateway'] = ''
            for item_route in route:
                if item_route.get('name', '') == item.get('name'):
                    item['gateway'] = item_route.get('next_route')
    return conf


def req_conf_network_deal(conf):
    conf = req_conf_network_deal_interface(conf)
    conf = req_conf_network_deal_router(conf)
    if conf.get('mode') == 'gateway':
        conf = req_conf_network_deal_interfaces(conf)
        conf['interfaces'] = deal_dhcpd_conf(conf.get('interfaces'))
    return conf


def dhcp_conf_add_id(conf):
    pools = conf.get('pools')
    if pools:
        pools_id = 1
        for item in pools:
            item['pools_id'] = pools_id
            pools_id += 1
            ranges = item.get('ranges')
            if not ranges:
                continue
            else:
                rang_id = 1
                for item_range in ranges:
                    item_range['name'] = rang_id
                    rang_id += 1
    hosts = conf.get('hosts')
    if hosts:
        host_id = 1
        for item_host in hosts:
            item_host['host_id'] = host_id
            host_id += 1
    return conf


def deal_dhcpd_conf(interfaces):
    for item in interfaces:
        if item.get('proto') == 'pppoe':
            item['gateway'], item['dns'], item['ip'], item['mask'] = get_pppoe_dns(item.get('name'))
        elif item.get('proto') == 'dhcp':
            item['ip'], item['dns'], item['gateway'], item['mask'] = get_dhcp_info(item.get('name'))
    return interfaces


def get_wans():
    """
    返回wan口 [{"value":"eth0", "name":"wan1"},{"value":"eth1", "name":"wan2"}]
    :return:
    """
    interfaces = get_conf_confs('network', 'interfaces')
    interfaces_list = []
    for item in interfaces:
            port_num = re.findall("\d+", item.get('name'))[-1]
            if port_num.isdigit():
                interfaces_list.append({'value': item.get('name'), 'name': 'wan%s' % (int(port_num)+1)})
    if interfaces_list:
        interfaces_list.sort(key=operator.itemgetter('value'), reverse=False)
    return interfaces_list


class ObjectClass():
    def __init__(self):
        pass

    def get_object_name_list(self, object_name):
        ob_key = object_name.split('_')[0]
        name_list = list()
        ob_data = get_conf_confs(object_name, ob_key)
        for item in ob_data:
            name_list.append(item.get('name'))
        name_list.sort()
        return name_list

    def get_all_object_list(self):
        """
        获取下拉框数据
        :return:
        """
        object_list = ['time_class', 'ip_class', 'domain_class', 'mac_class', 'app_class']
        ret_list = dict()
        for item in object_list:
            ret_list[item] = self.get_object_name_list(item)
        return ret_list


class GetSecutity():
    def __init__(self):
        pass

    def get_arp_data(self, arp_conf):
        arp_file = open("/proc/net/arp")
        status = {'0x6': '静态', '0x2': '动态'}
        in_arp_conf = list()
        for item in arp_conf:
            in_arp_conf.append(item.get('ip'))
            item['status'] = status['0x6']
            item['bind'] = '1'
        for line in islice(arp_file, 1, None):
            arp_file_dict = dict()
            sp_line = str(line).split()
            if sp_line[2] != '0x0' and sp_line[0] not in in_arp_conf:
                arp_file_dict['ip'] = sp_line[0]
                arp_file_dict['mac'] = sp_line[3]
                arp_file_dict['status'] = status[sp_line[2]]
                arp_file_dict['bind'] = '0'
                arp_conf.append(arp_file_dict)
        arp_file.close()
        arp_conf.sort(key=operator.itemgetter('bind'), reverse=True)
        return arp_conf

    def get_webport(self):
        web_conf_info = os.popen("sed -n '/listen.*$/p' /usr/local/openresty/nginx/conf/vhost/web_server.conf").read()
        httport = re.findall(r'(\w*[0-9]+)\w*', web_conf_info)
        webport = httport[0] if len(httport) else 80
        return int(webport)

    def get_object_list(self):
        object_class = ObjectClass()
        all_objectlist = object_class.get_all_object_list()
        return all_objectlist


def deal_security(conf):
    get_security = GetSecutity()
    if 'arp' in conf.keys():
        conf['arp'] = get_security.get_arp_data(conf['arp'])
    if 'web_port' in conf.keys():
        conf['web_port'] = get_security.get_webport()
    if 'out_ctrl' in conf.keys():
        conf['object_list'] = get_security.get_object_list()
        conf['bridges'] = get_bridges()
        conf['bridges'].sort(key=operator.itemgetter('name'), reverse=False)
        for index, value in enumerate(conf.get('out_ctrl')):
            if type(value) is dict:
                value['id'] = index + 1
    if 'acl' in conf.keys():
        objclass = ObjectClass()
        conf['time_class'] = objclass.get_object_name_list('time_class')
        conf.get('acl').sort(key=operator.itemgetter('index'), reverse=False)
    return conf


def deal_req_part_conf(request, conf, conf_name, target):
    if conf_name == 'security':
        conf = deal_security(conf)
    return conf


def deal_req_obj(obj_list, module):
    """
    [{'name':xxx,'xxx'},{'name:xxxx}]
    :param conf:
    :param mudule:
    :return:
    # """
    for index, item in enumerate(obj_list):
        item['id'] = index + 1
        item['used'] =  list()# get_obj_used(module, item.get('name'))
    return obj_list


def deal_req_netserver(conf):
    wans  = get_conf_confs('network', 'external')
    netserver = conf.get('netserver', [])
    dmz_can_list = deepcopy(wans)  # 整机映射能使用的端口
    nat_limit_dict = dict()
    nat_not_list = list()
    for item in netserver:
        wan_name = item.get('wan_net')
        if wan_name in dmz_can_list:
            dmz_can_list.remove(wan_name)
        if item.get('type') == 'nat':  # 端口映射
            nat_limit_dict[wan_name] = nat_limit_dict[wan_name]+[item.get('wan_port')] if wan_name in nat_limit_dict.keys() else [item.get('wan_port')]
        else:  # 整机映射
            nat_not_list.append(item.get('wan_net'))
    ret_nat_list = []
    for item in wans:
        if item in nat_not_list:
            continue
        else:
            limit = []
            if item in nat_limit_dict.keys():
                limit = nat_limit_dict.get(item)
            value = 'wan%s' % (int(re.findall("\d+", item)[-1]) + 1)
            ret_nat_list.append({'name':item, 'limit': limit, 'value': value})
    ret_dmz_list = []
    for item in dmz_can_list:
        value = 'wan%s' % (int(re.findall("\d+", item)[-1]) + 1)
        ret_dmz_list.append({'name':item, 'limit': [], 'value': value})
    #  addd id
    for index, item in enumerate(netserver):
        item['id'] = index + 1
        item['value'] = 'wan%s' % (int(re.findall("\d+", item['wan_net'])[-1]) + 1)
    conf['natlist'] = ret_nat_list
    conf['dmzlist'] = ret_dmz_list
    return conf


def deal_req_ipsec(conf):
    servers = conf.get('server')
    for index, item in enumerate(servers):
        item['id'] = index + 1
        subnet = item.get('subnet')
        item['status'] = u'已连接'
        for index_sunnet, item_subnet in enumerate(subnet):
            item_subnet['id'] = index_sunnet + 1
    return conf


def deal_req_conf(request, conf, conf_name):
    if not conf:
        return
    if conf_name == 'auth':
        conf = req_conf_auth_get_bridges(conf)
        conf['mode'] = get_network_mode()
    elif conf_name == 'network':
        remote_ip = request.META['REMOTE_ADDR']
        conf = req_conf_network_deal(conf)
        pc_mac = (os.popen("ip neigh | grep %s | awk '{print $5}'" % remote_ip).read()).replace('\n', '')
        conf['pc_mac'] = pc_mac
        conf.get('interfaces').sort(key=operator.itemgetter('name'), reverse=False)
        conf.get('bridges').sort(key=operator.itemgetter('name'), reverse=False)
    elif conf_name == 'dhcpd':
        conf = dhcp_conf_add_id(conf)
        logging.info('get leases')
        conf['leases'] = get_host_leases(conf) + get_leases()
        logging.info('finish get leases')
    elif conf_name == 'ddns':
        conf['wans'] = get_wans()
        conf['status'] = '连接失败'
    elif conf_name == 'mwan3':  # 只需返回主备线路的状态和个数即可
        conf_cp = {}
        main_t = []
        conf_cp['enable'] = conf.get('enable')
        external = get_conf_confs('network', 'external')
        for k, v in conf.items():
            if k.startswith('eth') and k in external:
                if v.get('metric') == '1':
                    main_t.append(
                        {'name': k, 'value': '%s%s' % (k[:-1].replace('eth', 'wan'), int(k[-1]) + 1), 'type': '1'})
                else:
                    main_t.append(
                        {'name': k, 'value': '%s%s' % (k[:-1].replace('eth', 'wan'), int(k[-1]) + 1), 'type': '2'})
        main_t.sort(key=operator.itemgetter('name'), reverse=False)
        conf_cp['multi_line'] = main_t
        conf = conf_cp
    elif conf_name == 'security':
        deal_security(conf)
    elif conf_name == 'time_class':
        times = conf.get('time', list())
        conf['time'] = deal_req_obj(times, 'time_class')
    elif conf_name == 'ip_class':
        ips = conf.get('ip', list())
        conf['ip'] = deal_req_obj(ips, 'ip_class')
    elif conf_name == 'domain_class':
        domains = conf.get('domain')
        conf['domain'] = deal_req_obj(domains, 'domain_class')
    elif conf_name == 'mac_class':
        macs = conf.get('mac', list())
        conf['mac'] = deal_req_obj(macs, 'mac_class')
    elif conf_name == 'app_class':
        apps = conf.get('app', list())
        conf['app'] = deal_req_obj(apps, 'app_class')
        conf.get('class').sort(key=operator.itemgetter('value'), reverse=False)
    elif conf_name == 'netserver':
        conf = deal_req_netserver(conf)
    elif conf_name == 'ipsec':
        conf = deal_req_ipsec(conf)
    return conf


def get_list_conf(request, confs):
    """
    获取多个配置文件
    :param confs:
    :return:
    """
    conf = {}
    for item in confs:
        item_conf = get_conf(item)
        conf[item] = deal_req_conf(request, item_conf, item)
    return conf


def req_conf(request):
    """
    web获取配置
    :param request:
    :return:
    """
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    conf_name = data.get('conf_name')
    if conf_name:
        if type(conf_name) is list:
            conf = get_list_conf(request, conf_name)
        else:
            # 支持单个配置查询子配置 如 network 的gateway配置
            target = data.get('target')
            conf = get_conf(conf_name, target)
            conf = deal_req_part_conf(request, conf, conf_name, target)
            if not target:
                conf = deal_req_conf(request, conf, conf_name)
        return JsonResponse({'result': 'ok', 'msg': 'success', 'data': conf})
    else:
        return JsonResponse({'result': 'failed', 'msg': 'parameres error'})


def deal_get_path(conf_name, conf_key):
    # jhin = Jhin()
    logging.info('(config) get %s conf' % conf_name)
    jhin.load_whisper(conf_name)
    conf = {conf_key: jhin.get(conf_key)}
    if conf_name == 'network' and conf_key == 'routes':
        conf = req_conf_network_deal_router(conf)
    elif conf_name == 'network' and conf_key == 'bridges':
        conf = req_conf_network_deal_interface(conf)
    return conf


def get_part_conf(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    conf_name = data.get('conf_name')
    conf_key = data.get('conf_key')
    conf = deal_get_path(conf_name, conf_key)
    return JsonResponse({'result': 'ok', 'msg': 'success', 'data': conf})


def unbind_inter(request):
    return JsonResponse({'result': 'ok', 'msg': get_interfaces_not_on_bridge()})


def set_conf(request):
    """
    web设置配置
    :param request:{"auth":{},"network":{}}
    :return:
    """

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    ret, status = deal_conf(data, remote_addr=request.META.get('REMOTE_ADDR'))
    if ret == 0:
        return JsonResponse({'result': 'ok', 'msg': '配置成功！'})
    else:
        return JsonResponse({'result': 'failed', 'msg': status})


def reload_auth(request):
    """
    重启认证服务
    :param request:
    :return:
    """
    logging.info('(config) webauth reload')
    os.popen2('/etc/init.d/ruiyi.d/webauth reload')
    return JsonResponse({'result': 'ok', 'msg': '服务重启成功！'})


def auth_list(request):
    """
    get auth user list
    :param request:
    :return:
    """
    # onlineUser[{ip:'',mac:'',useTime:'',allowTime:'',realMsg:'',authType:''},{...}]
    auth_user_list = []
    if os.path.exists("/run/auth_user"):
        file_auth_user = open("/run/auth_user")
        while 1:
            auth_dict = {}
            line = file_auth_user.readline()
            if not line:
                break
            if line[0:-1]:
                auth_dict['ip'], auth_dict['mac'], auth_dict['useTime'], auth_dict['allowTime'], \
                auth_dict['realMsg'], auth_dict['authType'] = line[0:-1].split(' ')
                auth_user_list.append(auth_dict)
        file_auth_user.close()
        logging.info('(config) get auth_user %s' % str(auth_user_list))
    return JsonResponse({'result': 'ok', 'msg': 'success', 'onlineUser': auth_user_list})


def kick_auth(request):
    """
    kick auth user
    :param request:
    :return:
    """
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    if 'ip' not in data.keys() or 'mac' not in data.keys():
        return JsonResponse({'result': 'failed', 'msg': 'parameters error'})
    ip = data.get('ip')
    mac = data.get('mac')
    os.popen2('lua /usr/local/lib/lua/5.1/webauth/kick.lua %s %s webout' % (mac, ip))
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '修改了认证相关配置')
    return JsonResponse({'result': 'ok', 'msg': 'success'})


def switch_mode(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    mode = data.get('mode')
    mode_dict = {'gateway':'网关模式', 'bridge':'网桥模式', 'bypass':'旁路模式'}
    if not mode or mode not in ['bridge', 'gateway', 'bypass']:
        return JsonResponse({'result': 'failed', 'msg': 'mode error'})
    now_mode = get_network_mode()
    if now_mode == str(mode):
        return JsonResponse({'result': 'failed', 'msg': '相同模式不需要切换'})
    # init_conf(mode)
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '模式切换：%s切%s'%(mode_dict['now_mode'], mode_dict['mode']))
    factory_reset(mode)
    os.popen2('sleep 0.1; echo 1 > /proc/sys/kernel/sysrq; sync; echo b > /proc/sysrq-trigger')
    return JsonResponse({'result': 'ok', 'msg': 'success'})


def deal_switch_lanwan(wans, lans):
    """
    lan口切换，lan口多起来可以不用管，lan口少掉的话要从
    :param wans:
    :return:
    """
    # jhin = Jhin()
    jhin.load_whisper('network')
    conf = jhin.get_all()
    external = conf.get('external')
    interfaces = conf.get('interfaces')
    jhin.load_whisper('mwan3')
    mwan3_conf = jhin.get_all()
    # deal wan
    less_external = list(set(external).difference(wans))  # [1,3].difference[1,2] = [3] 所以3是减少的
    more_external = list(set(wans).difference(external))  # [1,2].difference[1,3] = [2] 所以2是新增的。新增的就是从lan口少掉的，因此只要处理桥里面的lan口少掉的就行，lan口多的不需要处理，即可同过绑定到对应lan口
    # inter_external = list(set(external).intersection(set(wans)))  # 交集 [1,3].intersection[1,2] = [1]
    # new_external = []
    new_interfaces = []
    # check wan if be used
    ret, msg = check_wan_used(less_external)
    if not ret:
        return False, msg

    # 删除减少的wan口
    for item_interfaces in interfaces:
        if item_interfaces.get('name') not in less_external:
            new_interfaces.append(item_interfaces)

    for item_more_external in more_external:
        # 新增wan口配置
        new_interfaces.append(
            {'ip': '', 'mac': '', 'mask': '', 'name': item_more_external,
             'proto': 'dhcp', 'username': '01012345678', 'password': 'admin',
             'mtu': 1500, 'mode': 'nat', 'rate': 'auto', 'isp': 'telecom',
             'upbw': 100, 'downbw': 100
             }
        )
        # 新增mwan3配置
        if item_more_external not in mwan3_conf.keys():
            mwan3_conf[item_more_external] = {
            "name": item_more_external,
            "enabled": "1",
            "track_ip": "114.114.114.114",
            "reliability": "1",
            "count": "1",
            "timeout": "1",
            "interval": "5",
            "down": "3",
            "up": "1",
            "weight": "20",
            "metric": "1"
            }
            mwan3_conf['http_%s' % item_more_external] = {
                "name": item_more_external,
                "metric": str(re.findall("\d+", item_more_external)[-1])
            }

    # deal lan
    bridges = conf.get('bridges')
    new_bridges = []
    internal = []
    for item_bridges in bridges:
        interface = item_bridges.get('interface')
        intersection_bridges = list(set(interface).intersection(more_external))  # 交集
        if intersection_bridges:  # 存在交集则说明需要从桥中删除掉
            new_bridge_interface = list(set(interface).difference(intersection_bridges))
            if new_bridge_interface:
                item_bridges['interface'] = new_bridge_interface
            else:
                continue
        new_bridges.append(item_bridges)
        internal.append(item_bridges.get('name'))
    conf['interfaces'] = new_interfaces  # wan口配置
    conf['external'] = wans  # wan口
    conf['bridges'] = new_bridges  # 桥配置
    conf['internal'] = internal  # 桥所包含的口
    ret, msg = deal_conf({"network": conf}, record_log=False)
    if ret == -1:
        return False, msg
    deal_conf({"mwan3": mwan3_conf}, record_log=False)
    return True, 'success'


def switch_lanwan(request):
    """
    lan wan切换
    :param request:
    :return:
    """
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    lan_wan_sta = data.get('lan_wan_sta')
    if type(lan_wan_sta) is not list:
        return JsonResponse({'result': 'failed', 'msg': 'data error'})
    all_interfaces = get_all_normal_interfaces()
    wans = []
    lans = []
    for item in lan_wan_sta:
        if item.get('status') == 'wan':
            wans.append(item.get('name'))
        else:
            lans.append(item.get('name'))
    if 'eth0' in lans or 'eth%s'% (len(all_interfaces)-1) in wans:
        return JsonResponse({'result': 'failed', 'msg': 'eth0为固定wan口不能切为lan口，\neth%s为固定lan口不能切为wan口'%(len(all_interfaces)-1)})
    ret, msg = deal_switch_lanwan(wans, lans)
    if not ret:
        return JsonResponse({'result': 'failed', 'msg':msg})
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '进行了lan/wan切换')
    return JsonResponse({'result': 'ok', 'msg': 'success'})


def get_lanwan_sta(request):
    """
    获取当前口的状态
    :param request:
    :return:
    """
    all_interfaces = get_all_normal_interfaces()
    external = get_conf_confs('network', 'external')
    sta_list = []
    for item in all_interfaces:
        if item in ['eth0', 'eth%s' % (len(all_interfaces)-1)]:
            change = False
        else:
            change = True
        if item not in external:
            sta_list.append({'name': item, 'status': 'lan', 'change':change})
        else:
            sta_list.append({'name': item, 'status': 'wan','change':change})
    sta_list.sort(key=operator.itemgetter('name'), reverse=False)
    return JsonResponse({'result': 'ok', 'lan_wan_sta':sta_list})


def test(request):
    """
    test
    :param request:
    :return:
    """
    # jhin = Jhin()
    # jhin.load_whisper("network")
    # conf = jhin.get("bridges")
    # for item in conf:
    #     print item.get('name')
    # return JsonResponse({'result': 'ok', 'msg': 'success'})
    return JsonResponse({'result': 'ok'})
