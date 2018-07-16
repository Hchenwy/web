# -*- coding: utf-8 -*-
import os

import config.global_conf as gc
import utils.rio as rio
from utils.termcolor import color_print
from utils.net_tools import netmask_to_cidr
from utils.net_tools import get_network_address


class Builder(object):
    ADD = ''
    DEL = ''
    SHOW = ''

    def add(self, *var):
        pass

    def remove(self, *var):
        pass

    def show_all(self):
        return rio.sys_output_list(os.popen(self.SHOW))


def __write_log(msg):
    logging = gc.get_logging('network')
    debug = gc.get_debug('network')
    if debug:
        logging.info(msg)


def run_cmd(cmd):
    flag = os.system(cmd)

    __write_log('builder run >> %s >> state %s' % (cmd, flag))

    if flag == 0:
        color_print('RUN >> ' + cmd, '[OK]', 0)
        return True
    else:
        color_print('RUN >> ' + cmd, '[FAIL]', 4)
        return False


class BridgeBuilder(Builder):
    ADD = 'brctl addbr {bridge_name}'
    DEL = 'brctl delbr {bridge_name}'
    ADD_IF = 'brctl addif {bridge_name} {intf_name}'
    DEL_IF = 'brctl delif {bridge_name} {intf_name}'
    SHOW = '''brctl show | cut -f1 | sed '1d' | sed '/^$/d' '''

    def __init__(self):
        self.interface_builder = InterfaceBuilder()

    def add(self, bridge_name):
        run_cmd(self.ADD.format(bridge_name=bridge_name))

    def remove(self, bridge_name):
        run_cmd(self.DEL.format(bridge_name=bridge_name))

    def addif(self, bridge_name, interface):
        run_cmd(self.ADD_IF.format(bridge_name=bridge_name, intf_name=interface))

    def delif(self, bridge_name, interface):
        run_cmd(self.DEL_IF.format(bridge_name=bridge_name, intf_name=interface))


class VLANBuilder(Builder):
    ADD = 'vconfig add {intf_name} {vlan_id}'
    DEL = 'vconfig rem {vlan_name}'
    SHOW = '''cat /proc/net/vlan/config | sed '1,2d' | cut -f1 -d' ' '''

    def __init__(self):
        pass

    def add(self, interface, vlanid):
        run_cmd(self.ADD.format(intf_name=interface, vlan_id=vlanid))

    def remove(self, interface):
        run_cmd(self.DEL.format(vlan_name=interface))


class InterfaceBuilder(Builder):
    ADD = 'ifconfig {intf_name} {ip_addr} netmask {netmask}'
    ADD_DHCP = 'dhcpctl start {intf_name} {metric}'
    ADD_PPPOE = 'pppoectl start {intf_name} {username} {password}'
    DEL = 'ifconfig {intf_name} 0.0.0.0'
    DEL_DHCP = 'dhcpctl stop {intf_name}'
    DEL_PPPOE = 'pppoectl stop {intf_name}'
    ADV = "ifconfig {intf_name} mtu {mtu} hw ether {mac}"
    UP = 'ifconfig {intf_name} up'
    DOWN = 'ifconfig {intf_name} down'
    SHOW = ''' cat /proc/net/dev | awk '{print $1}' | sed -e '1,2d' -e 's/://' '''

    ADD_MAC = 'ifconfig {intf_name} hw ether {mac}'
    ADD_MTU = 'ifconfig {intf_name} mtu {mtu}'
    ADD_RATE = 'ethtool -s {intf_name} speed {speed} duplex {duplex}'
    ADD_RATE_AUTO = 'ethtool -s {intf_name} autoneg on'

    def __init__(self):
        pass

    def add(self, interface, ip_addr, netmask):
        return run_cmd(self.ADD.format(intf_name=interface, ip_addr=ip_addr, netmask=netmask))

    def add_dhcp(self, interface, metric):
        return run_cmd(self.ADD_DHCP.format(intf_name=interface, metric=metric))

    def add_pppoe(self, interface, username, password):
        return run_cmd(self.ADD_PPPOE.format(intf_name=interface, username=username, password=password))

    def add_mac(self, interface, macaddr):
        return run_cmd(self.ADD_MAC.format(intf_name=interface, mac=macaddr))

    def add_mtu(self, interface, mtu):
        return run_cmd(self.ADD_MTU.format(intf_name=interface, mtu=mtu))

    def adv(self, interface, mtu, mac):
        return run_cmd(self.ADV.format(intf_name=interface, mtu=mtu, mac=mac))

    def add_rate(self, interface, speed, duplex):
        return run_cmd(self.ADD_RATE.format(intf_name=interface, speed=speed, duplex=duplex))

    def add_rate_auto(self, interface):
        return run_cmd(self.ADD_RATE_AUTO.format(intf_name=interface))

    def remove(self, interface):
        run_cmd(self.DEL.format(intf_name=interface))
        run_cmd(self.DEL_DHCP.format(intf_name=interface))
        run_cmd(self.DEL_PPPOE.format(intf_name=interface))

    def up(self, interface):
        return run_cmd(self.UP.format(intf_name=interface))

    def down(self, interface):
        return run_cmd(self.DOWN.format(intf_name=interface))


class IPTSBuilder(Builder):
    ADD_CHAIN = 'iptables -w -t nat -N postrouting_nat && iptables -w -t nat -A POSTROUTING -j postrouting_nat;iptables -w -t mangle -N mssfix && iptables -w -t mangle -A FORWARD -j mssfix'
    ADD_NAT = 'iptables -w  -t nat -A postrouting_nat -o {intf_name} -j MASQUERADE'
    ADD_MANGLE1 = 'iptables -w -t mangle -A mssfix -o {intf_name} -p tcp -m tcp --tcp-flags SYN,RST SYN -m comment --comment "{intf_name} (mtu_fix)" -j TCPMSS --clamp-mss-to-pmtu'
    ADD_MANGLE2 = 'iptables -w -t mangle -A mssfix -i {intf_name} -p tcp -m tcp --tcp-flags SYN,RST SYN -m comment --comment "{intf_name} (mtu_fix)" -j TCPMSS --clamp-mss-to-pmtu'
    DEL_NAT = 'iptables -t nat -D POSTROUTING -j postrouting_nat;iptables -w -t nat -F postrouting_nat;iptables -w -t nat -X postrouting_nat'
    DEL_MANGLE = 'iptables -t mangle -D FORWARD -j mssfix;iptables -w -t mangle -F mssfix;iptables -w -t mangle -X mssfix'

    def __init__(self):
        pass
		
    def add_chain(self):
		run_cmd(self.ADD_CHAIN.format())
	
    def add_rule(self, interface):
        run_cmd(self.ADD_NAT.format(intf_name=interface))
        run_cmd(self.ADD_MANGLE1.format(intf_name=interface))
        run_cmd(self.ADD_MANGLE2.format(intf_name=interface))
		
    def remove(self):
        run_cmd(self.DEL_NAT.format())
        run_cmd(self.DEL_MANGLE.format())


class DNSBuilder(Builder):
    DNS_PATH = gc.get_module_conf('network').get('dns_path')
    ADD = 'nameserver {server}'
    SHOW = 'cat {path}'.format(path=DNS_PATH)

    def __init__(self):
        pass

    def add(self, server):
        rio.append(self.DNS_PATH, self.ADD.format(server=server))

    def flush(self):
        rio.flush(self.DNS_PATH)


class RouteBuilder(Builder):
    ADD = 'ip route add {route}/{cidr} via {next_step}'
    ADD_DEFAULT = 'flock 3 -c /bin/defaultroute'
    DEL = 'ip route del {route}/{cidr}'
    FLUSH = ''' ip route flush all '''
    SHOW = ''' ip route show | grep default -v | cut -f1 -d' ' '''
    SHOW_DEFAULT = ''' ip route show | grep default | cut -f3 -d' ' '''
    SHOW_STATIC = ''' ip route show | grep default -v | grep kernel -v | cut -f1 -d' ' '''
    SHOW_KERNEL = ''' ip route show | grep kernel '''

    def __init__(self):
        pass

    def add(self, route, netmask, next_step):
        route = get_network_address(route, netmask)
        run_cmd(self.ADD.format(route=route, cidr=netmask_to_cidr(netmask), next_step=next_step))

    def add_default(self):
        run_cmd(self.ADD_DEFAULT.format())

    def remove(self, route, netmask):
        route = get_network_address(route, netmask)
        run_cmd(self.DEL.format(route=route, cidr=netmask_to_cidr(netmask)))

    def show_all(self):
        ls = rio.sys_output_list(os.popen(self.SHOW))
        ls.append('0.0.0.0/0')
        return ls

    def show_default(self):
        default = rio.sys_output_list(os.popen(self.SHOW_DEFAULT))
        if len(default) == 0:
            return
        return default

    def show_static(self):
        return rio.sys_output_list(os.popen(self.SHOW_STATIC))

    def show_kernel(self):
        ls = rio.sys_output_list(os.popen(self.SHOW_KERNEL))
        temp = {}
        for l in ls:
            l = l.split(' ')
            temp[l[len(l) - 1]] = l[0]
        return temp

    def flush(self):
        run_cmd(self.FLUSH)


def print_cmd(cmd):
    print 'cmd', cmd
