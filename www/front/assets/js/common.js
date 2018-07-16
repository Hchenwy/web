;(function (rcms, $) {
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
    /*获取当前日期*/
    rcms.getCurrentDate = function (){
        var nowDate = new Date();
        var year = nowDate.getFullYear();
        var month = (nowDate.getMonth()+1)>=10 ? (nowDate.getMonth()+1):"0"+(nowDate.getMonth()+1);
        var day = nowDate.getDate();
        var date = year + "-"+ month + "-"+day;
        return date
    };

    rcms.message = function (title, info) {
        if (!info) {
            info = '';
        }
        var msg = $('<div class="msg-item"><h6>' + title + '</h6><p>' + info + '</p></div>');
        var mdl = document.getElementById('rcms_msg');
        if (!mdl) {
            mdl = document.createElement('div');
            mdl.id = 'rcms_msg';
            mdl.className = 'msg';
            document.body.appendChild(mdl);
        }
        $(mdl).append(msg);
        msg.delay(5000).fadeOut(2000, function(){msg.remove()});
    };

    /*遮罩层*/
    rcms.mask = function (isClear) {
        var maskLayer = document.getElementById('smb_mask');
        if (!maskLayer) {
            maskLayer = document.createElement('div');
            maskLayer.id = 'smb_mask';
            maskLayer.className = 'smb-mask';
            maskLayer.style.display = 'none';
            document.body.appendChild(maskLayer);
        }
        if (!!isClear) {
            maskLayer.style.display = 'none';
        } else {
            maskLayer.style.display = 'block';
        }
    };

    rcms.ajax = function (option, cache) {
        return $.ajax(option).fail(function (e) {
                if (e.status == 401) {
                    location.href = '/login/';
                    return false;
                }
                // rcms.message('无法连接服务器', e.statusText);
                 $("#wait_dialog").modal("hide");
            });
    };
    window.rcms = rcms;
    // 对Date的扩展，将 Date 转化为指定格式的String
    // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
    // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
    // 例子：
    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
    // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
    Date.prototype.Format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };
}(window.rcms||{}, $));

