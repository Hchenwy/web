/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
@description:  加载等待控件
@author: zhongcj
@at 20120903

 初始化参数列表：
	area : {String} 覆盖的区域，默认值:body  可用的值：body - 覆盖当前页面; divId - 某个div
	loadStyle : {String} 应用的样式，默认值：normal，可用的值：normal 一般用于当前页面加载 ；innerborder 一般外部页面加载，有内边框； operload 操作等待
	duration : {int} 加载持续时间，毫秒
	completeAction: {String} 加载完毕后的操作，默认 remove，可用的值： remove 删除创建的所有节点；hide 只是隐藏节点
	completeFun:{Function} 加载完毕后回调方法
	mask : {Boolean} 是否遮罩，默认true
	alpha: {Number} 透明度，默认0.75
	bgColor:{String} 遮罩层背景色，默认 #000
	text : {String} 显示的提示，默认空
	logoStyle : {String} 显示的图片样式
	innerborderStyle :{String}

DOM 结构:

	一、没有遮罩层（参数mask为false）：
	<table cellspacing='0' cellpadding='0' border='0' class='rui-loader rui-loader-innertb'>
		<tr>
			<!--加载logo -->
			<td><div class="rui-loader-logo {option.logoStyle}"></div></td>
			<!--提示信息 -->
			<td><span class="rui-loader-text"></span></td>
		</tr>
	<table>
	插入 target节点
	二、有遮罩层（参数mask为true）
	<div class="rui-loader rui-loader-outer" >
		<!-- 遮罩背景层 -->
		<div class="rui-loader-mask"></div>
		<!-- 内框-->
		<div class="rui-loader-innerborder {option.innerborderStyle}">
			<table cellspacing='0' cellpadding='0' border='0' class='rui-loader-innertb rui-loader-innertb-center'>
				<tr>
					<td><div class="rui-loader-logo {option.logoStyle}"></div></td>
					<td><span class="rui-loader-text"></span></td>
				</tr>
			<table>
		</div>
	</div>
	插入body
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
define(['jquery'], function($){

	var Loader = function(opt){
		this.isIE6 = $.browser.msie && /msie 6\.0/i.test(navigator.userAgent);
		var defOpt = {
			loadStyle :  "normal",
			completeAction:"remove",
			area : "body"
		};
		var loadType = opt.loadStyle || defOpt.loadStyle;

		switch(loadType){
			case "innerborder"://有遮罩层，有背景色，有内边框
				 $.extend(defOpt,{
				 	mask : true,
					bgColor:"#ddd",
					alpha : 0.6,
					logoStyle : 'rui-loader-logo-middle',
					innerborderStyle:"rui-loader-innerborder-wholepageload"
				 });
				 break;
			case "operload"://操作加载，无遮罩层
				 $.extend(defOpt,{
				 	mask : false,
				 	logoStyle : 'rui-loader-logo-small'
				 });
				 break;
			default://默认样式，有遮罩层，无背景色
				$.extend(defOpt,{
				 	mask : true,
					bgColor:"#fff",
					alpha : 0,
					logoStyle : 'rui-loader-logo-middle'
				 });
				 break;

		}
		this.option = $.extend(defOpt,opt);
		this.create();
	};

	Loader.prototype = {
		element : null,
		_img : null,
		//延迟处理器
		_pauseHandle : null,
		/**
		创建
		*/
		create : function(){
			var opt = this.option,parent,
				target = opt.area == 'body'?$('body'):$("#"+opt.area),
				tb = $("<table cellspacing='0' cellpadding='0' border='0' class='rui-loader-innertb'>"),
				tr = $('<tr>').appendTo(tb),img = $("<div class='loader-logo'>"),label = $('<span >');
			label.addClass("rui-loader-text").text(opt.text || '');
			img.addClass(opt.logoStyle);
			$('<td valign="middle">').append(img).appendTo(tr);
			$('<td valign="middle">').append(label).appendTo(tr);
			if(!opt.mask){
				parent = target,
				this.element = tb;
			}else{
				parent = $('body');
				var overlay = $('<div class="rui-loader-outer" >');
				if(this.isIE6){//解决IE6下浮动层无法遮罩select的问题
					 overlay.append('<iframe class="rui-loader-ifmbg" frameborder="0" tabindex="-1" src="javascript:false;"/>');
				}
				var mask = $('<div class="rui-loader-mask">');
				mask.css({"background-color":opt.bgColor,
				          "opacity":opt.alpha}).appendTo(overlay);
				var innerborder = $('<div class="rui-loader-innerborder">');
				if(this.option.innerborderStyle){
					innerborder.addClass(this.option.innerborderStyle);
				}
				tb.addClass("rui-loader-innertb-center");
				innerborder.append(tb).appendTo(overlay);
				this.element = overlay;
			}
			this.element.addClass("rui-loader");
			parent.append(this.element);
			this._img = img;
		},

		/**
		开始加载
		*/
		loadStart : function(){
			if(!this.element) return;
			this.element.show();
			//定位，居中显示
			if(this.option.mask){
				this._position();
			}
			if(this.option.duration){
				this._pauseHandle && window.clearTimeout(this._pauseHandle);
				this._pauseHandle = window.setTimeout($.proxy(this.loadComplete,this),this.option.duration);
			}
		},

		/**
		定位
		*/
		_position : function(){
			var target = this.option.area == 'body'?$('body'):$("#"+this.option.area),
				overlay = this.element,
				mask = this.element.find(".rui-loader-mask"),
				innerborder = this.element.find(".rui-loader-innerborder"),
				overlayWidth,overlayHeight,innerX,innerY,
				tb = innerborder.find(".rui-loader-innertb");
				//定位外层和遮罩层,内边框居中
				if(this.option.area == 'body'){
					var scrollTop = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
					var scrollLeft = document.documentElement && document.documentElement.scrollLeft || document.body.scrollLeft;
					var clientHeight = document.documentElement.clientHeight;
					var clientWidth = document.documentElement.clientWidth;
					innerX = (clientWidth -innerborder.width())/2 + scrollLeft;
					innerY = (clientHeight -innerborder.height())/2 + scrollTop;
					overlayWidth = target.width();
					overlayHeight = clientHeight > target.height()?clientHeight:target.height();
					overlay.css({"width" :(overlayWidth+"px"),
				          "height" :(overlayHeight+"px"),
				          "left" : "0px",
				          "top" : "0px"
				          });

					if(this.isIE6){
						overlay.find(".rui-loader-ifmbg").css({"width" :(overlayWidth+"px"),"height" :(overlayHeight+"px")});
					}
				}else{
					 overlayWidth = target.width();
					 overlayHeight = target.height();
					 var offset = target.offset();
					 overlay.css({"width" :(overlayWidth+"px"),
				          "height" :(overlayHeight+"px"),
				          "left" : offset.left+"px",
				          "top" : offset.top+"px"
				          });
					 innerX = (overlayWidth - innerborder.width())/2;
					 innerY = (overlayHeight - innerborder.height())/2 ;
				}
				mask.css({"width" :(overlayWidth+"px"),
				          "height" :(overlayHeight+"px")
						  });
				innerborder.css({left:(innerX+"px"),top:(innerY+"px")});
				//定位内容
				var	tby = (innerborder.height()-tb.height())/2,
				tbx = (innerborder.width()-tb.width())/2;
				tb.css({left:(tbx+"px"),top:(tby+"px")});
		},

		/**
		加载完毕
		*/
        loadComplete : function(){
        	if(!this.element) return;
        	if(this._pauseHandle){
        		window.clearTimeout(this._pauseHandle);
        		this._pauseHandle = null;
        	}
			this.option.completeFun && this.option.completeFun ();
			if(this.option.completeAction == 'remove'){
				this.destroy();
			}else{
				this.element.hide();
			}
		},

		/**
		 设置参数
		 @param {String} key 设置的键值
		 @param {String} val 设置的值 <br/>
			可设置的参数有： <br/>
			text : {String }提示的信息 <br/>
			logoStyle : 图标样式 <br/>
			bgColor ： 遮罩层背景色 <br/>
			alpha : 遮罩层背景透明度 0-1 <br/>
		*/
		setOption : function(key,val){
			if(!this.element) return;
			switch(key){
				case "text" :
					this.element.find(".rui-loader-text").text(val);
					break;
				case "logoStyle":
					this._img[0].className = ".rui-loader-logo "+val;
					break;
				case "bgColor":
					this.element.find(".rui-loader-mask").css("background-color",val);
					break;
				case "alpha":
					if(isNaN(val))	return;
					this.element.find(".rui-loader-mask").css("opacity",val);
					break;
				case "duration":
					if(isNaN(val))	return;
					break;
				case "completeAction":
					break;
				case "completeFun":
					break;
				case "innerborderStyle":
					this.element.find(".rui-loader-innerborder").addClass(this.option.innerborderStyle);
					break;
				default : return;
			}
			this._setOpt(key,val);
		},

		_setOpt : function(key,val){
			this.option[key] = val;
		},

		/**
		清除
		*/
        destroy : function(){
        	if(this.element){
        		this._img  = null;
        		var tmp = this.element;
        		this.element = null;
				Util.removeElement(tmp[0]);
				tmp = null;

			}
		}
	};

	return Loader
});


