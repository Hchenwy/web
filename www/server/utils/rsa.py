# -*- coding: UTF-8 -*-
from M2Crypto import RSA, BIO


def pub_encrypt_with_pubkeystr(msg, pub_key):
    # en with pub_key
    try:
        bio = BIO.MemoryBuffer(str(pub_key))
        rsa_pub = RSA.load_pub_key_bio(bio)
    except:
        return ''
    return pub_encrypt(msg, rsa_pub)


def pub_encrypt_with_pubkeyfile(msg, filename):
    # en with pub filename
    cert_str = file(filename, "rb").read()
    try:
        pub_bio = BIO.MemoryBuffer(str(cert_str))
        rsa_pub = RSA.load_pub_key_bio(pub_bio)
    except:
        return ''
    return pub_encrypt(msg, rsa_pub)


def pub_encrypt(msg, rsa_pub):
    # en with RSA obj
    ctxt_pri = rsa_pub.public_encrypt(str(msg), RSA.pkcs1_padding)
    ctxt64_pri = ctxt_pri.encode('base64')
    #print ('密文:%s'% ctxt64_pri)
    return ctxt64_pri


def pub_decrypt_with_pubkeyfile(msg, file_name):
    # de with pub file
    cert_str = file(file_name, "rb").read()
    try:
        pub_bio = BIO.MemoryBuffer(str(cert_str))
        rsa_pub = RSA.load_pub_key_bio(pub_bio)
    except:
        return False, ''
    return pub_decrypt(msg, rsa_pub)


def pub_decrypt_with_pubkeystr(msg, pub_key):
    # de with pub str
    try:
        bio = BIO.MemoryBuffer(str(pub_key))
        rsa_pub = RSA.load_pub_key_bio(bio)
    except:
        return False, ''
    return pub_decrypt(msg, rsa_pub)


def pub_decrypt(msg, rsa_pub):
    # de with pub rsa obj
    ctxt_pri = str(msg).decode("base64")  # str -> base64
    output = ''
    try:
        while ctxt_pri:
            input = ctxt_pri[:128]
            ctxt_pri = ctxt_pri[128:]
            out = rsa_pub.public_decrypt(input, RSA.pkcs1_padding)  # decode
            output = output + out
    except:
        return False, output
    #print('明文:%s' % output)
    return True, output


if __name__ == "__main__":
    cert_str = file("test.pem", "rb").read()  # read pub key
    cert_str = '''-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEdtOCG7+7Os4+XrUNdSYDdluo\nrxh9r68u5+7QPOSYkPJKY6b//lg1LM8MJO5BKX4dopGJr4BNTidXtGZm2/RDHjWM\nBSsAb+dpcV7iqUSNOumo3OXZ9ukQVEmr11ueTUXk0a3BU3Hun/AtjZdPAd9HNfNM\ndE3Op7nZ3LxGd/0mdwIDAQAB\n-----END PUBLIC KEY-----\n'''
    primsg = """T5+/1YYNzp3QEP2IBlax4V3bwqqBixi3eBAbCUozoJmy1IPENot/1Qw9nRV3hgH8XYqzWCFIc0I/\nT2G8HilMcjH++36oXFEPGgMayW9fdrMxy5SzFpHEfvPAri2LX6NHc8c4nkzHuSN50Z6e1lnn/5T0\nGiehY41uzuk27j0Vnnk=\n"""

    # obj decode
    pub_bio = BIO.MemoryBuffer(cert_str)
    pub_key = RSA.load_pub_key_bio(pub_bio)
    pub_decrypt(primsg, pub_key)
    # str decode
    pub_decrypt_with_pubkeystr(primsg, cert_str)
    # file decode
    pub_decrypt_with_pubkeyfile(primsg, 'test.pem')


    pubmsg = 'test'
    # obj encode
    pub_bio = BIO.MemoryBuffer(cert_str)
    pub_key = RSA.load_pub_key_bio(pub_bio)
    pub_encrypt(pubmsg, pub_key)
    # str encode
    pub_encrypt_with_pubkeystr(pubmsg, cert_str)
    # file encode
    pub_encrypt_with_pubkeyfile(pubmsg, 'test.pem')
