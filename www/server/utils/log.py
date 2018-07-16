# coding=utf-8
import os
import time

import sys
from os.path import dirname, abspath

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

from base.settings import BASE_DIR
SIZE = 1024*1204*3  # 保存3M大小日志
import logging
formatter = logging.Formatter('%(asctime)s %(filename)s [line:%(lineno)d] %(levelname)s %(message)s','[%Y/%m/%d %H:%M:%S]')




class log():
    """
    use:
    logger = log('a.log')
    logging = logger.logger
    logging.info('xxx')
    logging.error('xxx')
    logging.warning('uyy')
    """
    def __init__(self, filename):
        self.filename = filename
        import uuid
        uu_log = str(uuid.uuid4())
        logger = logging.getLogger(uu_log)
        logger.setLevel(logging.INFO)
        hfile = logging.FileHandler(BASE_DIR + '/log/%s' % filename)
        hfile.setFormatter(formatter)
        logger.addHandler(hfile)
        self.logger = logger
        self.__control_size()


    def __control_size(self):
        # uwsgi日志大小控制， 因为uwsgi日志不会自动创建，所以只能用清空的方式
        if int(os.path.getsize(BASE_DIR+'/log/uwsgi.log')) >= SIZE:
            import shutil
            shutil.copyfile(BASE_DIR+'/log/uwsgi.log', BASE_DIR+'/log/uwsgi_old.log')  # 复制
            os.popen(">%s/log/uwsgi.log" % BASE_DIR)  # 清空
        if int(os.path.getsize(BASE_DIR+'/log/'+self.filename)) >= SIZE:
            os.rename(BASE_DIR+'/log/'+self.filename, BASE_DIR+'/log/'+self.filename+'_old')


def log_w(filename, msg):
    try:
        if int(os.path.getsize(BASE_DIR+'/log/'+filename)) >= SIZE:
            os.rename(BASE_DIR+'/log/'+filename, BASE_DIR+'/log/'+filename+'_old')

        # uwsgi日志大小控制， 因为uwsgi日志不会自动创建，所以只能用清空的方式
        if int(os.path.getsize(BASE_DIR+'/log/uwsgi.log')) >= SIZE:
            import shutil
            shutil.copyfile(BASE_DIR+'/log/uwsgi.log', BASE_DIR+'/log/uwsgi_old.log')  # 复制
            os.popen(">%s/log/uwsgi.log" % BASE_DIR)  # 清空
    except:
        pass
    now_time = time.strftime("[%Y/%m/%d %H:%M:%S] ",time.localtime(time.time()))
    msg = now_time + str(msg)
    cmd = 'echo "%s">>%s/log/%s' % (msg, BASE_DIR, filename)
    os.popen2(cmd)