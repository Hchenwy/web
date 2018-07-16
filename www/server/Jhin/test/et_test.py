# -*- coding: utf-8 -*-
import xml.etree.cElementTree as ET
from Jhin.modules import weapons
import dict2xml
import xmltodict
import dicttoxml
import json
# tree = ET.parse('../config/simple.xml')
#
# root = tree.getroot()
#
#
# print 'show root tag & attributes'
# print root.tag, root.attrib
#
# print '\n'
#
# print 'show children tag & attributes'
# for child in root:
#     print child.tag, child.attrib
#
# print '\n'
#
# print 'add element to root'
# china = ET.SubElement(root, 'country', {'name': 'China'})
# rank = ET.SubElement(china, 'rank')
# year = ET.SubElement(china, 'year')
# year = ET.SubElement(china, 'gdppc', {'cc': 'xx'})
network = {
    'mode': 'bridge',  # 其他选项有: bypass, gateway, custom
        # 分别对应: 网桥模式, 旁路模式, 网关模式和自定义模式
    'internal': [

    ],  # 内网接口, 允许的值有 bridge0~2, eth0~5
    'external': [  # 外网接口, 同上
        'bridge0',
        'bridge1',
        'bridge2'
    ],
    'bridges': [
        {  # 因为是简单配置, 因此只有bridge0的配置
            'name': 'br0',  # 约定名字br0
            'ip': '192.168.1.1',  # >>对应页面上的 '网桥IP地址'
            'mask': '255.255.255.0',  # >>对应页面上的 '子网掩码'
            'mac': '08:00:27:70:CD:1A',
            # 网桥下绑定的接口
            'interface': [
                'eth0',
                'eth1',
                'eth2',
                'eth3',
                'eth4',
                'eth5'
            ],
            'vlan': [
                '100',
                '200'
            ]
        },
        {
            'name': 'br1',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:2A',
            'interface': [],
            'vlan': []
        },
        {
            'name': 'br2',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:3A',
            'interface': [],
            'vlan': []
        }
    ],
    'gateway': '192.168.1.254',  # >>对应页面上的 '网关地址'
    # >>对应页面上的 'DNS1和DNS2'
    'dns_addr': [
        '8.8.8.8',
        '8.8.6.6'
    ],
    ################### 这部分是冗余配置, 为以后其他功能做准备
    'interfaces': [
        {
            'name': 'eth0',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:4A',
        },
        {
            'name': 'eth1',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:5A',
        },
        {
            'name': 'eth2',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:6A',
        },
        {
            'name': 'eth3',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:7A',
        },
        {
            'name': 'eth4',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:8A',
        },
        {
            'name': 'eth5',
            'ip': '',
            'mask': '',
            'mac': '08:00:27:70:CD:9A',
        }
    ]
}

# root = ET.Element('magazine')
# print weapons.prettify(root)
print dict2xml.dict2xml(network, wrap='magazine')

print 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
# print json.dumps(xmltodict.parse(dict2xml.dict2xml(network, wrap='magazine')))
print xmltodict.parse(dict2xml.dict2xml(network, wrap='magazine'))
# tree.write("../config/simple.xml")

print 'bbbbbbbbbbb'

print dicttoxml.dicttoxml(network, custom_root='magazine')



