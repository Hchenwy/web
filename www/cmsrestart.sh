#!/bin/sh
is_exists=`ps x|grep cms_listen|grep -v grep |awk '{print $1}'`
if [[ $is_exists ]];then
      echo $is_exists | xargs kill -9
fi
sleep 0.2
python /www/server/cms/cms_listen.pyc &
