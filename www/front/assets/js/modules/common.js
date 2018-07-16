define(['jquery'], function ($) {
    /* 右上角弹窗 */
    var message = function (title, info) {
        if (!info) {
            info = '';
        }
        var msg = $('<div class="msg-item"><h6>' + title + '</h6><p>' + info + '</p></div>');
        var mdl = document.getElementById('smb_msg');
        if (!mdl) {
            mdl = document.createElement('div');
            mdl.id = 'smb_msg';
            mdl.className = 'msg';
            document.body.appendChild(mdl);
        }
        $(mdl).append(msg);
        msg.delay(5000).fadeOut(2000, function(){msg.remove()});
    };

    /*遮罩层*/
    var mask = function (isClear) {
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
    /*ajax*/
    var ajax = function (option, require_msg) {
        var param = {
            type: 'post'
            ,dataType: 'json'
            ,contentType: 'application/json'
            };
        if (!!option) {
            $.extend(param, option);
        }
        if (!require_msg) {
            return $.ajax(param);
        }
        return $.ajax(param).done(function(data) {
            if (data.hasOwnProperty('result') && data.result != 'ok') {
                message('错误:', data.result);
            }
        }).fail(function (e) {
            message('HTTP错误代码:', e.statusText);
        });
    };
    return {message: message, mask: mask, ajax: ajax};
});
