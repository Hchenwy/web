# -*- coding: utf-8 -*-
from netaddr import IPAddress
from netaddr import IPNetwork
from netaddr import IPRange


def ipmask2num(ip, mask):
    """
    192.168.1.1/255.255.255.0 -> 192.168.1.0/24
    :param ip:
    :param mask:
    :return:
    """
    return IPNetwork('%s/%s' % (ip, mask)).cidr


def is_subnet_include(ori_subnet, be_checked):
    """
    检查网段是否被包含或者将包含其他网段
    :param ori_subnet: 已经存在的网段 192.168.1.1/255.255.0  或者  192.168.1.1/24
    :param be_checked: 需要进行检查的网段 192.168.1.1/255.255.0  或者  192.168.1.1/24
    :return: bool
    """
    return IPNetwork(ori_subnet) in IPNetwork(be_checked) or IPNetwork(be_checked) in IPNetwork(ori_subnet)


def is_ip_in_subnet(ip, subnet):
    """
    检测ip是否在网段内
    :param ip: 192.168.1.1
    :param subnet: 192.168.1.1/255.255.255.0  (192.168.1.0/24)
    :return:bool
    """
    return IPAddress(ip) in IPNetwork(subnet)

# from Jhin.jhin import Jhin
if __name__ == '__main__':
    a = IPNetwork('192.168.1.1/255.255.0.0')
    print a.ipv4() # 192.168.1.1/24
    print a.broadcast # 192.168.1.255
    print a.ip # 192.168.1.1
    print a.cidr # 192.168.1.0/24
    print a.hostmask # 0.0.0.255
    print a.ipv6() # ::ffff:192.168.1.1/120
    print a.is_ipv4_compat() # False
    print a.is_ipv4_mapped()# False
    print a.netmask # 255.255.255.0
    print a.network # 192.168.1.0
    b = IPNetwork('192.168.3.2/255.255.255.0')
    print b in a  # 判断网段包含
    print '---------IPAddress----------------'
    c = IPAddress('192.168.1.1')
    print c in b # 判断ip是否在网段内
    print '---------IPRange-------------------'
    d = IPRange(start='192.168.1.2', end='192.168.1.100')
    e = IPRange(start='192.168.1.100', end='192.168.1.200')
    print d.size # 99包含多少个ip
    print set(d).intersection(set(e)) # 两个ip断的交集set([IPAddress('192.168.1.100')])
