from Jhin.jhin import Jhin

jhin = Jhin()

jhin.load_whisper('webauth')
auth = {
    "ios_opt": "0",
    "enable": "1",
    "black_mac": ["b0:83:fe:84:12:54", "b0:83:fe:84:12:56", "b0:83:fe:84:12:58"],
    "ssid": "RUIJIE",
    "listen_port": "28060",
    "wxerr_rangetime": "3600",
    "wxerr_restime": "3600",
    "wxerr_count": "5",
    "white_mac": ["3c:97:0e:06:53:a8", "3c:97:0e:06:53:a6", "3c:97:0e:06:53:a4"],
    "white_domain": ["www.baidu.com", "www.so.com", "112.136.58.63"],
    "wx_escape": "1",
    "interface": ["br0", "br1"],
    "WD_CheckTime2": "0",
    "wmc_alivetime": "1800",
    "auth_server": "112.124.31.88",
    "MacPass": "1",
    "timeout": "30",
    "userescape_time": "3600",
    "wxwifi": "1",
    "black_ip": ["192.168.121.12", "192.168.121.13", "192.168.121.14"],
    "black_domain": ["www.hao123.com", "www.douban.com", "128.145.45.123"],
    "white_ip": ["192.168.111.12", "192.168.111.13", "192.168.111.14"]
}
jhin.add_all(auth)
jhin.curtain_call()

print jhin.get('wx_escape')
print jhin.get('white_ip')
print jhin.get_all()
