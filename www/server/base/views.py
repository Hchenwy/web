# coding=utf-8
import json
import os
import re

import operator
from django.http import JsonResponse, StreamingHttpResponse

from Jhin.jhin import Jhin
from cms.lic import check_lic, CAN_TRY_USE
from cms.sync_info import sync_info_api
from config.check_conf import check_webport, check_snmp
from config.views import deal_snmp, deal_web_port
from log_center.operate_log import write_operate_log
from network.network import get_all_interfaces_info
from utils.net_tools import force_restart
from utils.tools import get_pppoe_dns, get_dhcp_info, get_ppp_time, flow_change, set_pwd, gam_status, \
    factory_reset
from utils.decrypt import encrypt, decstr, M2decrypt
import datetime
import time
from utils.log import log
from utils.upfix import fix_snmp_conf

logname = "server.log"
logger = log(logname)
logging = logger.logger


def maketoken(request):
    starttime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    users = os.popen('cat /etc/web_user').read()[:-1]
    pwd = ''
    if users:
        pwd = users.split(':')[1]
        pwd = decstr(pwd)
    token = encrypt(starttime + '###' + pwd)
    os.popen2("echo %s>>token" % token)
    return token


def chekctoken(request):
    token = request.COOKIES.get('token')
    if not token:
        return False
    tokens = os.popen("cat token").read()
    if token not in tokens:
        return False
    else:
        token = decstr(token)
        token_time, pwd = token.split("###")
        start_time = datetime.datetime.strptime(token_time, '%Y-%m-%d %H:%M:%S')
        end_time = datetime.datetime.now()
        if (end_time - start_time).days >= 1:
            os.popen2("sed -i '/%s/'d token" % token)
            return False
        users = os.popen('cat /etc/web_user').read()[:-1]
        s_pwd = ''
        if users:
            s_pwd = users.split(':')[1]
            s_pwd = decstr(s_pwd)
        if pwd != s_pwd:
            os.popen2("sed -i '/%s/'d token" % token)
            return False
        return True


def check_user(username, password):
    user_info = os.popen('cat /etc/web_user').read()
    if user_info:
        user_info = user_info[:-1]
    else:
        return False
    s_username, s_pwd = user_info.split(':')
    s_pwd = decstr(s_pwd)
    import hashlib
    m_s_pwd = hashlib.md5(s_pwd).hexdigest()
    if m_s_pwd == password and s_username == username:
        return True
    else:
        return False


def login(request):
    data = request.GET
    username = data.get('username')
    password = data.get('password')
    if check_user(username=username, password=password):
        token = maketoken(request=request)
        write_operate_log('admin', request.META.get('REMOTE_ADDR'), '登入')
        response = JsonResponse({'result': 'ok'})
        response.set_cookie('token', token, max_age=3600 * 6)
        return response
    else:
        return JsonResponse({'result': 'failed'})


def logout(request):
    token = request.COOKIES.get('token')
    os.popen2("sed -i '/%s/'d token" % token)
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '登出')
    return JsonResponse({'result': 'ok'})




def req_set_pwd(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'data type is not json', 'error': 'JSON_ERROR'})
    pwd = data.get('pwd')
    old_pwd = data.get('old_pwd')
    user_info = os.popen('cat /etc/web_user').read()[0:-1]
    if user_info:
        if str(old_pwd) != decstr(str(user_info.split(':')[1])):
            return JsonResponse({'result': 'failed', 'msg': '旧密码错误'})
    if pwd:
        set_pwd(str(pwd))
        sync_info_api()
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '修改密码')
    return JsonResponse({'result': 'ok'})


def rw_dev_info(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'data type is not json', 'error': 'JSON_ERROR'})
    sn = data.get('sn')
    product = data.get('product')
    if sn:
        os.popen("echo %s >/etc/SerialNumber" % sn)
    if product:
        os.popen("echo %s >/etc/product" % product)
        os.popen2("sleep 0.2;syslc restart")
        device_number = None
        if product == 'SURF-W-GW500':
            device_number = 'DeviceNum=001100'
        elif product == 'SURF-W-GW1000':
            device_number = 'DeviceNum=001101'
        elif product == 'SURF-W-GW2000':
            device_number = 'DeviceNum=001102'
        elif product == 'SURF-W-GW300':
            device_number = 'DeviceNum=001103'
        if device_number:
            old_device_number = os.popen('cat /usr/Install_gam/config.ini  | grep DeviceNum').read()[0:-1]
            if old_device_number:
                os.popen("sed -i 's/%s/%s/g' /usr/Install_gam/config.ini" % (old_device_number, device_number))
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '修改了设备信息')
    os.popen2('cmsclient restart')
    return JsonResponse({'result': 'ok'})


# 因为cpu返回比较慢，所以单独返回
def cpu_status(request):
    cpu = os.popen("lsap --cpu").read()[:-2]
    return JsonResponse({'result': 'ok', 'msg': cpu})


def get_snmp(request):
    jhin = Jhin()
    jhin.load_whisper("snmp_ipmac")
    conf = jhin.get("snmp")
    for item in conf:
        item['sta_status'] = gam_status(item.get('ip'))
    return JsonResponse({'result': 'ok', 'msg': conf})


def set_snmp(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'data type is not json', 'error': 'JSON_ERROR'})
    snmp = data.get('snmp', [])
    logging.info('(base) set snmp:%s'% snmp)
    ret_c, msg_c = check_snmp(snmp)
    if not ret_c:
        return JsonResponse({'result': 'failed', 'msg': msg_c})
    deal_snmp(snmp)
    logging.info('(base) snmp_scan restart')
    os.popen2('snmp_scan restart')
    logging.info('(base) webauth reload')
    os.popen2('sleep 1;webauth reload')
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '修改了用户扫描')
    return JsonResponse({'result': 'ok'})



def upload_soft(request):
    if request.method == 'POST':
        logging.info('(base) begin upload package to upgrade')
        filename_base = 'RG_BCR_X86'
        filename = '%s.bin' % filename_base
        f = request.FILES['path']
        if not f.name.endswith('.bin'):
            logging.error('(base) upload file type error!')
            return JsonResponse({'result': 'failed', 'msg': '文件类型错误'})
        try:
            option = request.POST
        except:
            return JsonResponse({'result': 'failed', 'msg': 'parametes error'})
        save_conf = str(option.get('save_conf', 'false'))  # 是否保留配置升级 true/false

        # 保存上传的文件
        of = open('/opt/%s' % filename, 'wb+')
        for chunk in f.chunks():
            of.write(chunk)  # 写入内容
        of.close()

        # 解压, 等待解压完成
        os.popen('tar -zxvf /opt/%s -C /opt' % filename).read()
        target_ver = os.popen("cat /opt/%s/etc/version" % filename_base).read()[:-1]
        now_ver = os.popen("cat /etc/version").read()[:-1]
        # if now_ver and target_ver and now_ver > '5' and target_ver < '2':
        if now_ver and target_ver and now_ver > target_ver:
            return JsonResponse({'result': 'failed', 'msg': '当前版本%s不支持降级到%s' % (now_ver,target_ver)})
        os.popen2('rm -f /opt/%s' % filename)
        logging.info('(base) begin upgrade dev...')
        # 保留一份升级包里面的配置，作为还原配置用
        if not os.path.isdir('/etc/config/default'):
            os.popen('mkdir /etc/config/default')
        os.popen('cp /opt/%s/etc/config/* /etc/config/default' % filename_base)
        if str(save_conf) == 'false':  # 不保留配置
            logging.info('(base) not save conf upload')
            # os.popen('cp /opt/%s/etc/config/*  /etc/config' % filename_base)
            set_pwd('admin')
            os.popen2('sh /opt/%s/install.sh' % filename_base)
        else:  # 保留配置升级
            fix_snmp_conf()
            logging.info('(base) save conf upload')
            os.popen2('sh /opt/%s/install.sh save_config' % filename_base)
        logging.info('(base) upgrade success')
        write_operate_log('admin', request.META.get('REMOTE_ADDR'), '进行了升级，版本%s升级到版本%s' % (now_ver, target_ver))
        return JsonResponse({'result': 'ok', 'msg': '升级完成，设备将重启'})
    else:
        return JsonResponse({'result': 'failed', 'msg': 'json参数错误'})


def reboot(request):
    # kill_cms()
    # os.popen2('reboot')
    logging.info('(base) reboot dev')
    logging.info('(base) stop cmsclient')
    os.popen2('sleep 3;cmsclient stop')
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '重启了设备')
    force_restart()
    return JsonResponse({'result': 'ok'})


def reset_conf(request):
    # 密码重置
    logging.info('(base) reset dev')
    logging.info('reset password')
    jhin = Jhin()
    jhin.load_whisper("network")
    mode = jhin.get("mode")
    factory_reset(mode)
    force_restart()
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '恢复出厂配置')
    return JsonResponse({'result': 'ok'})


def cli_status(request):
    is_control = str(os.popen('lsap --product').read()[0:-1]).startswith('SURF')
    if os.path.exists('/etc/config/sys_lic.json'):
        if not check_lic() and is_control:
            jhin = Jhin()
            jhin.load_whisper("sys_lic")
            try:
                used = M2decrypt(jhin.get('used'))
            except:
                return JsonResponse({'result': 'ok', 'msg': 'used desctr error'})
            if not used:
                return JsonResponse({'result': 'ok', 'msg': 'licence check ok'})
            remain_seconds = CAN_TRY_USE - int(used)
            return JsonResponse({'result': 'failed', 'remain': remain_seconds, 'msg': 'licence check error'})
        else:
            return JsonResponse({'result': 'ok', 'msg': 'licence check ok'})
    else:
        return JsonResponse({'result': 'ok', 'msg': 'licence check ok'})


def get_logs(request):
    def file_iterator(file_name, chunk_size=512):
        with open(file_name) as f:
            while True:
                c = f.read(chunk_size)
                if c:
                    yield c
                else:
                    break
    file_name = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    os.popen('mkdir /opt/%s' % file_name)
    os.popen('mkdir /opt/%s/dhcp' % file_name)
    os.popen('mkdir /opt/%s/pppoe' % file_name)
    os.popen('mkdir /opt/%s/system' % file_name)
    os.popen('mkdir /opt/%s/dhcpclient' % file_name)
    os.popen('mkdir /opt/%s/ipsec' % file_name)
    os.popen('mkdir /opt/%s/iptables' % file_name)
    os.popen('mkdir /opt/%s/config' % file_name)
    os.popen('mkdir /opt/%s/log' % file_name)
    os.popen('mkdir /opt/%s/mwan3' % file_name)


    # get iptables log
    os.popen('ipset -L >iptables_ipset')
    os.popen('iptables -t mangle -S>/opt/%s/iptables/iptables_mangle' % file_name)
    os.popen('iptables -t filter -S>/opt/%s/iptables/iptables_filter' % file_name)
    os.popen('iptables -t nat -S>/opt/%s/iptables/iptables_nat' % file_name)

    # get webauth log
    os.popen('cp /run/webauth* /opt/%s/' % file_name)

    # get www log
    os.popen('cp -r /www/server/log /opt/%s' % file_name)
    os.popen('cp -r /etc/config /opt/%s' % file_name)

    # get dev info
    os.popen('cp /etc/svn_version /opt/%s/system/' % file_name)
    os.popen('lsap >/opt/%s/system/lsap' % file_name)
    os.popen('ps aux >/opt/%s/system/ps' % file_name)
    os.popen('free >/opt/%s/system/free' % file_name)
    os.popen('df >/opt/%s/system/df' % file_name)

    # get dhcp log
    os.popen('journalctl /usr/sbin/dhcpd >/opt/%s/dhcp/dhcpd.log' % file_name)
    os.popen('cp /etc/dhcpd.conf /opt/%s/dhcp/' % file_name)
    os.popen('cp /var/db/dhcpd.leases /opt/%s/dhcp/' % file_name)

    # get pppoe log
    os.popen('journalctl /usr/sbin/pppd  >/opt/%s/pppoe/pppd.log' % file_name)
    os.popen('cp /etc/ppp/* /opt/%s/pppoe/' % file_name)

    # get dhcp client log
    os.popen('cp /usr/share/udhcpc/* /opt/%s/dhcpclient/' % file_name)

    # get ipsec log
    os.popen('journalctl /usr/libexec/ipsec/charon  > /opt/%s/ipsec/charon.log' % file_name)
    os.popen('ipsec statusall > /opt/%s/ipsec/statusall.log' % file_name)
    os.popen('cp /etc/config/ipsec.json /opt/%s/ipsec/' % file_name)
    os.popen('cp /etc/config/ipsec.conf /opt/%s/ipsec/' % file_name)
    os.popen('cp /etc/config/ipsec.secrets /opt/%s/ipsec/' % file_name)

    # get mwan3 log
    os.popen("echo '>>>>>>>>>>>mwan3 interfaces' >/opt/%s/mwan3/mwan3.log" % file_name)
    os.popen('mwan3 interfaces >> /opt/%s/mwan3/mwan3.log'  % file_name)
    os.popen("echo '>>>>>>>>>>>mwan3 status' >>/opt/%s/mwan3/mwan3.log"  % file_name)
    os.popen('mwan3 status >> /opt/%s/mwan3/mwan3.log' % file_name)

    os.popen('tar zcvf /opt/%s.tar.gz  -C /opt/ %s' % (file_name, file_name))
    os.popen2('rm -r /opt/%s' % file_name)

    response = StreamingHttpResponse(file_iterator('/opt/' + file_name + '.tar.gz'))
    response['Content-Type'] = 'application/octet-stream'
    response['Content-Disposition'] = 'attachment;filename="%s.tar.gz"' % file_name
    return response


def set_webport(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'data type is not json', 'error': 'JSON_ERROR'})
    webport = str(data.get('webport'))
    ret, msg = check_webport(webport)
    if not ret:
        return JsonResponse({'result': 'failed', 'msg': msg})
    deal_web_port(webport)
    write_operate_log('admin', request.META.get('REMOTE_ADDR'), '将外网端口修改为%s' % webport)
    return JsonResponse({'result': 'ok', 'msg': 'success'})


def get_webport(request):
    web_conf_info = os.popen("sed -n '/listen.*$/p' /usr/local/openresty/nginx/conf/vhost/web_server.conf").read()
    httport = re.findall(r'(\w*[0-9]+)\w*', web_conf_info)
    webport = httport[0] if len(httport) else 80
    return JsonResponse({'result': 'ok', 'webport': webport})


def two_times_interfaces_info():
    info_one = get_all_interfaces_info()
    time.sleep(0.1)
    info_two = get_all_interfaces_info()
    info_interface = info_two

    for item in info_two.keys():
        if item in info_one.keys():
            info_one_rx = int(info_one[item]['rx']) if (info_one[item]['rx']).isdigit() else 0
            info_one_tx = int(info_one[item]['tx']) if (info_one[item]['tx']).isdigit() else 0

            info_two_rx = int(info_two[item]['rx']) if (info_two[item]['rx']).isdigit() else 0
            info_two_tx = int(info_two[item]['tx']) if (info_two[item]['tx']).isdigit() else 0

            rx = abs(info_two_rx - info_one_rx)
            tx = abs(info_two_tx - info_one_tx)
        else:
            rx = 0
            tx = 0

        info_two[item]['rx'] = flow_change(rx*10)
        info_two[item]['tx'] = flow_change(tx*10)
        # info_two[item]['speed'] = '未绑定'
        info_two[item]['inter_name'] = '%s(未绑定)' % (str(info_two[item]['ifname']).upper())

    return info_interface


def interface_info():
    info = two_times_interfaces_info()
    jhin = Jhin()
    jhin.load_whisper('network')
    interfaces = jhin.get('interfaces')
    bridges = jhin.get('bridges')
    mode = jhin.get('mode')
    router = jhin.get('routes')
    gateway = ''

    for item_gateway in router:
        if item_gateway.get('ip') == '0.0.0.0':
            gateway = item_gateway.get('next_route')

    dns = jhin.get('dns_addr')
    dns_str = ''
    for item_dns in dns:
        dns_str += ' %s' % item_dns

    if mode == 'gateway' and interfaces:
        for item in interfaces:
            name = item.get('name')
            if name in info.keys():
                if item.get('proto'):
                    info[name]['proto'] = item.get('proto')
                    if item.get('proto') == 'pppoe':
                        if os.popen("ip route | grep ppp-%s | grep default" % name).read().strip('\n') and info[name]['status'] == 'up':
                            info[name]['gateway'], info[name]['dns'], info[name]['ip'], info[name][
                                'mask'] = get_pppoe_dns(name)
                            if info.has_key('ppp-%s' % name):
                                info[name]['rx'] = info['ppp-%s' % name]['rx']
                                info[name]['tx'] = info['ppp-%s' % name]['tx']
                            else:
                                info[name]['rx'] = '0.0B/s'
                                info[name]['tx'] = '0.0B/s'
                            info[name]['ppp-time'] = get_ppp_time(name)
                        else:
                            info[name]['status'] = 'down'
                            info[name]['ip'] = ''
                            info[name]['dns'] = ''
                            info[name]['gateway'] = ''
                            info[name]['rx'] = '0.0B/s'
                            info[name]['tx'] = '0.0B/s'
                    elif item.get('proto') == 'dhcp':
                        if info[name]['status'] == 'up':
                            info[name]['ip'], info[name]['gateway'], info[name]['dns'], info[name]['mask'] = get_dhcp_info(name)
                        else:
                            info[name]['ip'] = ''
                            info[name]['dns'] = ''
                            info[name]['gateway'] = ''
                    else:
                        info[name]['ppp-time'] = 0
                        if info[name]['status'] == 'up' and item.get('proto') == 'static':
                            info[name]['dns'] = dns_str
                            info[name]['gateway'] = gateway
                        else:
                            info[name]['dns'] = ''
                            info[name]['gateway'] = ''
                else:
                    if item.get('ip'):
                        info[name]['ip'] = item.get('ip')
                    if item.get('mac'):
                        info[name]['mac'] = item.get('mac')
                    if item.get('mask'):
                        info[name]['mask'] = item.get('mask')
                speed = '(%sM)' % info[name]['speed'] if info[name]['speed'] in ['10', '100', '1000'] else '(自动)'
                info[name]['speed'] = 'WAN%s%s' % (int(re.sub("\D", "", name))+1, speed)
                info[name]['inter_name'] = '%s(WAN%s)' % (str(name).upper(), int(re.sub("\D", "", name))+1)

                # wan口上下行流量兑换下
                tx = info[name]['tx']
                info[name]['tx'] = info[name]['rx']
                info[name]['rx'] = tx

    for item in bridges:
        name = item.get('name')
        lan_name = 'LAN%s'%(int(re.sub("\D", "", name))+1)
        br_interface = item.get('interface')
        mask = item.get('mask', '')
        for item_interface in br_interface:
            if item_interface in info.keys():
                speed = '(%sM)' % info[item_interface]['speed'] if info[item_interface]['speed'] in ['10', '100', '1000'] else '(自动)'
                info[item_interface]['speed'] = '%s%s' % (lan_name, speed)
                info[item_interface]['inter_name'] = '%s(%s)' % (str(info[item_interface]['ifname']).upper(), lan_name)
                if info[item_interface]['status'] == 'up':
                    info[item_interface]['dns'] = dns_str
                    info[item_interface]['gateway'] = gateway
                    info[item_interface]['ip'] = item.get('ip', '')
                    info[item_interface]['mask'] = mask
                else:
                    info[item_interface]['dns'] = ''
                    info[item_interface]['gateway'] = ''

    ret_info = []
    internet_mode = {'static': u'静态配置', 'dhcp': u'自动获取', 'pppoe': u'拨号上网'}
    for item in info.keys():
        ret_dict = {}

        if not ('eth' in str(item) and 'ppp' not in str(item) and '.' not in str(item)):
            continue
        info[item]['ifname'] = str(item).upper()
        if not info[item].get('proto'):
            info[item]['proto'] = 'static'
            info[item]['ppp-time'] = ''
        info[item]['proto'] = internet_mode.get(info[item]['proto'])
        if '未绑定' in info[item]['inter_name']:
            info[item]['speed'] = '未绑定'
        ret_dict = info[item]
        ret_info.append(ret_dict)
    ret_info.sort(key=operator.itemgetter('ifname'), reverse=False)

    return ret_info


def over_view(request):
    data = {}
    data['product'] = os.popen("lsap --product").read()[:-1]
    data['sn'] = os.popen("cat /etc/SerialNumber").read()[:-1]
    data['MAC'] = os.popen("lsap --mac").read()[:-1]
    data['zone'] = os.popen("lsap --mem").read()[:-2]
    data['version'] = os.popen("lsap --fversion").read()[:-1]
    up_seconds = os.popen("cat /proc/uptime | awk -F. '{print $1}'").read()[:-1]
    data['onlineTime'] = up_seconds
    data['uptime'] = (datetime.datetime.now() - datetime.timedelta(seconds=int(up_seconds))).strftime(
        '%Y-%m-%d %H:%M:%S')
    data['system'] = os.popen("df|grep -w / |awk 'NR==1{print}'|awk '{print $5}'").read()[:-2]
    data['interface_info'] = interface_info()
    return JsonResponse({'result': 'ok', 'msg': data})
