# -*- coding: utf-8 -*-
import sys
import os
import getopt
import re
import copy

from os.path import dirname
from os.path import abspath

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

from Jhin.jhin import Jhin
from entities.network_entities import Bridge
from entities.network_entities import Interface
from entities.network_entities import Route
from entities.ifinfo import get_all_interfaces, Ifinfo, get_all_normal_interfaces, get_original_mac
from utils.termcolor import color_print
from utils.log import log
import modules.net_service as service

DEFAULT_FILE_NAME = 'network'

jhin = Jhin()
jhin.load_whisper(DEFAULT_FILE_NAME)

logger = log('network.log')
logging = logger.logger


def get_default_bypass():
    return None


def get_current_network_mode():
    global jhin
    return jhin.get('mode')


def build_network():
    """
    read xml file and build network
    :return:
    """
    reset_network()
    mode = get_current_network_mode()
    if mode == 'bridge':
        build_bridge()
    elif mode == 'bypass':
        build_bypass()
    elif mode == 'gateway':
        build_gateway()
    else:
        logging.error('>> ERROR NETWORK MODE IS %s' % mode)
        # gateway_builder.set_default_gateway(jhin.get('gateway'))

    # set default gateway & dns address
    service.make_dns(jhin.get('dns_addr'))

    # build customer route
    build_route()

    rebind_nic()

    sync_mac_address()


def build_gateway():
    global jhin
    print "********* BUILD GATEWAY ***********"
    wan = jhin.get('external')
    # lan = jhin.get('internal')

    # for lan
    lan_cfg = jhin.get('bridges')
    if not check_bridge_setting(lan_cfg):
        print """
            Lan(Bridge) setting not right!
            There is nothing to do!
        """
        return
    for bridge in lan_cfg:
        service.make_bridge(Bridge(bridge))

    # for wan
    wan_cfg = jhin.get('interfaces')
    if not check_bridge_setting(wan_cfg):
        print """
            Wan setting not right!
            There is nothing to do!
        """
        return
    service.make_ipts()
    for interface in wan_cfg:
        if interface['name'] not in wan:
            continue
        service.make_interface(Interface(interface))


def build_bypass():
    global jhin
    print "********* BUILD BYPASS ***********"
    wan = jhin.get('external')

    # for monitor
    monitor_cfg = jhin.get('bridges')
    if not check_bridge_setting(monitor_cfg):
        print """
           MONITOR(Bridge) setting not right!
            There is nothing to do!
        """
        return
    for bridge in monitor_cfg:
        service.make_bridge(Bridge(bridge))

    # for wan
    wan_cfg = jhin.get('interfaces')
    if not check_bridge_setting(wan_cfg):
        print """
            Wan setting not right!
            There is nothing to do!
        """
        return

    for interface in wan_cfg:
        if interface['name'] not in wan:
            continue
        service.make_interface(Interface(interface))


def build_bridge():
    global jhin
    print "********* BUILD BRIDGE ***********"
    br_conf = jhin.get('bridges')
    if not check_bridge_setting(br_conf):
        print """
            Bridge setting not right!
            There is nothing to do!
        """
        return

    for conf in br_conf:
        bridge = Bridge(conf)
        service.make_bridge(bridge)


def check_bridge_setting(br_conf):
    if br_conf is None:
        return False
    if not isinstance(br_conf, list):
        return False
    if len(br_conf) == 0:
        return False
    return True


def build_route():
    global jhin
    print "********* BUILD ROUTE ***********"
    routes = jhin.get('routes')
    if not check_route_setting(routes):
        print """
            Route setting not right!
            There is nothing to do!
        """
        return

    for r in routes:
        route = Route(r)
        service.make_route(route)

    # build default route
    service.make_default_route()


def check_route_setting(route_conf):
    if route_conf is None:
        return False
    if not isinstance(route_conf, list):
        return False
    if len(route_conf) == 0:
        return False
    return True


def reset_network():
    print "********* RESET NETWORK ***********"
    service.clean_all()


def get_interfaces_on_bridge():
    cmd = """ip link show  | grep 'master' | awk '{print($2)}' | sed 's/.*@//g' | sort -u """
    return __generate_list(os.popen(cmd))


def get_interfaces_not_on_bridge():
    interfaces = get_all_normal_interfaces()
    on_bridge_interfaces = get_interfaces_on_bridge()
    for intf1 in on_bridge_interfaces:
        for index, intf2 in enumerate(interfaces):
            if intf1 == intf2:
                interfaces.pop(index)
                break
    return interfaces


def get_interfaces_bridge_map():
    """
    Usage: network.get_all_interface_with_state()

    :return: [('eth0', 'br0'), ('eth1', 'br1')]
    """
    cmd = """ip link show | grep -E 'eth.*br[0-9]' -o | awk '{print $1 $NF}' | sed 's/.*@//g' | sort -u """
    output = os.popen(cmd)
    ls = list()
    while True:
        line = output.readline()
        if line:
            line = line.replace('\n', '')
            temp = line.split(':')
            ls.append((temp[0], temp[1]))
        else:
            break
    return ls


def remove_vlanif(allif):
    temp = copy.deepcopy(allif)
    for intf in allif:
        if "." in intf:
            temp.remove(intf)
    return temp


def remove_lo(allif):
    return allif.remove("lo")


def get_all_interfaces_with_state(state=None):
    """
    Usage: network.get_all_interface_with_state(up)
    Usage: network.get_all_interface_with_state(down)
    Usage: network.get_all_interface_with_state()

    :return: [('eth0', 'UP'), ('eth1', 'DOWN')]
    """
    result = list()
    up = 'UP'
    down = 'DOWN'
    if state is None:
        for item in __get_interface_down():
            result.append((item, down))
        for item in __get_interface_up():
            result.append((item, up))
        return result
    elif state == 'up':
        for item in __get_interface_up():
            result.append((item, up))
        return result
    elif state == 'down':
        for item in __get_interface_down():
            result.append((item, down))
    return result


def get_interface_info(ifname):
    cmd = """ ethtool {ifname} | sed -n '/Speed/p; /Duplex/p; /Link/p' | cut -f2 -d':' """
    infolist = __generate_list(os.popen(cmd.format(ifname=ifname)))
    if len(infolist) != 3:
        return False
    speed = "" if "Unknow" in infolist[0] else re.search("\d+", infolist[0]).group(0)
    duplex = "" if "Unknow" in infolist[1] else infolist[1].lower()
    status = 'up' if infolist[2] == 'yes' else 'down'
    return {"speed": speed, "duplex": duplex, "status": status}


def get_all_interfaces_info():
    info = dict()
    ifaces = get_all_interfaces()
    for iface in ifaces:
        ifinfo = Ifinfo(iface)
        info[ifinfo.ifname] = ifinfo.__dict__
    return info


def get_interface_nickname(ifname, ifnum):
    return {"nickname": "WAN%d" % (ifnum - 1 - int(re.search("\d+$", ifname).group(0)))}


def __get_interface_up():
    cmd = """ip link show | grep 'LOWER_UP' | awk '{print($2)}' | grep -E '@|lo' -v """
    return __generate_list(os.popen(cmd))


def __get_interface_down():
    cmd = """ip link show | grep 'NO-CARRIER' | awk '{print($2)}' | grep -E '@|lo' -v """
    return __generate_list(os.popen(cmd))


def __generate_list(output):
    ls = list()
    while True:
        line = output.readline()
        if line:
            ls.append(line.strip().replace(':', '').replace('\n', ''))
        else:
            break
    return ls


def get_current_network_setting():
    return jhin.get_all_as_json()


def init_network_setting():
    pass


def start_bridge_netfilter():
    stop_bridge_netfilter()
    ip_forward('on')

    path = '/proc/sys/net/bridge'
    reg_list = [
        'bridge-nf-call-iptables',
        'bridge-nf-filter-vlan-tagged',
    ]
    if not os.path.exists(path):
        probe_br_netfilter()
    for file_name in reg_list:
        with open(os.path.join(path, file_name), 'w') as f:
            f.write('1')
            f.flush()
            f.close()


def stop_bridge_netfilter():
    path = '/proc/sys/net/bridge'
    if not os.path.exists(path):
        probe_br_netfilter()
    for file_name in os.listdir(path):
        with open(os.path.join(path, file_name), 'w') as f:
            f.write('0')
            f.flush()
            f.close()


def ip_forward(switch):
    df = '/proc/sys/net/ipv4/ip_forward'
    with open(df, 'w') as f:
        if switch == 'on':
            f.write('1')
        elif switch == 'off':
            f.write('0')


def get_device_unique_symbol():
    pass


def show_mac(intf_name):
    path = '/sys/class/net/{intf_name}'
    if not os.path.exists(path.format(intf_name=intf_name)):
        return '00:00:00:00:00:00'

    cmd = 'cat /sys/class/net/{intf_name}/address'
    output = os.popen(cmd.format(intf_name=intf_name))
    return output.readline().replace('\n', '')


def probe_br_netfilter():
    return os.system('modprobe br_netfilter')


def sync_mac_address():
    print "********* REBIND SYNC MAC ***********"
    # configs
    global jhin
    bridges = jhin.get('bridges')
    interfaces = jhin.get('interfaces')

    if bridges and interfaces:
        color_print('RUN >> get sync config', '[OK]', 0)
    else:
        color_print('RUN >> get sync config', '[FAIL]', 4)
        return

    br_after = list()
    for br in bridges:
        bridge = Bridge(br)
        bridge.mac = show_mac(bridge.name)
        br_after.append(bridge.to_dict())
    # interfaces
    intf_after = list()
    for intf in interfaces:
        interface = Interface(intf)
        if interface.mac == "":
            interface.mac = get_original_mac(interface.name)
        else:
            interface.mac = show_mac(interface.name)
        intf_after.append(interface.to_dict())

    jhin.set(br_after, 'bridges')
    jhin.set(intf_after, 'interfaces')
    logging.info('sync macaddr: %s' % jhin.get_all_as_json())
    jhin.curtain_call()

    color_print('RUN >> sync mac address', '[OK]', 0)


def reset(arg):
    if arg == 'network':
        reset_network()
    elif arg == 'route':
        build_route()
    elif arg == 'dns':
        pass
    else:
        return
    rebind_nic()


def rebind_nic():
    print "********* REBIND NIC ***********"
    cmd = 'nic start'
    before = 'RUN >> nic performance script'
    color_print(before, '[OK]', 0) if os.system(cmd) == 0 else color_print(before, '[FAIL]', 4)


def test():
    print ">> current network mode:", get_current_network_mode()
    print ">> on bridge interfaces:", get_interfaces_on_bridge()
    print ">> not on bridge interfaces:", get_interfaces_not_on_bridge()
    print ">> interface, bridge map:", get_interfaces_bridge_map()
    print ">> show all interfaces:", get_all_interfaces()
    print ">> show all interfaces up", get_all_interfaces_with_state('up')
    print ">> show all interfaces down", get_all_interfaces_with_state('down')
    print ">> show all interfaces info", get_all_interfaces_info()


if __name__ == '__main__':
    try:
        opts, args = getopt.getopt(sys.argv[1:], "", ["start", "stop", "restart", "test", "reset="])
    except getopt.GetoptError as error:
        print(str(error))
        print("Run '%s --usage' for further information" % sys.argv[0])
        sys.exit(1)

    for opt, arg in opts:
        if opt == '--start':
            build_network()
        elif opt == '--stop':
            reset_network()
        elif opt == '--restart':
            build_network()
        elif opt == '--test':
            test()
        elif opt == '--reset':
            reset(arg)
        else:
            print 'WRONG OPTION'
            sys.exit(1)
    sys.exit(0)
