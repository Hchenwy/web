# coding=utf-8
import json

import operator
import os
import datetime
from django.http import JsonResponse

from Jhin.jhin import Jhin
LOG_PATH = '/var/log/'


def user_log(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})
    begin_date = data.get('begin_date', None)
    end_date = data.get('end_date', None)
    num = data.get('num', 20)
    jhin = Jhin()
    jhin.load_whisper('operate_log', LOG_PATH)
    logs = jhin.get('logs')
    logs.sort(key=operator.itemgetter('time'), reverse=True)
    ret_logs = []
    if begin_date and end_date and begin_date == end_date:
        tmp_b = datetime.datetime.strptime(begin_date, "%Y-%m-%d") # str to datetime
        tmp_e = tmp_b + datetime.timedelta(days=1)
        end_date = tmp_e.strftime("%Y-%m-%d")
    if begin_date and end_date and (begin_date > end_date):
        begin_date, end_date = end_date, begin_date

    if begin_date and not end_date:
        for item in logs:
            if str(item.get('time')) >= begin_date:
                ret_logs.append(item)
            if len(ret_logs) >= num:
                break
        logs.sort(key=operator.itemgetter('time'), reverse=True)
    elif not begin_date and end_date:
        for item in logs:
            if str(item.get('time')) < end_date:
                ret_logs.append(item)
            if len(ret_logs) >= num:
                break
        logs.sort(key=operator.itemgetter('time'), reverse=True)
    elif begin_date and end_date:
        for item in logs:
            if str(item.get('time')) >= begin_date and str(item.get('time')) < end_date:
                ret_logs.append(item)
            if len(ret_logs) >= num:
                break
        logs.sort(key=operator.itemgetter('time'), reverse=True)
    else:
        ret_logs = logs
    return JsonResponse({'result': 'ok', 'logs':ret_logs[0:num]})


# journalctl --since=2017-03-28 --until=2017-03-29 -rn 200
def sys_log(request):
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'result': 'failed', 'msg': 'json error'})

    begin_date = data.get('begin_date', None)
    end_date = data.get('end_date', None)
    num = data.get('num', 20)
    type = data.get('type', 'sys')

    if begin_date and end_date and begin_date == end_date:
        tmp_b = datetime.datetime.strptime(begin_date, "%Y-%m-%d") # str to datetime
        tmp_e = tmp_b + datetime.timedelta(days=1)
        end_date = tmp_e.strftime("%Y-%m-%d")

    if begin_date and end_date and (begin_date > end_date):
        begin_date, end_date = end_date, begin_date

    if type == 'pppd':
        cmd = 'journalctl /usr/sbin/pppd -rn %s ' % num
    else:
        cmd = 'journalctl  -rn %s '% num
    if begin_date:
        cmd += ' --since=%s ' % begin_date
    if end_date:
        cmd += '  --until=%s ' % end_date
    print cmd
    logs = os.popen(cmd).read()
    return JsonResponse({'result': 'ok', 'logs':logs.replace('\n','<br />')})