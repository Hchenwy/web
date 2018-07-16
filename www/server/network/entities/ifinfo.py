#!/usr/bin/env python
# -*- coding: utf-8 -*-

import netifaces as ni
import os
import utils.rio as rio

INFO_PATH = "/sys/class/net"


class Ifinfo():
    def __init__(self, ifname):
        self.status = ''
        self.ip = ''
        self.mask = ''
        self.mac = ''
        self.tx = ''
        self.rx = ''
        self.mtu = ''
        self.speed = ''
        self.duplex = ''
        self.uptime = ''
        self.type = ''
        self.ifname = ifname
        self.gateway = ''
        self.__gen_info()

    def __gen_info(self):
        # validate interface
        if self.ifname not in ni.interfaces():
            return

        # one interface only has one ip address in our system
        info = ni.ifaddresses(self.ifname)
        if ni.AF_INET in info:
            self.ip = info[ni.AF_INET][0]['addr']
            self.mask = info[ni.AF_INET][0]['netmask']
        if ni.AF_LINK in info:
            self.mac = info[ni.AF_LINK][0]['addr']

        # gen info from file system
        path = os.path.join(INFO_PATH, self.ifname)
        if os.path.exists(path):
            self.status = rio.readaline(os.path.join(path, 'operstate'), default='')
            if self.status == 'up' or 'ppp' in self.ifname:
                mtu = rio.readaline(os.path.join(path, 'mtu'), default='')
                self.mtu = int(mtu) if mtu.isdigit() else mtu
                self.duplex = rio.readaline(os.path.join(path, 'duplex'), default='')
                self.speed = rio.readaline(os.path.join(path, 'speed'), default='')

                self.tx = rio.readaline(os.path.join(path, 'statistics', 'tx_bytes'), default='')
                self.rx = rio.readaline(os.path.join(path, 'statistics', 'rx_bytes'), default='')

        # generate gateway
        if 'ppp' in self.ifname:
            from network.modules.builders import RouteBuilder
            builder = RouteBuilder()
            k_routes = builder.show_kernel()
            if self.ip in k_routes:
                self.gateway = k_routes.get(self.ip)


def get_all_interfaces():
    return ni.interfaces()


def get_all_bridge_interfaces():
    result = []
    for iface in get_all_interfaces():
        if 'br' in iface:
            result.append(iface)
    return result


def get_all_vlan_interfaces():
    result = []
    for iface in get_all_interfaces():
        if '.' in iface:
            result.append(iface)
    return result


def get_all_normal_interfaces():
    result = []
    for iface in get_all_interfaces():
        if 'eth' in iface and 'ppp' not in iface:
            result.append(iface)
    for vlan in get_all_vlan_interfaces():
        if vlan in result:
            result.remove(vlan)
    return result


def get_interface_mac(ifname):
    if ni.ifaddresses(ifname):
        return ni.ifaddresses(ifname)[ni.AF_LINK][0]['addr']


def get_original_mac(ifname):
    if ifname not in get_all_normal_interfaces():
        return "00:00:00:00:00:00"
    cmd = "ethtool -P %s | grep -E '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})' -o"
    return rio.sys_output_line(os.popen(cmd % ifname))


if __name__ == '__main__':
    print get_original_mac('p8p1')
