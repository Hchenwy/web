# -*- coding: utf-8 -*-
from Jhin.jhin import Jhin


# 网络使用类
class NetworkUsed(object):
    def __init__(self):
        self.jhin = Jhin()

    def check_br_used_by_auth(self, brs):
        """
        检测是否使用了brs中的br口
        :param brs: [br0, br1, vbr10]
        :return:
        """
        self.jhin.load_whisper('auth')
        used_br = self.jhin.get('interface')
        return list(set(used_br).intersection(set(brs)))  # 交集 [1,3].intersection[1,2] = [1]

    def check_br_used_by_out_ctrl(self, brs):
        """
        检测外网访问控制是否使用了brs中的口
        :param brs:
        :return:
        """
        self.jhin.load_whisper('security')
        out_ctrl = self.jhin.get('out_ctrl')
        used_br = []
        if not out_ctrl:
            return []
        for item in out_ctrl:
            used_br += item.get('net')
        return list(set(used_br).intersection(set(brs)))  # 交集 [1,3].intersection[1,2] = [1], 存在的交集即是使用的要被删除的

    def check_wans_used_by_dmz(self, wans):
        """
        检测将要删除的wan口是否被dmz使用
        :param wans:
        :return:
        """
        self.jhin.load_whisper('netserver')
        netserver = self.jhin.get('netserver')
        used_wans = []
        if not netserver:
            return []
        for item in netserver:
            used_wans.append(item.get('wan_net'))
        return list(set(used_wans).intersection(set(wans)))  # 交集 [1,3].intersection[1,2] = [1], 存在的交集即是使用的要被删除的

    # todo 如果有其它模块使用接口的，则往下增加函数


    def deled_brs(self, br_list):
        """
        根据将要配置的br获取将要被删除的br口
        :param br_list:
        :return:
        """
        self.jhin.load_whisper('network')
        old_br = self.jhin.get('bridges')
        old_br_list = []
        for item in old_br:
            if str(item.get('vlan_switch')) == '1':
                for item_vlan in item.get('vlan'):
                    old_br_list.append('vbr%s' % item_vlan.get('vlan_id'))
            else:
                old_br_list.append(item.get('name'))
        return list(set(old_br_list).difference(br_list))  # [1,3].difference[1,2] = [3] 所以3是减少的


# 对象使用类
class ObjectUsed(object):
    def __init__(self):
        self.jhin = Jhin()

    def load_whisper(self, obj_name):
        self.obj_name = obj_name.split('_')[0]
        self.jhin.load_whisper(obj_name)
        self.objs = self.jhin.get(self.obj_name)

    def deled_objs(self, obj_list):
        """
        根据传入的对象列表和原有的对象列表做对比，算出删除的对象
        :param obj_list:
        :return:
        """
        if not self.objs:
            return list()
        old_objs_name = list()
        for item in self.objs:
            old_objs_name.append(item.get('name'))
        return list(set(old_objs_name).difference(obj_list))  # [1,3].difference[1,2] = [3] 所以3是减少的

    def check_time_used_by_acl(self, deled_objs):
        """
        检测将要删除的对象中被acl使用的对象,acl只用了时间对象
        :param deled_objs:
        :return:
        """
        self.jhin.load_whisper('security')
        acl_objs = self.jhin.get('acl')
        if not acl_objs:
            return list()
        used_times = list()
        for item in acl_objs:
            used_times.append(item.get('time'))
        return list(set(used_times).intersection(set(deled_objs)))  # 交集 [1,3].intersection[1,2] = [1], 存在的交集即是使用的要被删除的

    def check_objs_used_by_out_ctrl(self, obj_type, deled_objs):
        """
        检测将要删除的对象中被out_ctrl使用的对象
        :param obj_type:  可能使用ip /domain / mac
        :param deled_objs:
        :return:
        """
        self.jhin.load_whisper('security')
        out_ctrls = self.jhin.get('out_ctrl')
        if not out_ctrls:
            return list()
        used_objes = list()
        for item in out_ctrls:
            if item.get('type') == obj_type:
                used_objes += item.get('object')
        return list(set(used_objes).intersection(set(deled_objs)))  # 交集 [1,3].intersection[1,2] = [1], 存在的交集即是使用的要被删除的

    # todo 如果有其它模块的使用对象的往下面加模块使用函数，如流控

    ################## 对象相等比较 ############################
    def cmp_time_obj(self, t1, t2):
        """
        在对象名相同的情况下，比较两个时间对象是否相等
        :param t1:  {"clock": [ "0:00-23:59"], "name": "time1", "weekdays": "1,2,4,5,6,7" }
        :param t2: {"clock": [ "0:00-23:59"], "name": "time1", "weekdays": "1,2,4,5,6" }
        :return:
        """
        t1.get('clock').sort()
        t2.get('clock').sort()
        if cmp(t1, t2) == 0:
            return True
        else:
            return False

    def cmp_domain_obj(self, d1, d2):
        """
        在对象名相同的情况下，比较两个时间对象是否相等
        :param d1:  { "name": "domain_group1","value": ["www.baidu.com", "www.163.com","192.168.1.18"] }
        :param d2:  { "name": "domain_group1","value": ["www.baidu.com", "www.163.com","192.168.1.19"] }
        :return:
        """
        d1.get('value').sort()
        d2.get('value').sort()
        if cmp(d1, d2) == 0:
            return True
        else:
            return False

    def cmp_ip_obj(self, ip1, ip2):
        """
        在对象名相同的情况下，比较两个时间对象是否相等
        :param ip1: {"name":"ip_group1","ip_sigle": ["192.168.1.6"],"ip_range": ["192.168.1.28 192.168.1.68"], "ip_net": ["192.168.1.0 255.255.255.0"]}
        :param ip2:{"name":"ip_group1","ip_sigle": ["192.168.1.6"],"ip_range": ["192.168.1.28 192.168.1.69"], "ip_net": ["192.168.1.0 255.255.255.0"]}
        :return:
        """
        ip1.get('ip_sigle').sort()
        ip2.get('ip_sigle').sort()

        ip1.get('ip_range').sort()
        ip2.get('ip_range').sort()

        ip1.get('ip_net').sort()
        ip2.get('ip_net').sort()

        if cmp(ip1, ip2):
            return True
        else:
            return False

    def cmp_mac_obj(self, m1, m2):
        """
        在对象名相同的情况下，比较两个时间对象是否相等
        :param m1:  { "name": "mac_group1","value": ["00:01:02:03:04:05", "00:11:22:33:44:77"] }
        :param m2:  { "name": "mac_group1","value": ["00:01:02:03:04:05", "00:11:22:33:44:77"] }
        :return:
        """
        m1.get('value').sort()
        m2.get('value').sort()
        if cmp(m1, m2) == 0:
            return True
        else:
            return False

    def cmp_app_obj(self, a1, a2):
        """
        在对象名相同的情况下，比较两个时间对象是否相等
        :param a1:  {"name": "app1","protocol": "tcp","rule_type": "srcip_dstip","father_class": "email","srcip": "192.168.1.1","dstip": "10.10.10.10",srcport": 5489,"dstport": 6869}
        :param a2: {"name": "app1","protocol": "tcp","rule_type": "srcip_dstip","father_class": "email","srcip": "192.168.1.1","dstip": "10.10.10.10",srcport": 5489,"dstport": 6869}
        :return:
        """
        if cmp(a1,a2) == 0:
            return True
        else:
            return False

    def cmp_obj(self, obj1, obj2):
        if self.obj_name == 'app':
            return self.cmp_app_obj(obj1, obj2)
        if self.obj_name == 'time':
            return self.cmp_time_obj(obj1, obj2)
        if self.obj_name == 'ip':
            return self.cmp_ip_obj(obj1, obj2)
        if self.obj_name == 'domain':
            return self.cmp_domain_obj(obj1, obj2)
        if self.obj_name == 'mac':
            return self.cmp_mac_obj(obj1, obj2)







