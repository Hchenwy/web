import os
from utils.log import log

logger = log('server.log')
logging = logger.logger


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
        logging.error('[OS_UTILS] create dir error')
        exit(1)
