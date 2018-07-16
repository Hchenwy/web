# coding: utf-8
from netaddr import IPAddress
from netaddr import IPNetwork
from netaddr import IPRange

from utils.tools import check_subnet_rep, ip_range_include, check_br_used

filename = 'chekconf'
import re

def checkip(ip):
    if not ip:  # ip can ""
        return True
    p = re.compile('^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$')
    if p.match(ip):
        return True
    else:
        return False


def check_auth(conf):
    if type(conf) is not dict:
        return False, 'conf type error, not json'

    if conf.has_key('enable'):
        enable = str(conf.get('enable'))
        if enable != "0" and enable != "1":
            return False, 'enable value error'
        if enable == "1":
            if conf.has_key('interface'):
                interface = conf.get('interface')
                if type(interface) is not list or len(interface) <= 0:
                    return False, u'认证网络必选!'

    if conf.has_key('wxwifi'):
        wxwifi = conf.get('wxwifi')
        if wxwifi != "0" and  wxwifi != "1":
            return False, 'wxwifi value error'

    if conf.has_key('MacPass'):
        MacPass = conf.get('MacPass')
        if MacPass != "0" and  MacPass != "1":
            return False, 'MacPass value error'

    if conf.has_key('ios_opt'):
        ios_opt = conf.get('ios_opt')
        if ios_opt != "0" and  ios_opt != "1":
            return False, 'ios_opt value error'

    if conf.has_key('wx_escape'):
        wx_escape = conf.get('wx_escape')
        if wx_escape != "0" and wx_escape != "1":
            return False, 'wx_escape value error'

    if conf.has_key('WD_CheckTime2'):
        WD_CheckTime2 = str(conf.get('WD_CheckTime2'))
        if not WD_CheckTime2.isdigit() or int(WD_CheckTime2) <0 or int(WD_CheckTime2) >10:
            return False, 'WD_CheckTime2 value error'

    # if conf.get('ssid'):
    #     ssid = conf.get('ssid')
    #     if type(ssid) is not str:
    #         return False, 'ssid type error'

    if conf.has_key('wxerr_count'):
        wxerr_count = str(conf.get('wxerr_count'))
        if not wxerr_count.isdigit() or int(wxerr_count) <1 or int(wxerr_count) >10:
            return False, u'连续认证超时用户数：%s设置错误，值区间（1,10）之间' % wxerr_count

    if conf.has_key('userescape_time'):
        userescape_time = str(conf.get('userescape_time'))
        if not userescape_time.isdigit() or int(userescape_time) <1 or int(userescape_time)>86400:
            return False, u'逃生时间值：%s设置错误，值区间（1,86400）之间' % userescape_time

    if conf.has_key('wxerr_rangetime'):
        wxerr_rangetime = str(conf.get('wxerr_rangetime'))
        if not wxerr_rangetime.isdigit() or int(wxerr_rangetime) <1 or int(wxerr_rangetime) >86400:
            return False, u'逃生超时时间：%s设置错误，值区间（1,86400）之间'% wxerr_rangetime

    if conf.has_key('wmc_alivetime'):
        wmc_alivetime = str(conf.get('wmc_alivetime'))
        if not wmc_alivetime.isdigit() or int(wmc_alivetime) <0 or int(wmc_alivetime) >86400:
            return False, u'认证检查时间：%s设置错误，值区间（0,86400）之间'% wmc_alivetime

    if conf.has_key('wxerr_restime'):
        wxerr_restime = str(conf.get('wxerr_restime'))
        if not wxerr_restime.isdigit() or int(wxerr_restime) <1 or int(wxerr_restime) >86400:
            return False, u'集体逃生后时间值设置错误，值区间（1,86400）之间'

    if conf.has_key('timeout'):
        timeout = str(conf.get('timeout'))
        if not timeout.isdigit() or int(timeout) <1 or int(timeout) >86400:
            return False, 'timeout value error'

    # if conf.get('auth_server'):
    #     auth_server = str(conf.get('auth_server'))
    #     if type(auth_server) is not str:
    #         return False, 'auth_server tyep error'

    if conf.has_key('white_mac'):
        white_mac = conf.get('white_mac')
        if type(white_mac) is not list:
            return False, 'white_mac type error'

    if conf.has_key('white_ip'):
        white_ip = conf.get('white_ip')
        if type(white_ip) is not list:
            return False, 'white_ip type error'
        for item in white_ip:
            if not checkip(item):
                return False, 'white_ip error'

    if conf.has_key('black_mac'):
        black_mac = conf.get('black_mac')
        if type(black_mac) is not list:
            return False, 'black_mac type error'

    if conf.has_key('black_ip'):
        black_ip = conf.get('black_ip')
        if type(black_ip) is not list:
            return False, 'black_ip type error'
        for item in black_ip:
            if not checkip(item):
                return False, 'black_ip error'

    if conf.has_key('white_domain'):
        white_domain = conf.get('white_domain')
        if type(white_domain) is not list:
            return False, 'white_domain type error'

    if conf.has_key('black_domain '):
        black_domain = conf.get('black_domain ')
        if type(black_domain) is not list:
            return False, 'white_domain type error'

    if conf.has_key('port'):
        port = str(conf.get('port'))
        if not port.isdigit() or int(port) <=0 or int(port) >=65535:
            return False, u'认证服务器端口填写错误，必须为整形且范围在(0,65535)之间'

    return True, 'success'


def check_snmp(snmps):
    for item in snmps:
        if len(str(item.get('community')).strip()) > 32:
            return False, u'团体名称长度不能超过32位。'
    return True, 'success'



def check_network(conf):
    mode = conf.get('mode')
    if conf.has_key('bridges'):
        bridges = conf.get('bridges')
        if type(bridges) is not list:
            return False, 'bridges is not list'
        else:
            ip_nets_list = []
            br_list = []
            for item in bridges:
                if type(item) is not dict:
                    return False, 'bridge conf is not dict'
                if str(item.get('vlan_switch')) == '1':
                    if item.has_key('vlan') is False:
                        return False, u'vlan 缺失'
                    else:
                        if len(item.get('vlan')) <= 0:
                            return False, u'VLAN透传 开关已经打开，VLAN ID不允许为空！'
                        else:
                            vlans = item.get('vlan')
                            for item_vlan in vlans:
                                if item_vlan.get('ip') and item_vlan.get('mask'):
                                    ip_nets_list.append('%s/%s' % (item_vlan.get('ip'), item_vlan.get('mask')))
                                br_list.append('vbr%s' % item_vlan.get('vlan_id'))
                else:
                    br_list.append(item.get('name'))
                if item.get('mask'):
                    if not checkip(item.get('mask')):
                        return False, 'mask error'
                if item.get('mask') and item.get('ip'):
                    ip_nets_list.append('%s/%s' % (item.get('ip'), item.get('mask')))
                if item.get('interface'):
                    if type(item.get('interface')) is not list or len(item.get('interface')) <1:
                        return False, 'interface error'
            ret, msg = check_br_used(br_list)
            if not ret:
                return False, msg
            ret_check_subnet_rep, msg_check_subnet_rep = check_subnet_rep(ip_nets_list)
            if ret_check_subnet_rep:
                return False, u'分配网段(%s)存在包含关系。请修改ip网段！' % msg_check_subnet_rep
    if conf.has_key('dns_addr'):
        dns_addr = conf.get('dns_addr')
        if type(dns_addr) is not list:
            return False, 'bridges is not list'
        else:
            for item in dns_addr:
                if not checkip(item):
                    return False, 'dns error'

    if conf.has_key('interfaces'):
        interfaces = conf.get('interfaces')
        if type(interfaces) is not list:
            return False, 'interfaces is not list'

    if conf.has_key('gateway'):
        gateway = conf.get('gateway')
        if not checkip(gateway):
            return False, 'gateway is error'

    if conf.has_key('external'):
        external = conf.get('external')
        if type(external) is not list:
            return False, 'external type not list'

    if mode == 'gateway' and conf.get('interfaces'):
        mac_addr = []
        for item in conf.get('interfaces'):
            mac = item.get('mac')
            if mac:
                mac_addr.append(mac)
        if len(mac_addr) != len(set(mac_addr)):
            return False, u'wan口mac地址不允许设置成一样'

    return True, 'success'


def check_webport(webport):
    # if not webport.isdigit():
    #     return False, u'输入的端口不是数值型'
    sys_ports = [443, 28060, 11111]
    if int(webport) != 80 and(int(webport) > 65534 or int(webport) in sys_ports or int(webport) < 1025):
        return False, u'端口不合法！合法端口为80或者在[1025,65534]之间,同时"11111","28060"为系统端口不可用。'
    return True, 'success'


def check_dhcp(conf, now_mode):
    if now_mode == 'bridge':
        return False, u'网桥模式不支持开启DHCP服务！'
    if 'pools' in conf:
        pools_name = []
        pools = conf.get('pools')
        subnet_list = []
        for item in pools:
            pools_name.append(item.get('name'))
            subnet = item.get('subnet')
            netmask = item.get('netmask')
            ranges = item.get('ranges')
            if not ranges:
                return False, u'地址范围至少需要设置一个！'
            subnet_list.append('%s/%s' % (subnet, netmask))
            for item_ranges in ranges:
                start = item_ranges.get('start')
                end = item_ranges.get('end')
                if start == end:
                    return False, u'开始和结束地址不能都为%s' % start
                if IPAddress(start) >= IPAddress(end):
                    item_ranges['start'] = end
                    item_ranges['end'] = start
                if IPRange(item_ranges['start'], item_ranges['end']) not in IPNetwork('%s/%s' % (subnet,sum([bin(int(x)).count("1") for x in netmask.split(".")]))):
                    return False, u'地址范围和IP分配网段不在同一范围内。请检查配置！'
            ret_ip_range_include , msg_ip_range_include =  ip_range_include(ranges)
            if ret_ip_range_include:
                return False, u'%s地址范围存在包含关系。请检查配置！' % msg_ip_range_include
        ret_check_subnet_rep, msg_check_subnet_rep = check_subnet_rep(subnet_list)
        if ret_check_subnet_rep:
            return False, u'IP分配网段(%s)存在包含关系。请修改ip分配网段！' % msg_check_subnet_rep
        if len(pools_name) != len(set(pools_name)):
            return False, u'地址池名称不允许重复'
    if 'hosts' in conf:
        hosts = conf.get('hosts')
        hosts_name = []
        p = re.compile('^[a-zA-Z0-9_]')
        for item in hosts:
            name = item.get('name')
            if not p.match(name) or len(name) > 32:
                return False, u'客户名称由字母数字下划线组成,字母开头,长度不超过32个字符！'
            hosts_name.append(item.get('name'))
        if len(hosts_name) != len(set(hosts_name)):
            return False, u'客户名称不允许重复！'
    return True, 'success'

def check_security(conf):
    ret = True
    msg = 'success'
    if 'web_port' in conf:
        web_port = conf.get('web_port')
        ret, msg = check_webport(web_port)
    return ret, msg

