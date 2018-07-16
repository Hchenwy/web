import jsonmerge
import os
import json
import tempfile
import shutil
import copy
import getopt
import sys

from os.path import dirname
from os.path import abspath

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

from base.settings import BASE_DIR
from Jhin.jhin import Jhin
from utils.log import log

logger = log('ekko.log')
logging = logger.logger
# global variable
temp_dir = os.path.join(BASE_DIR, 'version', 'temp')
jhin = Jhin()
jhin.load_whisper('ekko', os.path.join(BASE_DIR, 'version', 'config'))


def generate_default_dir():
    """
    as this name
    :return: (local_dir, des_dir)
    """
    pass


def update_configure(local_dir, des_dir):
    """
    version config
    :param local_dir: local version package
    :param des_dir: the config which will be update
    :return:
    """
    global temp_dir

    # do update
    tail = '.json'
    try:
        local_files = os.listdir(local_dir)
        des_files = os.listdir(des_dir)

        for filename in local_files:
            if tail not in filename:
                continue
            if filename in des_files:
                write_to_temp_dir(filename, do_merge(filename, local_dir, des_dir))
            else:
                shutil.copy2(os.path.join(local_dir, filename), temp_dir)

        # replace files in temp to destination
        for filename in os.listdir(temp_dir):
            shutil.copy2(os.path.join(temp_dir, filename), des_dir)

    except IOError:
        logging.error(">> [upgrade_configure] The directory is NOT found! Check your setting!")
        exit(1)


def write_to_temp_dir(filename, content):
    global temp_dir
    with tempfile.NamedTemporaryFile('w', dir=temp_dir, delete=False) as tf:
        tf.write(content)
        tf.flush()
        # replace file
        shutil.move(tf.name, os.path.join(temp_dir, filename))


def sort_json_dump(file_path):
    try:
        with open(file_path) as f:
            output = json.load(f)
        return json.loads(json.dumps(output, sort_keys=True, indent=4))
    except (IOError, ValueError):
        logging.error(">> JSON load ERROR, check your file exist")
        exit(1)


def do_merge(filename, local_dir, des_dir):
    local_json = sort_json_dump(os.path.join(local_dir, filename))
    des_json = sort_json_dump(os.path.join(des_dir, filename))
    # print type(local_json)
    # print des_json
    # print(jsonmerge.merge(local_json, des_json))
    return json.dumps(jsonmerge.merge(local_json, des_json), indent=4)


def upgrade_version_one(des_dir):
    jhin = Jhin()

    # version network
    jhin.load_whisper('network', path=des_dir)

    # get gateway & dns address
    bridges = jhin.get('bridges')
    gateway = ""
    dns_addr = list()
    for br in bridges:
        if br.get('name') == 'br0':
            # print br
            gateway = br.get('gateway')
            dns_addr = br.get('dns')
            # delete gateway & dns_addr
            br.pop('gateway')
            br.pop('dns')

        # vlan
        # set switch as zero & vlan as []
        br['vlan_switch'] = '0'
        br['vlan'] = list()

    routes = [{"ip": "0.0.0.0", "mask": "0.0.0.0", "next_route": gateway}]
    jhin.delete('gateway')
    jhin.add('routes', routes)
    jhin.set(dns_addr, 'dns_addr')
    jhin.set(bridges, 'bridges')

    jhin.curtain_call()


def upgrade_configure(ver1, ver2, des_dir):
    print 'Ready to upgrade dir %s' % des_dir
    if ver1 == ver2:
        print 'Nothing to do, exit'
        return
    elif ver1 == 1 or ver1 == '1':
        upgrade_version_one(des_dir)
    else:
        pass


def get_dev_version(path):
    version = None

    if not check_paths(path):
        return version

    try:
        with open(path, 'r') as f:
            version = f.readline()
            f.close()
    except IOError:
        print 'Cannot get device version'
    return version[0]


def backup_configure(localdir, desdir):
    pass


def reset_configure(desdir, backupdir):
    pass


def check_paths(args):
    """
    all args must be a system path
    :param args:
    :return:
    """
    if isinstance(args, basestring):
        return os.path.exists(args)

    for arg in args:
        if not os.path.exists(arg):
            return False
    return True


def usage():
    argv0 = os.path.basename(sys.argv[0])
    print("""
    Usage:
    ------
         %(argv0)s [options] FILENAME KEY0, KEY1, KEY2....

    Options:
        --up:
            update config and keep origin configuration
        --dup:
            upgrade version one to version two
        --backup:
            Not supported yet

    Examples:
        %(argv0)s --up local_dir des_dir
        %(argv0)s --dup version1 version2 des_dir
        %(argv0)s --backup des_dir temp_dir
     """ % locals())


if __name__ == '__main__':
    try:
        opts, args = getopt.getopt(sys.argv[1:], "", ["up", "backup", "dup", "test"])
    except getopt.GetoptError as error:
        print(str(error))
        print("Run '%s --usage' for further information" % sys.argv[0])
        sys.exit(1)

    dev_version = jhin.get('device_version_path')
    tarball_version = jhin.get('update_version_path')
    print dev_version
    print tarball_version
    for opt, arg in opts:
        if opt == '--up':
            if not check_paths(args):
                print("Run '%s --usage' args must be directories!" % sys.argv[0])
                logging.error('[EKKO]: args must be directories!')
                sys.exit(1)
            # print 'do upgrade configure %s %s' % (args[0], args[1])
            # print 'dev_version', get_dev_version(dev_version)
            # print 'tarball', get_dev_version(tarball_version)
            update_configure(args[0], args[1])
            print 'update done!'
        elif opt == '--dup':
            upgrade_configure(args[0], args[1], args[2])
            print 'upgrade done!'
        elif opt == '--backup':
            # backup_configure(args[0], args[1])
            print 'do backup configure %s %s' % (args[0], args[1])
        else:
            usage()
            exit(1)
