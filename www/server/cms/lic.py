# -*- coding: UTF-8 -*-
import json
import random
import re
import sys
import os
import threading
from os.path import dirname, abspath
from time import sleep

import requests


try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

from utils.log import log
from Jhin.jhin import Jhin
from utils.decrypt import encrypt1, decstr1, M2encrypt, M2decrypt

from utils.rsa import pub_decrypt_with_pubkeyfile, pub_decrypt_with_pubkeystr
from utils.net_tools import force_restart
logname = 'lic.log'
# base_addr = 'http://10.18.75.10:8888/'
# base_addr = 'http://lic.ruijiery.com:8888/'
# license_addr = base_addr + 'x86_lic/auth_lic/'
# license_update_addr = base_addr + 'x86_lic/update_lic/'
ONE_DAY = 86400  # s
ONE_HOUR = 3600  # s
TEN_MINUTE = 600  # s
FIVE_MINUTE = 300  # s
ONE_MINUTE = 60  # s
ONE_SECOND = 1  # s
CAN_TRY_USE = 7 * ONE_DAY

logger = log(logname)
logging = logger.logger


def get_lic_addr():
    base_addr = None
    jhin = Jhin()
    try:
        jhin.load_whisper("lic")
        base_addr = jhin.get('addr')
    except:
        logging.info('lic is not json, it be rewrite, so no recreate')
        os.popen('rm /etc/config/lic.json')
    if base_addr and ('http://' not in base_addr):
        base_addr = 'http://' + base_addr
    return base_addr


def get_mac():
    ethtool = os.popen('ethtool -P eth0').read()[0:-1]
    if ethtool and 'Permanent address: ' in ethtool:
        mac = ethtool.split(': ')[1]
        if mac and re.match(r"^\s*([0-9a-fA-F]{2,2}:){5,5}[0-9a-fA-F]{2,2}\s*$", mac):
            return mac.replace(':', '-').upper()
    lsap_mac = str(os.popen('lsap --mac').read()[0:-1]).upper()
    return lsap_mac

def check_lic():
    if os.path.exists('/etc/config/pub.pem'):
        if os.path.exists('/etc/config/license'):
            file_object = open('/etc/config/license')
            dev_license = None
            try:
                dev_license = file_object.read()[0:-1]
            finally:
                file_object.close()
            if dev_license:
                ret, detext = pub_decrypt_with_pubkeyfile(dev_license, '/etc/config/pub.pem')
                if ret:
                    license_json = json.loads(detext)
                    dev_mac = get_mac()
                    if license_json.get('mac') == dev_mac:
                        logging.info('success check licence')
                        return True
                    else:
                        logging.info('license mac:%s != dev mac:%s' % (license_json.get('mac'), dev_mac))
                else:
                    logging.info('pub_decrypt_with_pubkeyfile error ret:%s' % ret)
            else:
                logging.info('read license failed')
        else:
            logging.info('not license file')
    else:
        logging.info('not pub.pem file')
    return False


def try_use():
    is_exist = 0
    dev_mac = get_mac()
    encrypt1_dev_mac = M2encrypt(dev_mac)
    while 1:
        if not check_lic():
            logging.info('check licence failed in try_use function')
            if os.path.exists('/etc/config/sys_lic.json'):
                jhin = Jhin()
                try:
                    jhin.load_whisper("sys_lic")
                except:
                    # 文件被修改成不是json格式的 直接不让用  到期变成7天
                    logging.info('sys_lic is not json, it be rewrite, so no let it try used')
                    os.popen('rm /etc/config/sys_lic.json')
                    data = dict()
                    data['dev_sn'] = os.popen('lsap --sn').read()[0:-1]
                    data['mac'] = encrypt1_dev_mac
                    data['used'] = M2encrypt(str(CAN_TRY_USE))
                    jhin.load_whisper("sys_lic")
                    jhin.add_all(data)
                    jhin.curtain_call()
                    is_exist += 1
                    sleep(ONE_SECOND)
                    continue
                try:
                    mac = M2decrypt(jhin.get('mac'))
                    used = M2decrypt(jhin.get('used'))
                except Exception as e:
                    logging.error('when decstr1 error:%s' % e.message)
                    logging.info('mac code:%s' % (jhin.get('mac')))
                    logging.info('used code:%s' % (jhin.get('used')))
                    jhin.add('used', M2encrypt(str(CAN_TRY_USE)))
                    jhin.add('mac', encrypt1_dev_mac)
                    jhin.curtain_call()
                    logging.info('sys_lic mac or used be rewrite, so no let it try used')
                    sleep(ONE_SECOND)
                    continue
                if dev_mac != mac:  # new dev
                    logging.info('mac is changed ,copy system ,so it can recount try use')
                    logging.info('config mac code :%s' % jhin.get('mac'))
                    logging.info('lsap mac:%s,config mac:%s' % (dev_mac, mac))
                    jhin.add('used', M2encrypt('0'))
                    jhin.add('mac', encrypt1_dev_mac)
                    jhin.curtain_call()
                    sleep(ONE_SECOND)
                    continue
                elif int(used) < CAN_TRY_USE:
                    logging.info('used %s ,begin to sleep %s s, then add it.' % (used, ONE_MINUTE))
                    sleep(ONE_MINUTE)
                    used_new = M2encrypt(str(int(used) + ONE_MINUTE))
                    jhin.add('used', used_new)
                    jhin.curtain_call()
                    logging.info('sys_lic has try used %s(s)' % (int(used) + ONE_MINUTE))
                    continue
                elif int(used) >= CAN_TRY_USE:
                    used_new = M2encrypt(str(CAN_TRY_USE))
                    jhin.add('used', used_new)
                    jhin.curtain_call()
                    logging.info('sys_lic has try used  %s(s)' % CAN_TRY_USE)
                    sleep(ONE_MINUTE)
                    continue
                else:
                    sleep(ONE_SECOND)
                    continue
            else:
                logging.info('sys_lic not exist ,make it')
                data = dict()
                data['dev_sn'] = os.popen('lsap --sn').read()[0:-1]
                data['mac'] = encrypt1_dev_mac
                if is_exist > 0:  # 被手动删除过, 试用期直接到期
                    data['used'] = M2encrypt(str(CAN_TRY_USE))
                    logging.info('sys_lic had be del ,so it can not try use')
                    is_exist = 0
                else:
                    data['used'] = M2encrypt('0')
                jhin = Jhin()
                jhin.load_whisper("sys_lic")
                jhin.add_all(data)
                jhin.curtain_call()
                is_exist += 1
                sleep(ONE_SECOND)
        else:
            logging.info('check lic success so init can try use day')
            data = dict()
            data['dev_sn'] = os.popen('lsap --sn').read()[0:-1]
            data['mac'] = encrypt1_dev_mac
            data['used'] = M2encrypt('0')
            jhin = Jhin()
            jhin.load_whisper("sys_lic")
            jhin.add_all(data)
            jhin.curtain_call()
            sleep(ONE_MINUTE)


def req_lic():
    firm = ''
    if str(os.popen('lsap --product').read()[0:-1]).startswith('SURF'):
        firm = "任子行"
    if str(os.popen('lsap --sn').read()[0:-1]).startswith('SMB'):
        firm = "SMB"
    data = {
    "event": "auth_lic",
    "dev_sn": os.popen('lsap --sn').read()[0:-1],
    "mac":  get_mac(),
    "firm": firm
    }
    lic_base_addr = get_lic_addr()
    logging.info('license addr is %s'%lic_base_addr)
    if lic_base_addr:
        lc_addr = lic_base_addr + '/x86_lic/auth_lic/'
    else:
        return False
    try:
        r = requests.post(lc_addr, data=encrypt1(str(data)), timeout=10)
    except Exception as e:
        logging.error('req lic except %s' % e.message)
        return False
    # print r.status_code
    # print r.content
    if r.status_code == 200:
        try:
            ret_data = json.loads(r.content)
        except:
            logging.error(' req lic not return json:%s'%r.content)
            return False
        if ret_data.get('result') == 'ok':
            data = ret_data.get('data')
            if data:
                pub_key = data.get('pub_key')
                lic = data.get('lic')
                if pub_key and lic:
                    ret, detext = pub_decrypt_with_pubkeystr(lic, pub_key)
                    if ret:
                        detext_json = json.loads(detext)
                        if detext_json.get('mac') == get_mac():
                            os.popen("echo '%s'>/etc/config/pub.pem" % pub_key)
                            os.popen("echo '%s'>/etc/config/license" % lic)
                            logging.info('success get licence')
                            try:
                                jhin = Jhin()
                                jhin.load_whisper("sys_lic")
                                jhin.add('used', M2encrypt('0'))
                                jhin.curtain_call()
                                logging.info('init try used day to 0')
                            except Exception as e:
                                logging.error("when reset sys_lic used to 0 error%s"%e.message)
                            return True
                        else:
                            logging.error('licence mac not dev mac')
                    else:
                        logging.error('decrypt licence error')
                else:
                    logging.error('pub_key or lic error when get lic')
            else:
                logging.error('data error when get lic:%s' % str(ret_data))
        else:
            logging.info('not licence can use')
    else:
        logging.error('req lic statue code is %s' % r.status_code)
    return False


def control_dev():
    dev_mac = get_mac()
    while 1:
        if not check_lic():
            logging.info('check first time for licence failed in control_dev function')
            try:
                if os.path.exists('/etc/config/sys_lic.json'):
                    jhin = Jhin()
                    jhin.load_whisper("sys_lic")
                    mac = M2decrypt(jhin.get('mac'))
                    used = int(M2decrypt(jhin.get('used')))
                else:
                    sleep(ONE_MINUTE)
                    continue
            except:
                sleep(ONE_MINUTE)
                continue
            if mac == dev_mac and used >= CAN_TRY_USE:
                sleep(ONE_HOUR/2)
                if not check_lic():
                    logging.info('check second time for licence failed in control_dev function')
                    logging.info('had already try used 7days and have not license, begin reboot dev')
                    os.popen2('webauth stop')
                    force_restart()
        sleep(ONE_MINUTE)


def lic_deal():
    while 1:
        if not check_lic():
            logging.info('check licence failed in lic_deal function, so try to request lic again!')
            req_lic()
        sleep(FIVE_MINUTE)


def init_update_pub(new_week=0):
    data = {}
    week = random.randint(1, 7)
    data['week'] = week
    data['count'] = 0
    data['to_count'] = (week + new_week) * 24 * 6  # add 1 per 10 minute
    logging.info('plan %s days to update' % (week+new_week))
    jhin = Jhin()
    jhin.load_whisper("update_pub")
    jhin.add_all(data)
    jhin.curtain_call()
    return


def update_pub():
    while 1:
        logging.info('begin to sleep %s(s), then check if need to update')
        sleep(TEN_MINUTE)
        logging.info('begin to check if need to update')
        if not os.path.exists('/etc/config/update_pub.json'):
            logging.info('create update_pub.json')
            init_update_pub()
        else:
            jhin = Jhin()
            try:
                jhin.load_whisper("update_pub")
                old_count = int(jhin.get('count'))
                count = int(jhin.get('count')) +1
                to_count = int(jhin.get('to_count'))
                week = int(jhin.get('week'))
                if old_count <= to_count:
                    jhin.add('count', count)
                    jhin.curtain_call()
            except Exception as e:
                logging.error('when get update_pub error %s, so rewrite update_pub'%e.message)
                init_update_pub()
                continue
            if count >= to_count:
                # week_last = 7 - week
                # init_update_pub(week_last)
                if check_lic():
                    file_object = open('/etc/config/pub.pem')
                    try:
                        rsa = file_object.read()[0:-1]
                    finally:
                        file_object.close()
                    if rsa:
                        data = {
                        "event": "update_lic",
                        "pub_key": rsa,
                        "mac": get_mac()
                        }
                        try:
                            logging.info('begin update pub and license')
                            lic_base_addr = get_lic_addr()
                            if lic_base_addr:
                                lc_update_addr = lic_base_addr + '/x86_lic/update_lic/'
                            else:
                                logging.info("licence addr is None")
                                continue
                            r = requests.post(lc_update_addr, data=encrypt1(str(data)), timeout=10)
                            # print r.status_code
                            if r.status_code == 200:
                                logging.info('update pub and license success, recount next update time')
                                week_last = 7 - week
                                init_update_pub(week_last)

                                ret_data = json.loads(r.content)
                                data = ret_data.get('data')
                                if data and ret_data.get('result') == 'ok':
                                    pub_key = data.get('pub_key')
                                    lic = data.get('lic')
                                    # print pub_key
                                    # print lic
                                    os.popen("echo '%s'>/etc/config/pub.pem" % pub_key)
                                    os.popen("echo '%s'>/etc/config/license" % lic)
                                    logging.info('success update pub and license')
                                else:
                                    logging.info('not need update')
                            else:
                                logging.error('when update lic, status_code is %s' % r.status_code)
                        except Exception as e:
                            logging.error(e.message)
                    else:
                        logging.info('pub is null')
                else:
                    logging.info('check lic failed ,not to update pub')
            else:
                logging.info('not need upload because count is:%s to_count is:%s' % (count, to_count))

if __name__ == '__main__':
    if str(os.popen('lsap --product').read()[0:-1]).startswith('SURF'):
        tryThead= threading.Thread(target=try_use)
        tryThead.daemon = True
        tryThead.start()
        sleep(0.2)

        lic_dealThead= threading.Thread(target=lic_deal)
        lic_dealThead.daemon = True
        lic_dealThead.start()

        control_devThead= threading.Thread(target=control_dev)
        control_devThead.daemon = True
        control_devThead.start()
        update_pubThead= threading.Thread(target=update_pub)
        update_pubThead.daemon = True
        update_pubThead.start()
    else:
        pass
    # print 'start update_pub '
    while 1:
        sleep(TEN_MINUTE)