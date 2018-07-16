import os


# print os.system('ls')
# cmd = "ip link show | awk '{print($2)'"
# readfile = os.popen(cmd)
# while True:
#     line = readfile.readline()
#     if not line:
#         break
#     print line

ADD = 'ip -4 address add {ip_addr} dev {intf_name}'
print ADD.format(ip_addr='1.1.1.1', intf_name='dev2')
