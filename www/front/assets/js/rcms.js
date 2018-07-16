/*
index简单的js， 直接加载，放在angularjs里， 白白消耗了资源
*/

/*define(['jquery'], function($){
	var initEvent = function() {
		$('.sidebar').on('click', '.sidebar-submenu li', function() {
			self = $(this);
			$('.sidebar-submenu li').removeClass('selected');
			self.addClass('selected');
		});
		$('.sidebar').on('click', 'div', function() {
			// TODO: this is soucre or target?
			$('.sidebar-submenu').find('ul').hide();
			// 如果是源
			$(this).next('ul').show();
		});
	};
	initEvent();
});
*/


$(function () {
	if(window.sessionStorage.pageUrl){
		window.location.href=window.sessionStorage.pageUrl;
		window.sessionStorage.pageUrl='';
	}
	var uri = window.location.href.split('#/')[1];
	var ng_uri = !!uri ? uri.replace('/', '.') : 'DeviceOverview';
	$('.sidebar-submenu').hide();
	$('[ui-sref="'+ng_uri+'"]').addClass('expand');
	$('[ui-sref="'+ng_uri+'"]').children('img.liulang').addClass('act');
	$('[ui-sref="'+ng_uri+'"]').parent().show();
	$('[ui-sref="'+ng_uri+'"]').parent().parent().children('div').addClass('selected');
	var initEvent = function() {
		$('.sidebar').on('click', '.sidebar-submenu li', function() {
			$('.sidebar-submenu li').removeClass('expand');
			$('.sidebar-submenu li').children('img.liulang').removeClass('act');
			var self = $(this);
			self.addClass('expand');
			self.children('img.liulang').addClass('act');
			self.parent().parent().children('div').addClass('selected');
		});
		$('.sidebar-main-menu').on('click', 'div', function() {
			$('.sidebar-menu div').removeClass('selected');
			var self = $(this);
			self.addClass('selected');
			$('.sidebar-submenu').hide();
			$(this).next('ul').show();
		});
		/* 登出按钮 */
		$('#logout').on('click', function () {
			rcms.ajax({
				type: 'post'
				,url: '/apis/logout/'
			}).done(function (data) {
                window.sessionStorage.loginOk = '0';
				location.href = '/login/';
			});
		});
	};
	var getLimitTime = function(){
		rcms.ajax({
			type: 'post',
			url: 'apis/cli_status/'
		}).success(function (data) {
			if(data.result=='ok'){
				$('#limitTimeShow').hide();
			}else{
				var day = parseInt(data.remain/(24*3600)||0);
				var hour = parseInt((data.remain%(24*3600))/3600||0);
				var minute = parseInt(((data.remain%(24*3600)%3600))/60||0);
				var limitTime = day+"天"+hour+"小时"+minute+"分钟";
				$('#limitTime').text(limitTime);
				$('#limitTimeShow').show();
			}
			setTimeout(getLimitTime,600000);
		}).error(function(data){
			//alert(data.msg);
		})
	};
	initEvent();
	getLimitTime();
});
