import fcntl
import time
import traceback
import json
import os
from utils.log import log

logger = log('rio.log')
logging = logger.logger


def write(filename, context):
    __w_option(filename, context, 'write')


def append(filename, context):
    __w_option(filename, context, 'append')


def flush(filename):
    __w_option(filename, None, 'flush')


def sys_output_list(output):
    ls = list()
    while True:
        line = output.readline()
        if not line:
            break
        ls.append(line.replace('\n', ''))
    return ls


def sys_output_line(output):
    return output.readline().replace('\n', '')


def read_all(filename):
    try:
        with open(filename, 'a+') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            content = f.read()
            f.close()
        return content
    except IOError:
        logging.error(traceback.print_exc())
        return False


def readaline(filename, default=False):
    try:
        with open(filename, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            content = f.readline()
            f.close()
    except IOError:
        # print filename
        # logging.error(traceback.print_exc())
        return default
    return content.replace('\n', '')


def load_json(jsonfile):
    try:
        with open(jsonfile, 'a+') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            content = json.load(f)
            f.close()
        return content
    except IOError:
        logging.error(traceback.print_exc())


def __w_option(filename, context, flag='flush'):
    try:
        with open(filename, 'a+') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            logging.info('rio >> get lock success fid is %s' % f.fileno())
            if flag == 'flush':
                f.truncate()
            elif flag == 'write':
                f.truncate()
                f.write(context)
            elif flag == 'append':
                f.write(context)
                f.write('\n')
            else:
                pass
            logging.info('rio >> write file done')
            # sync to file system
            # os.system('sync -f %s' % filename)
            f.close()
    except IOError:
        logging.error(traceback.print_exc())
