# -*- coding: utf-8 -*-
def up_15_network(jhin):
    # get gateway & dns address
    bridges = jhin.get('bridges')
    gateway = ""
    dns_addr = []
    for br in bridges:
        if br.get('name', '') == 'br0':
            # print br
            gateway = br.get('gateway', '')
            dns_addr = br.get('dns', ['114.114.114.114'])
            # delete gateway & dns_addr
            br.pop('gateway', '')
            br.pop('dns', '')

        # vlan
        # reset switch as zero & vlan as []
        br['vlan_switch'] = '0'
        br['vlan'] = []

    routes = [{"ip": "0.0.0.0", "mask": "0.0.0.0", "next_route": gateway}]
    jhin.delete('gateway')
    jhin.add('routes', routes)
    jhin.add('dns_addr', dns_addr)
    jhin.add('bridges', bridges)

    jhin.curtain_call()
