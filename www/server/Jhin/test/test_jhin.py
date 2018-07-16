# -*- coding: utf-8 -*-

from Jhin.jhin import Jhin
from pprint import pprint

jhin = Jhin()

jhin.load_whisper('mwan3', path='/home/jcheng/Sync/SmbProjects/X86_GW/5.1/application/www/server/Jhin/config')

# print jhin.get_all()
# # test modify by Jhin
# modify_external = ['eth0', 'eth1', 'eth2']
# modify_mode = 'bypass'
#
# print '++++++++++++ test add................'
# jhin.set(modify_external, 'external')
# jhin.set(modify_mode, 'mode')
# print '++++++++++++ result:................'
# print jhin.get_all_as_json()
# jhin.whisper.show_magazine()
#
#
# # jhin.abandon()
# jhin.curtain_call()
#
#
# print jhin.get_all()

print jhin.get_all()
print 'xxxx'
print jhin.get('eth0', ('enable',))
print 'xxxx'
print jhin.get('eth0', ())
