# -*- coding: utf-8 -*-
# ipsec相关文件配置转换

from utils.netaddr_tools import ipmask2num


def convert_ipsec2conf(conf):
    conf_str = 'config setup\n' \
               '  charondebug="net 1, ike 1, lib 1, cfg 1"\n' \
               'conn %default\n' \
               '  rekeymargin=3m\n' \
               '  keyingtries=%forever\n' \
               '  keyexchange=ikev1\n' \
               '  authby=psk\n' \
               '  dpdaction=restart\n' \
               '  dpddelay=5\n' \
               '  dpdtimeout=15\n' \
               '  rekey=yes\n'
    secrets_str = ''
    for item in conf:
        subnet = item.get('subnet')
        name = item.get('name')
        auth_enable = str(item.get('auth_enable'))
        rightid = item.get('rightid')
        leftid = item.get('leftid')
        if item.get('right_authmode') == 'FQDN' and rightid:
            rightid = '@'+ rightid
        if item.get('left_authmode') == 'FQDN' and leftid:
            leftid = '@' + leftid
        len_subnet = len(subnet)
        secrets_str += '%s : %s\n' % (rightid, item.get('key')) if rightid and auth_enable != '0' else '%s : %s\n' % (item.get('right'), item.get('key'))
        for index, item_subnet in enumerate(subnet):
            if len_subnet > 1:
                conf_str += 'conn %s_%s\n' % (name, index + 1)
            else:
                conf_str += 'conn %s\n' % name
            leftsubnet = ipmask2num(item_subnet.get('leftsubnet'), item_subnet.get('leftmask'))
            rightsubnet = ipmask2num(item_subnet.get('rightsubnet'), item_subnet.get('rightmask'))
            conf_str += '  aggressive=%s\n' % ('yes' if item.get('model') == 'aggressive' else 'no')
            conf_str += '  ikelifetime=%ss\n' % item.get('ISAKMP_lifetime')
            conf_str += '  keylife=%ss\n' % item.get('SA_keylife')
            conf_str += '  ike=%s-%s-%s\n' % (item.get('ISAKMP_encryption').lower(), item.get('ISAKMP_auth').lower(), item.get('DH').lower())
            conf_str += '  esp=%s-%s%s\n' % (item.get('ESP_encryption').lower(), item.get('ESP_auth').lower(), ('-%s' % item.get('pfs').lower()) if item.get('pfs') else '')
            conf_str += '  leftsubnet=%s\n' % leftsubnet
            conf_str += '  leftauth=psk\n'
            conf_str += '  leftfirewall=yes\n'
            conf_str += '  right=%s\n' % item.get('right')
            conf_str += '  rightsubnet=%s\n' % rightsubnet
            conf_str += '  rightauth=psk\n'
            if leftid and auth_enable != '0':
                conf_str += '  leftid=%s\n' % leftid
            if rightid and auth_enable != '0':
                conf_str += '  rightid=%s\n' % rightid
            conf_str += '  auto=start\n'
        file_conf = open('/etc/ipsec.conf', 'w')
        file_secrets = open('/etc/ipsec.secrets', 'w')
        file_conf.write(conf_str)
        file_secrets.write(secrets_str)
        file_conf.close()
        file_secrets.close()
