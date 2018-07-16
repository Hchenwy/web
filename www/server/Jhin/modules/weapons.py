# -*- coding:utf-8 -*-
import os
import json
import utils.rio as rio
from utils.log import log

logger = log('jhin.log')
logging = logger.logger


class Whisper(object):
    """
    The main weapon of Jhin made by himself.
    """
    DICT_ROOT = 'magazine'
    AMMUNITION_TYPE = '.json'
    ENV = 'AMMUNITION_PATH'
    AMMUNITION_PATH = '/etc/config'

    def __init__(self, path=None):
        self.magazine = None
        self.current_ammu_path = path

    def load(self, ammunition):
        """
        Load ammunition for base AMMUNITION_PATH, if the path not found, use default
        :param path:
        :param ammunition:
        :return:
        """
        filename = ammunition + self.AMMUNITION_TYPE

        if self.current_ammu_path is None:
            env_list = get_environment_list(self.ENV)
            file_in_env = find_ammunition_in_env(env_list, filename)
            if file_in_env:
                self.current_ammu_path = file_in_env
            else:
                self.make_default_config(ammunition)
        else:
            if not os.path.exists(self.current_ammu_path):
                self.make_default_config(ammunition)
            self.current_ammu_path = os.path.join(self.current_ammu_path, filename)

        # print 'path', path
        try:
            logging.info("JHIN load ammunition %s" % self.current_ammu_path)
            jsondict = rio.load_json(self.current_ammu_path)

        except (IOError, ValueError) as e:
            logging.error("JHIN ERROR load error %s" % e.message)
            return dict()

        return jsondict

    def make_default_config(self, ammunition):
        makedir(self.AMMUNITION_PATH)
        self.current_ammu_path = init_ammunition(ammunition, self.AMMUNITION_TYPE, self.AMMUNITION_PATH)
        logging.info('Nothing found in ammunition path, try to create a new one!')
        logging.info('ammunition path is %s' % self.current_ammu_path)

    def fill_magazine(self, ammunition):
        """
        Fill whisper's magazine, it's time to kill somebody.
        :param path:
        :param ammunition:
        :return:
        """
        self.magazine = dict_to_magazine(jsondict=self.load(ammunition))
        if self.magazine is None:
            self.magazine = list()
            # print '>> The stage is set.'
            # print self.magazine

    def show_magazine(self):
        for index, bul in enumerate(self.magazine):
            print 'Bullet %s' % index
            print '\t warhead is:', bul.warhead
            print '\t powder is:', bul.powder
            print '\t shell is:', bul.shell

    def fire(self, warhead, target_list=None):
        for bul in self.magazine:
            if bul.warhead == warhead:
                return bul.explode(target_list)

    def full_burst(self):
        return magazine_to_dict(self.magazine)

    def reload(self, bullet):
        self.disarm(bullet)
        self.magazine.append(bullet)

    def disarm(self, bullet):
        bullet = self.find_in_magazine(bullet.warhead)
        if not bullet:
            return
        self.magazine.remove(bullet)
        return bullet

    def find_in_magazine(self, warhead):
        for bul in self.magazine:
            if bul.warhead == warhead:
                return bul

    def in_magazine(self, warhead):
        for bul in self.magazine:
            if bul.warhead == warhead:
                return True

    def disarm_all(self):
        self.magazine = list()

    def final_shot(self):
        mygirl = json.dumps(magazine_to_dict(self.magazine), indent=4)

        try:
            rio.write(self.current_ammu_path, mygirl)
        except IOError as e:
            logging.error("JHIN ERROR %s" % e.message)
            return False
        return True


class Bullet(object):
    def __init__(self, warhead=None, powder=None, shell=None):
        self.warhead = warhead
        self.powder = powder
        self.shell = shell

    def explode(self, target_list):
        return find(target_list, self.powder)

    def change_in_powder(self, target_list, new_powder):
        if target_list:
            change(new_powder, target_list, self.powder)
        else:
            self.powder = new_powder


def dict_to_magazine(jsondict=None):
    if jsondict is None:
        logging.info('>> ERROR: There is no bullet in magazine, check weapon box correct!')
        return
    magazine = list()
    for key, value in jsondict.items():
        magazine.append(Bullet(warhead=key, powder=value))
    return magazine


def magazine_to_dict(magazine=list):
    if not isinstance(magazine, list):
        logging.info('>> ERROR: Magazine type is not right, check!')
        return
    maga_temp = dict()
    for bul in magazine:
        maga_temp[bul.warhead] = bul.powder
    return maga_temp


def find(target_list, src_dict):
    # 递归通过list中的key, 找dict中的对应值
    if target_list and isinstance(src_dict, dict):
        top = target_list.pop(0)
        if top in src_dict and isinstance(src_dict.get(top), dict):
            find(target_list, src_dict(top))
        else:
            return src_dict.get(top)
    return src_dict
    # try:
    #     top = target_list.pop(0)
    #     if len(target_list):
    #         if top in src_dict:
    #             return find(target_list, src_dict.get(top))
    #     else:
    #         if isinstance(src_dict, list):
    #             return src_dict
    #         elif isinstance(src_dict, dict):
    #             return src_dict.get(top)
    #         else:
    #             return top
    # except TypeError:
    #     logging.error('>> Can\'t find the target.')
    #     logging.error('>> Nothing change!')


def change(value, target_list, src_dict):
    try:
        top = target_list.pop(0)
        if len(target_list):
            if top in src_dict:
                change(value, target_list, src_dict.get(top))
        else:
            src_dict[top] = value
    except TypeError:
        logging.error('>> Can\'t find the target.')
        logging.error('>> Nothing change!')
        exit(1)


def init_ammunition(name, file_type, path):
    init_string = '{}'
    abs_path = '{file_path}/{file_name}{file_type}'.format(file_path=path, file_name=name, file_type=file_type)
    try:
        # create path if not found
        if not os.path.exists(path):
            # create
            makedir(path)
        # create file if not found
        if not os.path.exists(abs_path):
            with open(abs_path, 'w') as f:
                f.write(init_string)
                f.close()
        return abs_path

    except (SystemError, IOError) as e:
        logging.error('>> ERROR: create ammunition %s failed, check your permission!' % abs_path)
        logging.error('>> ERROR: %s' % e.message)
        exit(1)


def get_environment_list(env_name):
    try:
        return str.split(os.environ[env_name], ':')
    except KeyError:
        logging.error('>> ERROR: Can\'t load environment variable! Set to None')
        return None


def find_ammunition_in_env(env_list, ammunition):
    if isinstance(env_list, list):
        for env in env_list:
            if ammunition in os.listdir(env):
                return '{env}/{ammunition}'.format(env=env, ammunition=ammunition)
    return None


def test_whisper():
    whisper = Whisper()
    whisper.fill_magazine('network')
    print '\nfire bridges'
    print whisper.fire('bridges')
    print '\nfire all'
    print whisper.full_burst()
    # print '\nremove interfaces'
    # whisper.disarm('interfaces')
    print '\nfinal shot'
    # whisper.final_shot()


def test_find():
    # test find
    target_list = ['bridge', 'sub_dict', 'name']
    src_dict = {
        "interface": ["eth0", "eth1", "eth2", "eth3", "eth4", "eth5"],
        "ip": "192.168.1.1",
        "mac": "08:00:27:70:CD:1A",
        "mask": "255.255.255.0",
        "name": "br0",
        "bridge": {
            "ip": 'xxxx',
            "mac": 'xxx222',
            'vlan': ['333', '222'],
            'sub_dict': {'name': 'xfffdfdf'}
        },
        "vlan": ["100", "200"]
    }
    print find(target_list, src_dict)


def test_change():
    target_list = ['bridge', 'sub_dict']
    src_dict = {
        "interface": ["eth0", "eth1", "eth2", "eth3", "eth4", "eth5"],
        "ip": "192.168.1.1",
        "mac": "08:00:27:70:CD:1A",
        "mask": "255.255.255.0",
        "name": "br0",
        "bridge": {
            "ip": 'xxxx',
            "mac": 'xxx222',
            'vlan': ['333', '222'],
            'sub_dict': {'name': 'xfffdfdf'}
        },
        "vlan": ["100", "200"]
    }
    change({'name': '2000000'}, target_list, src_dict)
    print src_dict


def makedir(path):
    try:
        path = path.strip()
        path = path.rstrip("\\")

        is_exists = os.path.exists(path)

        if not is_exists:
            os.makedirs(path)
            return True
        else:
            return False
    except OSError:
        logging.error('create dir error')
        exit(1)


if __name__ == '__main__':
    # for test
    # test whisper
    test_whisper()
    # test_find()
    # test_change()
