# coding=utf-8
import json
import os

from django.http import JsonResponse


def diag(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error', 'error': 'JSON_ERROR'})
    diag = data.get('diag')
    seq = data.get('seq')
    res = []
    is_end = False
    if diag == 'ping':
        ping_address = data.get('address')
        count = int(data.get('count', 5))
        pack_size = int(data.get('pack_size', 32))
        if str(seq) == "0":
            os.popen("ps x|grep ping|grep -v grep |awk '{print $1}' |xargs kill -9")
            os.popen(">tmp_ping")
            os.popen("echo '开始网络检测.... ...' > tmp_ping")
            cmd = "ping -c %s -s %s %s >>tmp_ping &" %(count, pack_size, ping_address)
            os.popen2(cmd)
        res = str(os.popen("cat tmp_ping").read())
        if not os.popen('ps x|grep ping|grep -v grep').read():
            is_end = True
    elif diag == 'tracer':
        if str(seq) == "0":
            os.popen("ps x|grep traceroute|grep -v grep |awk '{print $1}' |xargs kill -9")
            os.popen(">tmp_traceroute &")
            os.popen("echo '开始网络检测.... ...' > tmp_traceroute")
            trace_address = data.get('address')
            cmd = "traceroute -I %s >>tmp_traceroute &" % trace_address
            os.popen2(cmd)
        res = str(os.popen("cat tmp_traceroute").read())
        if not os.popen('ps x|grep traceroute|grep -v grep').read():
            is_end = True
    return JsonResponse({'result': 'ok', 'msg':res.replace('\n', '###'), "is_end": is_end})