# -*- coding:utf-8 -*-
from network.modules.builders import BridgeBuilder
from network.modules.builders import VLANBuilder
from network.modules.builders import InterfaceBuilder
from network.modules.builders import RouteBuilder
import utils.checker as checker


class Bridge(object):
    def __init__(self, data=None):
        if not data:
            data = {}
        try:
            self.name = data.get('name', '')
            self.ip = data.get('ip', '')
            self.mask = data.get('mask', '')
            self.mac = data.get('mac', '')
            self.vlan_switch = data.get('vlan_switch', '')
            self.mtu = data.get('mtu', '')
            self.vlan = data.get('vlan', [])
            self.interface = data.get('interface', [])

            # init vlan
            vlan_list = list()
            for v in self.vlan:
                vlan_list.append(Vlan(v))

            self.vlan = vlan_list

        except TypeError:
            raise TypeError('Parse entity error')

    def check_self(self):
        if not checker.is_str_value(self.name):
            return False
        if len(self.interface) == 0:
            return False
        for v in self.vlan:
            if not v.check_self():
                return False
        return True

    def to_dict(self):
        vlan_list = list()
        for v in self.vlan:
            vlan_list.append(v.to_dict())

        self.vlan = vlan_list
        return self.__dict__


class Interface(object):
    def __init__(self, data=dict):
        try:
            self.ip = parse_expected_value(data, 'ip', 'str')
            self.mac = parse_expected_value(data, 'mac', 'str')
            self.mask = parse_expected_value(data, 'mask', 'str')
            self.name = parse_expected_value(data, 'name', 'str')
            self.proto = parse_expected_value(data, 'proto', 'str')
            self.username = parse_expected_value(data, 'username', 'str')
            self.password = parse_expected_value(data, 'password', 'str')
            self.mtu = parse_expected_value(data, 'mtu', 'str')
            self.mode = parse_expected_value(data, 'mode', 'str')
            self.rate = parse_expected_value(data, 'rate', 'str')
            self.metric = parse_expected_value(data, 'metric', 'str')
            self.isp = parse_expected_value(data, 'isp', 'str')
            self.downbw = parse_expected_value(data, 'downbw', 'int')
            self.upbw = parse_expected_value(data, 'upbw', 'int')
        except TypeError:
            raise TypeError('Parse entity error')

    def to_dict(self):
        return self.__dict__

    def make_self(self):
        pass

    def suicide(self):
        pass


class Vlan(object):
    def __init__(self, data=dict):
        try:
            self.vlan_id = parse_expected_value(data, 'vlan_id', 'str')
            self.ip = parse_expected_value(data, 'ip', 'str')
            self.mask = parse_expected_value(data, 'mask', 'str')
        except TypeError:
            raise TypeError('Parse entity error')

    def check_self(self):
        if not checker.is_vlan_id(self.vlan_id) or not checker.is_m_ipv4_address(self.ip, self.mask):
            return False
        return True

    def to_dict(self):
        return self.__dict__


class Route(object):
    def __init__(self, data=dict):
        try:
            self.ip = parse_expected_value(data, 'ip', 'str')
            self.mask = parse_expected_value(data, 'mask', 'str')
            self.next_route = parse_expected_value(data, 'next_route', 'str')
            self.name = parse_expected_value(data, 'name', 'str')
        except TypeError:
            raise TypeError('Parse entity error')

    # # def make_self(self):
    # #     if self.ip == '0.0.0.0' and self.mask == '0.0.0.0':
    # #         self.route_builder.set_default_gateway(self.next_route)
    # #         return
    # #
    # #     self.route_builder.add_route(self.ip, self.mask, self.next_route)
    #
    # def suicide(self):
    #     self.route_builder.del_route(self.ip, self.mask)

    def check_self(self):
        if not checker.is_m_ipv4_address(self.ip, self.mask, self.next_route):
            return False
        return True

    def to_dict(self):
        return self.__dict__


def parse_expected_value(dictionary, key, value_type="str"):
    """
    not use anymore!!
    :param dictionary:
    :param key:
    :param value_type:
    :return:
    """
    if not isinstance(dictionary, dict):
        return None

    if dictionary.has_key(key):
        return dictionary.get(key)
    else:
        result = None
        exec "result = {value_type}()".format(value_type=value_type)
        return result
