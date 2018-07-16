# coding=utf-8
import hashlib
import json
import os
import sys
from os.path import dirname, abspath
import time


try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')
from django import setup
setup()

from base.settings import BASE_DIR
from utils.log import log
from utils.rabbitmq import DevRabbitMq
from utils.upfix import fix_snmp_conf
logname = "cmslog"
logger = log(logname)
logging = logger.logger


def upload_soft(cms_filename):
    filename_base = 'RG_BCR_X86'

    # 解压, 等待解压完成
    os.popen('tar -zxvf /opt/%s -C /opt' % cms_filename).read()
    # 删除压缩包
    os.popen2('rm -f /opt/%s' % cms_filename)
    if not os.path.isdir('/etc/config/default'):
        os.popen('mkdir /etc/config/default')

    target_ver = os.popen("cat /opt/%s/etc/version" % filename_base).read()[:-1]
    now_ver = os.popen("cat /etc/version").read()[:-1]
    # if now_ver and target_ver and now_ver > '5' and target_ver < '2':
    if now_ver and target_ver and now_ver > target_ver:
        return False, '当前版本%s不支持降级到版本%s'% (now_ver,target_ver)

    # 保留一份升级包里面的配置，作为还原配置用
    os.popen('cp /opt/%s/etc/config/* /etc/config/default' % filename_base)
    # 保留配置升级
    # update_configure('/opt/%s/etc/config/' % filename_base, '/etc/config')
    # 执行升级脚本
    # os.popen2('sh /opt/%s/install.sh' % filename_base)
    fix_snmp_conf()
    os.popen2('sh /opt/%s/install.sh save_config' % filename_base)
    return True, 'success'


def get_rabbitmq():
    addr = (os.popen("cat %s/log/cms_addr" % BASE_DIR).read())[0:-1]
    dev_rabbit = None
    if addr:
        try:
            dev_rabbit = DevRabbitMq(addr, "test")
        except Exception as e:
            logging.error('cms_update error is %s' % e.message)
    else:
        logging.error('not upload, because not cms addr')
    return dev_rabbit


def cms_update(cmd):
    dev_rabbit = get_rabbitmq()
    if not dev_rabbit:
        logging.error('not upload, when build mq connet error')
        return

    data = {}
    properties = {}
    reply_to = cmd.get('reply_to')
    correlation_id = cmd.get('correlation_id')
    if correlation_id:
        data['correlation_id'] = correlation_id
        properties['correlation_id'] = correlation_id

    if cmd.has_key('md5') is False or cmd.has_key('url') is False:
        data['status'] = -1
        data['msg'] = 'Illegal parameter'
        dev_rabbit.send_msg('', reply_to, data, properties)
        logging.info('[upload] cms upload parameters error')
        return

    md5 = cmd.get('md5')
    url = cmd.get('url')

    if type(url) is not list:
        data['status'] = -1
        data['msg'] = 'Illegal parameter'
        dev_rabbit.send_msg('', reply_to, data, properties)
        logging.info('[upload] cms upload url:%s is not list error' % url)
        return

    if len(url) <=0:
        data['status'] = -1
        data['msg'] = 'Update url is null'
        dev_rabbit.send_msg('', reply_to, data, properties)
        logging.info('[upload] cms upload url:%s is null error' % url)
        return

    # 判断是否有升级任务正在进行
    if os.path.exists('%s/log/upload' % BASE_DIR):
        update_info = os.popen('cat %s/log/upload' % BASE_DIR).read()[:-1]
        if update_info:
            data['status'] = -1
            data['msg'] = 'THE_LAST_VERSION_IS_DOWNLOADING'
            dev_rabbit.send_msg('', reply_to, data, properties)
            logging.info('[upload] have cms upload task ing')
            return
    logging.info('[upload] not task on download')
    # 读取url中升级包的名字
    filename = url[0].split('/')[-1]
    if not filename or filename.endswith('.bin') is False:
        data['status'] = -1
        data['msg'] = 'Invalid package file'
        dev_rabbit.send_msg('', reply_to, data, properties)
        logging.info('[upload] cms tar not end with ".tar.gz"')
        return

    # 收到正确的url,准备开始下载
    data['status'] = 2
    data['msg'] = 'DOWNLOADING'
    dev_rabbit.send_msg('', reply_to, data, properties)

    # 获取正确的url地址,记录状态文件
    update_info = '%s:%s:2' % (reply_to, correlation_id)
    cmd = 'echo "%s">%s/log/upload' % (update_info, BASE_DIR)
    os.popen2(cmd)

    # wget获取升级包
    retry_times = 0
    while retry_times < 3:
        try:
            retry_times += 1
            logging.info('[upload] try %s times download...' % retry_times)
            os.popen('wget -np %s -T 60  -P /opt' % url[0]).read()
            logging.info('[upload] finish download')
        except Exception as e:
            cmd = 'echo "%s">%s/log/upload' % (update_info, BASE_DIR)
            os.popen2(cmd)
            logging.error('[upload] wget error %s' % e.message)
        if os.path.exists('/opt/%s' % filename):
            retry_times = 3
    # 下载文件不存在，下载失败
    logging.info('[upload] download filename:%s' % filename)
    if not os.path.exists('/opt/%s' % filename):
        data['status'] = -1
        data['msg'] = 'WGET_ERROR'
        dev_rabbit.send_msg('', reply_to, data, properties)
        cmd = '>%s/log/upload' % BASE_DIR
        os.popen(cmd)
        logging.info('[upload] download error')
        return

    # md5校验
    m = hashlib.md5()
    m.update((open(os.path.join('/opt', filename),'rb')).read())
    md5_down = str(m.hexdigest())

    if md5_down != str(md5):
        data['status'] = -1
        data['msg'] = 'MD5_CHECK_ERROR'
        dev_rabbit.send_msg('', reply_to, data, properties)
        cmd = '>%s/log/upload' % BASE_DIR
        os.popen(cmd)
        os.popen2('rm -f /opt/%s' % filename)
        logging.info('[upload] md5 check error')
        return
    else:
        data['status'] = 3
        data['msg'] = 'MD5_CHECK_SUCC'
        dev_rabbit.send_msg('', reply_to, data, properties)
        update_info = '%s:%s:3' % (reply_to, correlation_id)
        cmd = 'echo "%s">%s/log/upload' % (update_info, BASE_DIR)
        logging.info('[upload] md5 check success')
        os.popen2(cmd)

    # 开始升级
    logging.info('[upload] begin to upload dev')
    upd_ret, upd_msg = upload_soft(filename)
    if not upd_ret:
        data['status'] = -1
        data['msg'] = upd_msg
        cmd = '>%s/log/upload' % BASE_DIR
        os.popen(cmd)
        dev_rabbit.send_msg('', reply_to, data, properties)
        return
    logging.info('[upload] end upload dev')
    data['status'] = 4
    data['msg'] = 'MEM_CHECK_ENOUGH_READY_WRITE_FLASH'
    dev_rabbit.send_msg('', reply_to, data, properties)
    update_info = '%s:%s:4' % (reply_to, correlation_id)
    logging.info('[upload] upload success, begin reboot')
    cmd = 'echo "%s">%s/log/upload' % (update_info, BASE_DIR)
    os.popen2(cmd)
    return


def load(file):
    json_file = open(file)
    ret = False
    data = None
    try:
        data = json.load(json_file)
        ret = True
    except:
        logging.error('upload cmd not json :%s' % json_file.read())
        json_file.close()
    finally:
        json_file.close()
    return ret, data


def get_up_state():
    reply_to= None
    correlation_id = None
    status = None
    if os.path.exists('%s/log/upload' % BASE_DIR):
            update_info = os.popen('cat %s/log/upload' % BASE_DIR).read()[:-1]
            if update_info:
                logging.info('check update_info %s' % update_info)
                reply_to, correlation_id, status = update_info.split(':')
    return reply_to, correlation_id, status

if __name__ == '__main__':
    reply_to, correlation_id, status = get_up_state()
    if status and int(status) != 4:
        # 正常情况下重新启动升级进程是不会出现这个状态，除非是被认为结束，或者升级升一半关机诸如此类的情况才会出现
        # 所以直接回复升级失败，清空状态防止不能再进行下次升级操作
        dev_rabbit = get_rabbitmq()
        if dev_rabbit:
            try:
                dev_rabbit.send_msg('', reply_to, {"status": -1, "msg": "升级进程被重启，导致升级失败", "correlation_id": correlation_id}, {"correlation_id" :correlation_id})
            except Exception as e:
                logging.error("%s %s" % (e, e.message))
        os.popen('>%s/log/upload' % BASE_DIR)
    while 1:
        cmd_file = '%s/log/upcmd' % BASE_DIR
        if os.path.exists(cmd_file):
            ret, data = load(cmd_file)
            os.popen('rm %s/log/upcmd' % BASE_DIR).read()
            if ret:
                try:
                    cms_update(data)
                except Exception as e:
                    reply_to, correlation_id, status = get_up_state()
                    if status and int(status) != 4:
                        logging.error('upload error, mq send error: Except is:%s, Except error msg is:%s' % e.message)
                        os.popen('>%s/log/upload' % BASE_DIR)
        time.sleep(0.5)
