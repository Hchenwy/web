#!/usr/bin/env python
# -*- coding:utf-8 -*-

import collections
import argparse
import sys
import os
import shutil
from os.path import dirname
from os.path import abspath

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

import up_engine
from utils.log import log
from Jhin.jhin import Jhin

logger = log('ekko.log')
logging = logger.logger

# run code
ERROR = 1
CHECK_ERROR = 10
SUCCESS = 0
NO_PATH = 11
NO_FILTER = 12


def do_merge(master, branch):
    """

    :param master:
    :param branch:
    :return:
    """
    pass


def do_update(src, dst, version):
    """
    保留配置升级, dst会覆盖src
    :param version:
    :param dst:
    :param src:
    :return:
    """
    jhin = Jhin()
    from filter import update_filter
    # get config file in filter
    conf_filter = update_filter.get(version[0], [])

    # clean conf_filter, if file not exist in src dir
    tail = '.json'
    dstlist = os.listdir(src)
    for f in conf_filter:
        if f + tail not in dstlist:
            conf_filter.remove(f)

    # find which file will be update in dst dir
    dstlist = get_config(dst, conf_filter)
    # print dst
    # do update
    for p in dstlist:
        # print p
        h, t = os.path.split(p)
        n, x = os.path.splitext(t)

        # d1 dst
        jhin.load_whisper(n, path=h)
        d1 = jhin.get_all()

        # d0 src
        jhin.load_whisper(n, path=src)
        d0 = jhin.get_all()

        # do merge
        rv = update(d0, d1)
        if not rv:
            continue
        jhin.add_all(rv)
        # test
        # print rv
        # print jhin.whisper.current_ammu_path
        # print jhin.get_all()

        jhin.curtain_call()
        # write to file with a lock
        # rio.write(p, json.dumps(rv, sort_keys=True))
    return SUCCESS


def check_by_filter(p, flist):
    tail = '.json'
    dst = os.listdir(p)
    for f in flist:
        if f + tail not in dst:
            flist.remove(f)


def get_config(path, filter):
    """
    获取需要update的文件, 该文件必须即存在于filter且存在于路径下.
    :param path:
    :param filter:
    :return:
    """
    rv = []
    # print 'filter', filter
    for f in os.listdir(path):
        n, x = os.path.splitext(f)
        # 既存在且在filter中的json文件
        if n in filter and x == '.json':
            rv.append(os.path.join(path, f))
    return rv


def do_upgrade(current, purpose, path):
    """
    版本升级
    :param current: 当前版本
    :param purpose: 目的版本
    :param path:
    :return:
    """
    jhin = Jhin()
    if not os.path.exists(path):
        return NO_PATH

    from filter import upgrade_filter
    # get upgrade list
    key = generate_upgrade_key(current, purpose)
    # print 'key', key
    ls = upgrade_filter.get(key, [])
    # print 'ls', ls
    if len(ls) == 0:
        return NO_FILTER

    # if file name in upgrade filter, do upgrade
    for f in os.listdir(path):
        n, x = os.path.splitext(f)
        if n in ls and x == '.json':
            jhin.load_whisper(n, path=path)
            # run function in up_engine
            getattr(up_engine, generate_engine_func(key, n))(jhin)

    return SUCCESS


def generate_engine_func(key, filename):
    return '{head}_{key}_{filename}'.format(head='up', key=key, filename=filename)


def generate_upgrade_key(ver0, ver1):
    return str(ver0)[0] + str(ver1)[0]


def do_backup(src, dst):
    """
    备份当前目录
    :param src: 当前目录
    :param dst: 目的目录
    :return:
    """
    if not os.path.exists(src) or not os.path.isdir(src):
        return NO_PATH
    try:
        if os.path.exists(dst):
            shutil.rmtree(dst)

        # backup
        shutil.copytree(src, dst)
    except IOError:
        return ERROR

    return SUCCESS


def do_arg_actions(action):
    global flag
    if action.update:
        flag = do_update(action.update[0], action.update[1], action.update[2])
    elif action.upgrade:
        flag = do_upgrade(action.upgrade[0], action.upgrade[1], action.upgrade[2])
    elif action.backup:
        flag = do_backup(action.backup[0], action.backup[1])
    else:
        pass


def update(d, u):
    """
    递归更新 dictionary
    :param d: 源
    :param u: 目的
    :return:
    """
    if not d or not u:
        return
    # 防止数据格式变动, 如果变动, 则新的覆盖旧的
    if not isinstance(d, dict):
        d = u
    for k, v in u.iteritems():
        if isinstance(v, collections.Mapping):
            r = update(d.get(k, {}), v)
            d[k] = r
        else:
            d[k] = u[k]
    return d


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument('-update', nargs=3, dest='update')
    parser.add_argument('-upgrade', nargs=3, dest='upgrade')
    parser.add_argument('-backup', nargs=2, dest='backup')

    # print parser.parse_args()
    action = parser.parse_args()
    do_arg_actions(action)


flag = ERROR

if __name__ == '__main__':
    parse_args()
    sys.exit(flag)
