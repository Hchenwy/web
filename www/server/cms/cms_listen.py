# coding: utf-8
import base64
import json
import os
from os.path import dirname, abspath
import threading
import time
import rabbitpy
import requests
import sys

from datetime import datetime


try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')
from django import setup

setup()

from config.views import deal_conf
from utils.decrypt import encrypt, decrypt
from utils.rabbitmq import DevRabbitMq
from cms.sync_info import sync_info
from utils.log import log
from base.settings import BASE_DIR
from cms.cms_client import cms_update
from Jhin.jhin import Jhin
from utils.singleton import Singleton
from utils.net_tools import create_conf_cach
from utils.tools import timelimited, TimeoutException

index_add = "http://cms1.ruijie.com.cn:8080/rcms/login"  # 索引服务器地址

logname = "cmslog"
ALERT_QUEUE = 'dev_alert'
logger = log(logname)
logging = logger.logger


def get_config_cache(filename):
    jhin = Jhin()
    jhin.load_whisper(filename)
    return jhin.get_all() if jhin.get_all() else None


def clean_config_cache(filename):
    jhin = Jhin()
    jhin.load_whisper(filename)
    jhin.abandon()
    jhin.curtain_call()


class DevGetCmsMsg(threading.Thread):
    DEV_CONF_CACHE = 'sync'
    TWELVE_HOURS = 12 * 3600
    DEV_CONF_SYNC_QUEUE = 'dev_conf_sync'

    __metaclass__ = Singleton

    def __init__(self):
        self.heart_count = 0
        self.sn = "%s" % str(os.popen('cat /etc/SerialNumber').read())[0:-1]
        self.model = "%s" % str(os.popen('cat /etc/product').read())[0:-1]
        self.queue = '%s|%s' % (self.sn, self.model)
        self.addr = None
        self.mq_queue = None
        self.start_time = datetime.now()
        self.version = "%s" % str(os.popen('cat /etc/version').read())[0:-1]
        super(DevGetCmsMsg, self).__init__()

    def check_cms_upload(self):
        """
        设备重启连上cms后，往cms发送升级成功
        :return:
        """
        logging.info('check upload')
        if os.path.exists('%s/log/upload' % BASE_DIR):
            update_info = os.popen('cat %s/log/upload' % BASE_DIR).read()[:-1]
            if update_info:
                data = {}
                properties = {}
                logging.info('check update_info %s' % update_info)
                reply_to, correlation_id, status = update_info.split(':')
                if str(status) != '4':
                    # data['correlation_id'] = correlation_id
                    # properties['correlation_id'] = correlation_id
                    # data['status'] = -1
                    # data['msg'] = '其它错误%s' % status
                    # logging.info('send to %s %s' % (reply_to, data))
                    # self.dev_rabbit.send_msg('', reply_to, data, properties)
                    # logging.info('clear upload info')
                    # os.popen2('>%s/log/upload' % BASE_DIR)
                    return
                else:
                    data['correlation_id'] = correlation_id
                    properties['correlation_id'] = correlation_id
                    data['status'] = 0
                    data['msg'] = 'UPGRADE_SUCC'
                    logging.info('send to %s %s' % (reply_to, data))
                    self.dev_rabbit.send_msg('', reply_to, data, properties)
                    os.popen2('>%s/log/upload' % BASE_DIR)
            else:
                logging.info('upload file not exists')
        return

    def check_cpu_mem(self):
        jhin = Jhin()
        while 1:
            try:
                if self.dev_rabbit:
                    f_cpu, f_mem = 80.0, 80.0
                    if not os.path.exists("/etc/config/alert.json"):
                        pass
                    # log_w("alert.log", 'alert conf not exists')
                    else:
                        jhin.load_whisper("alert")
                        f_mem = jhin.get("mem") if jhin.get("mem") else 80.0
                        f_cpu = jhin.get("cpu") if jhin.get("cpu") else 80.0
                    cpu = os.popen("lsap --cpu").read()
                    mem = os.popen("lsap --mem").read()
                    cpu_per = float(cpu.strip().strip('\n').strip('%'))
                    mem_per = float(mem.strip().strip('\n').strip('%'))
                    if cpu_per >= float(f_cpu) or mem_per >= float(f_mem):
                        data = {
                            "event": "alert",
                            "data":
                                {
                                    "cpu": str(cpu_per) + '%',
                                    "mem": str(mem_per) + '%',
                                    "dev_sn": self.sn
                                }
                        }
                        logging.warning('cpu: used %s%% , mem: used %s%%' % (cpu_per, mem_per))
                        self.dev_rabbit.send_msg('', ALERT_QUEUE, data)
                time.sleep(30)
            except Exception as e:
                time.sleep(30)

    def generate_sync_socket(self, cache):
        return {
            "event": "dev_conf_sync",
            "version": self.version,
            "data": cache,
            "dev_sn": self.sn,
            "model": self.model
        }

    def sync_conf_cache(self):
        while True:
            try:
                if self.dev_rabbit:
                    cache = get_config_cache(self.DEV_CONF_CACHE)
                    if cache:
                        logging.info("has cache, cache is %s" % cache)
                        logging.info("syncing..............")
                        data = self.generate_sync_socket(cache)
                        self.dev_rabbit.send_msg('', self.DEV_CONF_SYNC_QUEUE, data)
                        logging.info("sync done")
                        clean_config_cache(self.DEV_CONF_CACHE)
                        logging.info("clean cache done")
                time.sleep(5)
            except Exception as e:
                print('sync configuration error: %s' % e.message)
                logging.error('sync configuration error: %s' % e.message)

    def send_hearbeat(self):
        while 1:
            time.sleep(30)
            try:
                # if (datetime.now() - self.start_time).seconds >= self.TWELVE_HOURS:
                #     logging.info('cmsclient had run 12 hours, begin to restart')
                #     # time.sleep(1)
                #     os.popen2('cmsclient restart')
                if self.dev_rabbit:
                    self.heart_count += 1
                    self.dev_rabbit.send_msg('', self.queue, {"event": "keepalive"})
            except Exception as e:
                logging.error('send keepalive error:%s ,so restart cmsclient,hear_count %s to 3' % (e.message, self.heart_count))
                self.heart_count = 3
            # log_w(logname, 'ERROR send except')
            # os.popen2('cmsclient restart')
            # raise
            finally:
                if self.heart_count >= 3:
                    logging.info('send keepalive %s s not reply' % (self.heart_count * 30))
                    logging.info('begin to restart cmsclient')
                    # os.popen2('cmsclient restart')
                    os._exit(1)
                    # time.sleep(300)

    def get_cms_addr(self):
        """
        从索引服务器获取cms地址
        """
        data = '{"sn": "%s"}' % self.sn
        logging.info('begin to get cms addr from index server')
        logging.info('%s encrypt to %s' % (data, encrypt(data)))
        try:
            self.addr = None
            r = requests.post(index_add, data=encrypt(data), timeout=10)
            if r.status_code == 200:
                ret_data = decrypt(r.content)
                if ret_data:
                    self.addr = ret_data.get('server') + '?heartbeat=5'
                    os.popen2("echo '%s'>%s/log/cms_addr" % (self.addr, BASE_DIR))  # 写cms地址
                    logging.info('success get %s' % ret_data)
                else:
                    os.popen2(">%s/log/cms_addr" % BASE_DIR)
                    logging.error('decrypt error')
            else:
                logging.error('cms index server connect error')
        except Exception as e:
            self.addr = None
            logging.error('cms index server connect Exception %s ' % e)

    def login_cms(self):
        data = {
            "event": "login", "api_ver": "1.0",
            "data": {
                "dev_sn": self.sn,
                "dev_type": "ROUTER",
                "dev_mfr": "ruijie",
                "dev_model": self.model,
                "hw_ver": 1.0,
                "dev_uptime": os.popen("cat /proc/uptime | awk -F. '{print $1}'").read()[:-1],
                "soft_ver": str(os.popen('cat /etc/version').read())[0:-1]
            }
        }
        properties = {"reply_to": self.queue}
        logging.info('cms login data :%s' % data)
        self.dev_rabbit.send_msg('', 'dev_login_q', data, properties)
        # logging.info('cms login success')
        # sync_info(self.dev_rabbit)  # sync data to cms
        # self.check_cms_upload()

    def init_mq(self):
        # 创建消息队列
        self.get_cms_addr()
        while not self.addr:
            logging.error('can not get cms addr')
            self.get_cms_addr()
            if not self.addr:
                time.sleep(30)
        self.dev_rabbit = DevRabbitMq(self.addr, self.queue)
        self.mq_queue = None
        mq_init_count = 0

        @timelimited(60)
        def _declare_mq():
            while self.mq_queue is None:
                try:
                    self.mq_queue = rabbitpy.Queue(self.dev_rabbit.channel(), self.queue)  # , durable=True)
                    self.mq_queue.declare()
                    logging.info('success rabbitpy.Queue')
                except TimeoutException:
                    logging.info('1 mintue not create rabbitpy.Queue  begin to restart cmsclient')
                    # os.popen2('cmsclient restart')
                    os._exit(1)
                except Exception as e:
                    logging.error('rabbitpy.Queue error e: %s e.message:%s, try %s count' % (e, e.message, mq_init_count))
                    time.sleep(5)
        _declare_mq()
        self.login_cms()

    def deal_hearbeat(self):
        self.heart_count -= 1
        if self.heart_count < 0:
            self.heart_count = 0

    def reply_to(self, reply_queue, poroperties, result_dict):
        if reply_queue and self.dev_rabbit:
            try:
                self.dev_rabbit.send_msg('', reply_queue, result_dict, poroperties)
            except Exception as e:
                logging.error('reply error :%s' %e.message)

    def handle_msg(self, msg):
        """
        消息处理
        :param msg:
        :return:
        """
        try:
            # msg.ack()
            data = msg.json()
        except Exception:
            logging.error('cms data not json')
            return
        correlation_id = msg.properties.get('correlation_id')
        poroperties = {}
        reply_data = {}
        # print data
        if not correlation_id:
            correlation_id = data.get('correlation_id')
        if correlation_id:
            poroperties['correlation_id'] = correlation_id
            reply_data['correlation_id'] = correlation_id
        event = data.get('event')
        reply_data['event'] = event
        reply_queue = data.get('reply_to')
        if event != 'keepalive' and event != 'conf':
            logging.info(str(data))

        if event == 'keepalive':
            self.deal_hearbeat()

        elif event == 'cli':
            cmd = data.get('cmd')
            r_data = {}
            if cmd:
                if 'ssh' in cmd:
                    os.popen2(cmd)
                    ret = 'ok'
                elif 'reboot' == str(cmd):
                    ret = 'ok'
                    r_data['status'] = 0  # 成功0 失败1
                    r_data['msg'] = ret
                    if reply_queue:
                        reply_data['data'] = r_data
                        logging.info(str(reply_data))
                        self.reply_to(reply_queue, poroperties, reply_data)
                    time.sleep(0.1)  # 为使消息确定回去
                    os.popen2('x86_uwsgi stop')
                    os.popen2(cmd)
                    time.sleep(1)
                    # os.popen2("cmsclient stop")
                    os._exit(1)
                else:
                    ret = os.popen(cmd).read()
                r_data['status'] = 0  # 成功0 失败1
                r_data['msg'] = ret
            else:
                r_data['status'] = -1  # 成功0 失败1
                r_data['msg'] = 'cmd miss!'
            if reply_queue:
                reply_data['data'] = r_data
                logging.info("cli reply " + str(reply_data))
                self.reply_to(reply_queue, poroperties, reply_data)
            else:
                logging.error("cli not reply queue ")

        elif event == 'conf':
            conf = None
            try:
                data_str = base64.b64decode(data.get("data"))
                unicode_escape_conf = data_str.decode("unicode-escape")  # .decode("unicode-escape")  # 解决中文编码问题
                conf = eval(unicode_escape_conf)
            except:
                logging.error('conf change base 64 error')
            if type(conf) is not dict:
                r_data = {"status": -1, "msg": '数据格式错误'}
                reply_data['data'] = r_data
            else:
                logging.info(str(conf))
                status, msg = deal_conf(conf, True)
                r_data = {"status": status, "msg": msg}
                reply_data['data'] = r_data
            if reply_queue:
                logging.info('conf reply ' + str(reply_data))
                self.reply_to(reply_queue, poroperties, reply_data)
            else:
                logging.error("conf not reply queue ")

        elif event == 'unbind_reg':
            logging.info('unbind reg')
            time.sleep(0.2)
            os._exit(1)
            # os.popen2('cmsclient restart')
        # raise Exception

        elif event == 'update':  # cms 下发升级指令
            try:
                logging.info('upload')
                json_file = open('%s/log/upcmd' % BASE_DIR, 'w')
                json_file.write(json.dumps(data))
                json_file.close()
            except Exception as e:
                logging.error('upload except %s' % e.message)

        elif event == 'backup':  # cms 下发升级指令
            try:
                logging.info('backup conf')
                if not os.path.isdir('/etc/config/copy_conf'):
                    os.popen('mkdir /etc/config/copy_conf')
                os.popen('cp /etc/config/* /etc/config/copy_conf')
                r_data = {"status": 0, "msg": 'success'}
                reply_data['data'] = r_data
                if reply_queue:
                    logging.info('INFO backup reply ' + str(reply_data))
                    self.reply_to(reply_queue, poroperties, reply_data)
                else:
                    logging.error('backup not reply queue')
            except Exception as e:
                logging.error('backup except %s' % e.message)
        elif event == 'recover':  # cms 下发升级指令
            try:
                logging.info('recover conf')
                os.popen('cp /etc/config/copy_conf/*  /etc/config')
                os.popen2('sleep 3; reboot')
                r_data = {"status": 0, "msg": 'success'}
                reply_data['data'] = r_data
                if reply_queue:
                    logging.info('recover reply ' + str(reply_data))
                    self.reply_to(reply_queue, poroperties, reply_data)
                else:
                    logging.error('recover not reply queue')
            except Exception as e:
                logging.error('recover except %s' % e.message)

        elif event == 'login':
            status = data.get('status', '-1')
            if str(status) == '0':
                sync_info(self.dev_rabbit)
                self.check_cms_upload()
                create_conf_cach()
        else:
            pass

    def linstenner(self):
        """
        监听队列消息
        :return:
        """
        while 1:
            # print 'begin listen'
            # with self.dev_rabbit.channel() as ch:
            try:
                # for msg in rabbitpy.Queue(ch, self.queue):
                for msg in self.mq_queue.consume(no_ack=True):
                    if msg is None:
                        time.sleep(1)
                    else:
                        self.handle_msg(msg)
                        # msg.ack()
            except Exception as e:
                logging.error('except %s %s' % (e, e.message))
                os._exit(1)
                # os.popen2('cmsclient restart')

    def run(self):
        self.init_mq()

        t = threading.Thread(target=self.send_hearbeat)
        t.daemon = True
        t.start()

        alert_check = threading.Thread(target=self.check_cpu_mem)
        alert_check.daemon = True
        alert_check.start()

        sync = threading.Thread(target=self.sync_conf_cache)
        sync.daemon = True
        sync.start()

        self.linstenner()


if __name__ == '__main__':
    logging.info('begin to start cmsclient ... ...\n')
    cms_listen = DevGetCmsMsg()
    cms_listen.setDaemon(True)
    cms_listen.start()
    while 1:
        if cms_listen.is_alive() is False:
            logging.info('cms_listen dead begin to restart cmsclient\n')
            os._exit(1)
            # os.popen2('cmsclient restart')
        time.sleep(5)
