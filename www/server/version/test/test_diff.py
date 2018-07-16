import jsondiff


before = {
    "bridges": [
        {
            "name": "br0",
            "ip": "192.168.1.1",
            "vlan": [
                "100",
                "200"
            ],
            "mask": "255.255.255.0",
            "mac": "08:00:27:70:CD:1A",
            "interface": [
                "eth0",
                "eth1",
                "eth2",
                "eth3",
                "eth4",
                "eth5"
            ]
        }
    ]
}
after = {
    "bridges": [
        {
            "mask": "255.255.255.0",
            "mac": "08:00:27:70:CD:1A",
            "interface": [
                "eth0",
                "eth1",
            ],
            "name": "br2",
            "ip": "233.233.233.233",
            "vlan": [
                "100",
                "200",
                "300"
            ]
        }
    ]
}

result = jsondiff.diff(before, after, syntax='explicit')
for key, value in result.items():
    print key, value
    print type(key), type(value)
    print isinstance(key, jsondiff.Symbol)
    print key.__dict__

print result
# print json.dumps(result, indent=4)
