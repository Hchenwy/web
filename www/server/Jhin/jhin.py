# -*- coding: utf-8 -*-
from os.path import basename
from os.path import dirname
from os.path import abspath
import os
import json
import sys
import getopt
import argparse
import ast

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

from modules.weapons import Whisper
from modules.weapons import Bullet


class Jhin(object):
    """ In carnage, I bloom, like a flower in the dawn. """

    def __init__(self):
        # load whisper
        # self.whisper = Whisper()
        # magazine can be given by whisper
        # self.magazine = self.whisper.magazine
        self.whisper = None

    def load_whisper(self, ammunition, path=None):
        """
        Load whisper, use the ammunition name.
        :param path:
        :param ammunition:
        :return:
        """
        if ammunition is None or ammunition == "":
            raise SyntaxError("ammunition is necessary!")
        if path is None:
            self.whisper = Whisper()
        else:
            self.whisper = Whisper(path=path)

        self.whisper.fill_magazine(ammunition)

    def add(self, warhead, powder):
        """
        Add bullet to whisper.

        Usage: Jhin.add(key, value)
        key must be string and value can be anything.
        :param warhead: key
        :param powder: value
        :return:
        """
        # prepare bullet
        bullet = Bullet(warhead=warhead, powder=powder)
        self.whisper.reload(bullet)

    def add_all(self, magazine):
        """
        Add the whole magazine to whisper.
        magazine's type must be dict

        Usage: Jhin.add_all({'test': 'abc'})
        :param magazine: dict
        :return:
        """
        self.whisper.disarm_all()
        for key, value in magazine.items():
            self.add(key, value)

    def set(self, value, bullet_name, *targets):
        """
        Set any powder to bullet.

        Usage:
            Modify the ip address in bridge0 --> route --> ip_address in
            {'bridge0': { 'route': { 'ip_address': 'xxx'}}}
            can use:
            Jhin.set('192.168.1.1', 'bridge0', 'route', 'ip_address')

        :param value: can be anything
        :param bullet_name:
        :param targets: path to positioning the value
        :return:
        """
        bullet = Bullet(bullet_name)
        target_list = self.__generate_target__(targets)
        bullet.change_in_powder(target_list, value)
        self.whisper.reload(bullet)

    def delete(self, bullet_name):
        bullet = Bullet(warhead=bullet_name)
        self.whisper.disarm(bullet)

    def get(self, bullet_name, *targets):
        """
        Get the whole bullet or any value in powder target

        Usage:
            Get the ip address in bridge0 --> route --> ip_address in
            {'bridge0': { 'route': { 'ip_address': 'xxx'}}}
            can use:
            Jhin.get('bridge0', 'route', 'ip_address')
            >> xxx
        :param bullet_name:
        :param targets: path to positioning the value
        :return:
        """
        return self.whisper.fire(bullet_name, list(targets))

    def get_all(self):
        return self.whisper.full_burst()

    def get_all_as_json(self):
        return json.dumps(self.get_all(), sort_keys=True)

    def get_as_json(self, bullet_name, *targets):
        return json.dumps(self.get(bullet_name, targets), sort_keys=True)

    def abandon(self):
        return self.whisper.disarm_all()

    def curtain_call(self):
        """
        And now, the curtain rises.

        Commit any change & write to file.
        :return:
        """
        return self.whisper.final_shot()

    @staticmethod
    def __generate_target__(targets):
        target_list = list()
        for t in targets:
            if isinstance(t, str):
                target_list.append(t)
        return target_list


# FOR CLI
flag = None
args = None


def parse_args():
    """
    Parses the command-line arguments given by the user and takes the
    appropriate action for each
    """
    global flag
    global args

    if len(sys.argv) <= 2:
        usage()
        sys.exit(0)

    try:
        opts, args = getopt.getopt(sys.argv[1:], "", ["help", "usage", "get", "set", "commit"])
    except getopt.GetoptError as error:
        print(str(error))
        print("Run '%s --usage' for further information" % sys.argv[0])
        sys.exit(1)

    # print opts
    for opt, arg in opts:
        if opt == "--help" or opt == "--usage":
            usage()
            sys.exit(0)
        if opt == "--get":
            flag = 'get'
        if opt == "--set":
            flag = 'set'
        if opt == "--commit":
            flag = 'commit'


def do_arg_actions():
    global flag
    global args
    jhin = Jhin()
    filename = args.pop(0)
    jhin.load_whisper(filename)

    if flag == 'get':
        if len(args) == 0:
            print jhin.get_all_as_json()
        else:
            bullet_name = args.pop(0)
            print jhin.get(bullet_name, *args)
    if flag == 'set':
        if len(args) == 0:
            print usage()
        elif len(args) == 2:
            bullet_name = args.pop(0)
            jhin.add(bullet_name, args)
            jhin.curtain_call()

    if flag == 'commit':
        pass


def usage():
    # argv0 = basename(sys.argv[0])
    print("""
    Usage:
    ------
         %(argv0)s [options] FILENAME KEY0, KEY1, KEY2....

    Options:
        --get:
            Get the content in file, return as json
        --set:
            You know
        --commit:
            Not supported yet

    Examples:
        %(argv0)s --get network
        %(argv0)s --get network bridges
        %(argv0)s --get network bridge0 interfaces
     """ % locals())


def main():
    parse_args()
    do_arg_actions()


def main2():
    parse_args2()


def parse_args2():
    parser = argparse.ArgumentParser()

    parser.add_argument('--get', nargs='+', dest='get')
    parser.add_argument('--set', nargs='+', dest='set')
    parser.add_argument('--kv', nargs=2, dest='kv')
    parser.add_argument('--k', action='store', dest='k')
    parser.add_argument('--p', action='store', dest='p')
    parser.add_argument('--index', nargs=1, dest='index', type=int)

    # print parser.parse_args()
    argobj = parser.parse_args()

    do_arg_actions2(argobj)


def do_arg_actions2(obj):
    global jhin
    result = None

    if obj.p:
        p = os.path.abspath(obj.p)
        if not os.path.exists(p):
            print 'not existed path'
            sys.exit(7)
    else:
        p = None

    if obj.get:
        result = opt_get(obj.get, p)
        if obj.kv:
            key = obj.kv[0]
            value = obj.kv[1]
            result = find_kv_in_list(key, value, result)
            if obj.k:
                key = obj.k
                result = find_v_in_dict(key, result)
    elif obj.set:
        result = opt_get(obj.set, p)
        if obj.kv:
            key = obj.kv[0]
            value = obj.kv[1]
            if isinstance(result, dict):
                result.update({key: value})
                jhin.add(key, value)
                jhin.curtain_call()
            else:
                result = None
    else:
        pass
    if result is None:
        print 'nothing found'
        sys.exit(1)
        # print usage()
    print ast.literal_eval(json.dumps(result))
    sys.exit(0)


def opt_get(opt, path):
    global jhin
    # [0] filename
    # [1] bullet name
    jhin.load_whisper(opt.pop(0), path=path)
    if opt:
        bullet = opt.pop(0)
        target = tuple(opt)

        # list to tuple has a noise comma --> ('enable',)
        # it can be double brackets ((enable)) and get wrong
        if len(target) == 0:
            rv = jhin.get(bullet)
        elif len(target) == 1:
            rv = jhin.get(bullet, target[0])
        else:
            rv = jhin.get(bullet, target)
    else:
        rv = jhin.get_all()
    return rv


def opt_set():
    pass


def find_kv_in_list(key, value, kvlist):
    # result is list, and its items are dicts
    if not isinstance(kvlist, list):
        return None
    for item in kvlist:
        if isinstance(item, dict) and key in item and item[key] == value:
            return item


def find_v_in_dict(key, kdict):
    if not isinstance(kdict, dict):
        return None
    return kdict.get(key) if key in kdict else None


jhin = Jhin()
if __name__ == '__main__':
    # main()
    main2()
