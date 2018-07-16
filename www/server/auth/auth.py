import sys
import os
import getopt

from os.path import dirname
from os.path import abspath

try:
    f = os.readlink(__file__)
except (OSError, AttributeError):
    f = __file__
path = dirname(dirname(abspath(f)))
sys.path.insert(0, path)

import network.network as network
from Jhin.jhin import Jhin

jhin = Jhin()
jhin.load_whisper('auth')


def main():
    enable = jhin.get('enable')
    if enable == '1':
        network.start_bridge_netfilter()
    else:
        network.stop_bridge_netfilter()


if __name__ == '__main__':
    try:
        opts, args = getopt.getopt(sys.argv[1:], "", ["start", "stop"])
    except getopt.GetoptError as error:
        print(str(error))
        print("Run '%s --usage' for further information" % sys.argv[0])
        sys.exit(1)

    for opt, arg in opts:
        if opt == '--start':
            main()
        elif opt == '--stop':
            pass
        else:
            print 'WRONG OPTION'
            exit(1)
