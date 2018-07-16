# coding: utf-8
from Jhin.jhin import Jhin


def fix_snmp_conf():
    jhin = Jhin()
    jhin.load_whisper('snmp_ipmac')
    conf = jhin.get_all()
    if conf. has_key('snmp') and conf.get('snmp') and type(conf.get('snmp')[0]) is not dict:  # old {'snmp':[192.168.1.1,...]} new {'snmp':[{ip:123.2.,commit:122}...]}
        snmp = conf.get('snmp')
        new_list = []
        for item in snmp:
            snmp_dict = {}
            snmp_dict['ip'] = item
            snmp_dict['community'] = 'public'
            new_list.append(snmp_dict)
        jhin.add("snmp", new_list)
        jhin.curtain_call()
