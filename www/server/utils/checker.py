import re


def is_m_str_value(*var):
    for v in var:
        if not is_str_value(v):
            return False
    return True


def is_str_value(var):
    if not isinstance(var, basestring):
        return False
    if var == "":
        return False
    return True


def is_ipv4_address(ip):
    ip_pattern = r'((?:(2[0-4]\d)|(25[0-5])|([01]?\d\d?))\.){3}(?:(2[0-4]\d)|(25[0-5])|([01]?\d\d?))'
    if re.search(ip_pattern, ip, flags=0):
        return True
    return False


def is_m_ipv4_address(*var):
    for v in var:
        if is_str_value(v) and is_ipv4_address(v):
            return True
    return False


def is_vlan_id(vlan_id):
    if isinstance(vlan_id, basestring):
        vlan_id = int(vlan_id)
    elif isinstance(vlan_id, int):
        pass
    else:
        return False
    if 0 < vlan_id <= 4096:
        return True
    else:
        return False
