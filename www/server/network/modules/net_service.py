import builders
from utils.net_tools import get_network_address
from utils.net_tools import netmask_to_cidr
from utils.termcolor import color_print
from network.entities.ifinfo import get_interface_mac, get_original_mac, get_all_normal_interfaces

br_builder = builders.BridgeBuilder()
if_builder = builders.InterfaceBuilder()
ipts_builder = builders.IPTSBuilder()
dns_builder = builders.DNSBuilder()
route_builder = builders.RouteBuilder()
vlan_builder = builders.VLANBuilder()


def make_bridge(bridge):
    if not bridge.check_self():
        color_print('CHECK BRIDGE ERROR', '[PASS]', 0)
        return

    # set the bridge
    br_builder.add(bridge.name)
    if bridge.ip == "":
        if_builder.remove(bridge.name)
    elif bridge.ip != '' and bridge.mask != '':
        if_builder.add(bridge.name, bridge.ip, bridge.mask)
    if_builder.up(bridge.name)

    # add interfaces
    for intf in bridge.interface:
        br_builder.addif(bridge.name, intf)
        if_builder.up(intf)

    # generate vlan
    if bridge.vlan_switch == '0':
        return

    vintfs = list()
    for v in bridge.vlan:
        # generate v interfaces
        for intf in bridge.interface:
            vlan_builder.add(intf, v.vlan_id)
            if_name = '%s.%s' % (intf, v.vlan_id)
            if_builder.up(if_name)
            vintfs.append(if_name)

        # build vlan bridge
        vbr_name = 'vbr{vid}'.format(vid=v.vlan_id)
        br_builder.add(vbr_name)
        if_builder.up(vbr_name)
        if_builder.add(vbr_name, v.ip, v.mask)

        for vif in vintfs:
            br_builder.addif(vbr_name, vif)

        # clear list for next loop
        vintfs = list()


def make_vlan(vlan):
    pass


def make_dns(dnslist):
    for dns in dnslist:
        dns_builder.add(dns)


def make_route(route):
    if not route.check_self():
        color_print('CHECK ROUTE ERROR', '[PASS]', 0)
        return

    net_addr = get_network_address(route.ip, route.mask)
    cidr = netmask_to_cidr(route.mask)

    # default route
    if net_addr == '0.0.0.0':
        default = route_builder.show_default()
        if default is not None:
            if route.next_route in route_builder.show_default():
                color_print('DEFAULT ROUTE ALREADY EXIST', '[PASS]', 0)
                return
            else:
                route_builder.remove(route.ip, route.mask)

    # static route
    static_route = route_builder.show_static()
    routeaddr = '{net_addr}/{cidr}'.format(net_addr=net_addr, cidr=cidr)
    if routeaddr in static_route:
        route_builder.remove(route.ip, route.mask)

    if route.name == '':
        route_builder.add(route.ip, route.mask, route.next_route)
    else:
        pass


def make_default_route():
    route_builder.add_default()


def make_ipts():
    ipts_builder.remove()
    ipts_builder.add_chain()
	
def make_interface(interface):
    if interface.proto == 'bypass':
        flag = if_builder.add(interface.name, interface.ip, interface.mask)
        status = 'BYPASS'
        if flag:
            color_print('CONFIG %s MODE' % status, '[OK]', 0)
        else:
            color_print('CONFIG %s MODE' % status, '[FAIL]', 4)
    else:
        # interface advanced config
        if interface.mac == "":
            interface.mac = get_original_mac(interface.name)
        if_builder.add_mac(interface.name, interface.mac)
        if_builder.add_mtu(interface.name, interface.mtu)

        #interface rate config
        if interface.rate == 'auto':
            if_builder.add_rate_auto(interface.name)
        else:
            if '-' in interface.rate:
                dulplex = interface.rate.split('-')[0]
                speed = interface.rate.split('-')[1]
                if_builder.add_rate(interface.name, speed, dulplex)

        # interface basic config
        if_builder.up(interface.name)

        if interface.proto == 'static':
            flag = if_builder.add(interface.name, interface.ip, interface.mask)
            status = 'STATIC'
        elif interface.proto == 'dhcp':
            flag = if_builder.add_dhcp(interface.name, interface.metric)
            status = 'DHCP'
        elif interface.proto == 'pppoe':
            flag = if_builder.add_pppoe(interface.name, interface.username, interface.password)
            status = 'PPPOE'
        else:
            color_print('CONFIG PROTO WRONG', '[FAIL]', 4)
            return

        if flag:
            color_print('CONFIG %s MODE' % status, '[OK]', 0)
        else:
            color_print('CONFIG %s MODE' % status, '[FAIL]', 4)

        # build nat rules
        if interface.proto == 'pppoe':
            interface.name = 'ppp-' + interface.name
        ipts_builder.add_rule(interface.name)


def clean_interface():
    for ifname in get_all_normal_interfaces():
        #if_builder.down(ifname)
        if_builder.remove(ifname)


def clean_bridges():
    for br in br_builder.show_all():
        if_builder.down(br)
        br_builder.remove(br)


def clean_routes():
    route_builder.flush()


def clean_dns():
    dns_builder.flush()


def clean_vlans():
    for vlan in vlan_builder.show_all():
        vlan_builder.remove(vlan)


def clean_all():
    clean_bridges()
    clean_routes()
    clean_dns()
    clean_vlans()
    clean_interface()


if __name__ == '__main__':
    print 'br', br_builder.show_all()
    print 'vlan', vlan_builder.show_all()
    print 'route', route_builder.show_all()
    print 'route static', route_builder.show_static()
    print 'dns', dns_builder.show_all()
