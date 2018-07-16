# -*- coding:utf-8 -*-

from network import network
from Jhin import jhin

# nw = network.Network()

jhin = jhin.Jhin()

jhin.load_whisper('network')

initdata = network.get_default_bridge()

jhin.add_all(initdata)
jhin.curtain_call()
