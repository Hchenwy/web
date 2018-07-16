import argparse

parser = argparse.ArgumentParser()

parser.add_argument('--get', nargs='+', dest='get')
parser.add_argument('--set', nargs='+', dest='set')
parser.add_argument('--key', nargs=2, dest='key')
parser.add_argument('--index', nargs=1, dest='index')

v = parser.parse_args()
if v.get and v.key:
    print 'xxxx'
    print v.get
    print v.key
else:
    print 'ttt'
print parser.parse_args()
