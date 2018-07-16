# -*- coding: utf-8 -*-
import os
from Jhin.jhin import Jhin
from base.settings import BASE_DIR
from utils.log import log

conf = Jhin()
conf.load_whisper('global', path=os.path.join(BASE_DIR, 'config'))


def get_logging(module):
    return log(conf.get(module, 'logname')).logger


def get_debug(module):
    return 1 if conf.get(module, 'debug') == 'on' else 0


def get_module_conf(module):
    return conf.get(module)
