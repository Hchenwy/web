# coding=utf-8
# 以文件形式保存
import time
from Jhin.jhin import Jhin
LOG_PATH = '/var/log/'


def write_operate_log(user, ip, msg):
    """
    log_dict:
    {
    "user":"online" / "admin",
    ip:"192.168.1.1",
    operate:"登入"
    }
    :param log_dict:
    :return:
    """
    log_dict =dict()
    log_dict['user'] = user
    log_dict['ip'] = ip
    log_dict['opera'] = msg
    log_dict['time'] = time.strftime('%Y-%m-%d %H:%M:%S')
    jhin = Jhin()
    jhin.load_whisper('operate_log', LOG_PATH)
    logs = jhin.get('logs')
    if not logs:
        logs = []
    logs.append(log_dict)
    jhin.add('logs', logs)
    jhin.curtain_call()
    return

if __name__ == '__main__':
    write_operate_log({'user': 'admin', 'ip':'192.168.1.1', 'operate': '登入'})