# coding=utf-8
import binascii
from pyDes import des, CBC, PAD_PKCS5

key = 'Rj(*&@$^'
k = des(key, CBC, "00000000", pad=None, padmode=PAD_PKCS5)
k1 = des(key, CBC, "\1\2\3\4\5\6\7\x08", pad=None, padmode=PAD_PKCS5)
def encrypt(data):
    """
    加密模块
    :param data:
    :return:
    """
    detext = k.encrypt(data)
    return binascii.b2a_hex(detext)

def encrypt1(data):
    """
    加密模块
    :param data:
    :return:
    """
    detext = k1.encrypt(data)
    return binascii.b2a_hex(detext)


def decrypt(data):
    """
    解密字典模块
    :param data:
    :return:
    """
    try:
        c = binascii.a2b_hex(data)
        detext = k.decrypt(c, padmode=PAD_PKCS5)
        cc = eval(detext)
        # cc = json.loads(str(detext))
        return cc
    except:
        print 'decrypt error'
        return {}

def decstr(data):
    """
    解密字符串
    :param data:
    :return:
    """
    c = binascii.a2b_hex(data)
    detext = k.decrypt(c, padmode=PAD_PKCS5)
    return detext

def decstr1(data):
    """
    解密字符串
    :param data:
    :return:
    """
    c = binascii.a2b_hex(data)
    detext = k1.decrypt(c, padmode=PAD_PKCS5)
    return detext

from M2Crypto.EVP import Cipher
import base64
iv = '\0' * 16  # 初始化变量，对于aes_128_ecb算法无用
PRIVATE_KEY = '8017d4a156ede268bade96f816db1dxxj09' # 密钥


def M2encrypt(data):
    cipher = Cipher(alg = 'aes_128_ecb', key=PRIVATE_KEY, iv=iv, op=1)
    buf = cipher.update(data)
    buf = buf + cipher.final()
    del cipher
    return base64.b64encode(buf)

def M2decrypt(data):
    data = base64.b64decode(data)
    cipher = Cipher(alg='aes_128_ecb', key=PRIVATE_KEY, iv=iv, op=0)
    buf = cipher.update(data)
    buf = buf + cipher.final()
    del cipher
    return buf