/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
@description:  tab控件
@author: zhongcj
@at 20120916

 初始化参数列表：
id : tab控件关联的div id
active : {int} 初始化选中的tab项序列
triggerType : {String} 切换Tab项事件类型 默认click，可选值 mouseover
onSelected：{Function} 选中tab回调事件
onTabLoaded:{Function} Tab首次加载时触发，传递参数idx - 当前选中的Tab序列号
stepByStep:是否必须一步步点击
items:{Array} tab项
[
	{
		title : "tab 标题",
		tabId : "tab内容ID",
		url : "动态加载url",
		loadType : "动态加载方式（iframe/ajax/html）",
		ajaxData : "使用ajax方式加载时的附加参数(Object)",
		resizeIfm: "使用iframe加载时是否自适应iframe高度为内容高度(true/false 默认true)"
	}
]
onSelected:tab项被选中后触发
DOM 结构:
 <div class="tab" >
	<!--tab导航 -->
	<ul  class="rui-tab-nav">
		<li class="rui-tab-nav-item"><a href="javascript:void(0)" class="rui-tab-nav-item-link">Tab 1</a></li>
		<li class="rui-tab-nav-item"><a href="javascript:void(0)" class="rui-tab-nav-item-link">Tab 2</a></li>
	</ul>
	<!--tab项-->
	<div class="rui-tab-container">
		<div class="tab-item">
			tab内容
		</div>
		<div class="tab-item">
			<!-- -->
			<iframe frameBorder="0" style="width: 100%; height: 100%;" ></iframe>
		</div>
	</div>
</div>
使用方法:
<div id="tab1">
	<div>内容1</div>
	<div>内容2</div>
</div>
var tab= new rui.Tab({
	id : tabId,
	active :0,
	items:[
		{title:"标题",tabId:"tab内容ID",url:"iframe加载url",loadType:"iframe",ajaxData:{}},
	]
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/


;define(['jquery', 'common', 'loader'], function($, common, Loader){

	var Tab = function(opt){
		var defOpt = {
			active: 0,
			triggerType : "click",
			bar:false,
			size : "M",
			stepByStep : false,
			onNextTab :function(nextTabId,curTabId){return true;},
			onSelected:function(idx){},//tab选中后回调函数
			onTabLoaded:function(idx){}//tab首次加载回调函数
		};
		this.option = $.extend(defOpt,opt);
		this.create();
		this.select(this.option.active);
		this._initView();
	}

	Tab.prototype = {
		element : null,
		_loader : null,
		_enable 	: true,
		_selIdx		: 0,
		_resizeHandle : null,
        IFM_TEMP : '<iframe frameBorder="0" style="width: 100%; height: 100%;" ></iframe>',

		/**
		创建
		*/
		create : function(){
			this.element = $("#"+this.option.id);
			var self = this,pages = self.element.find(">div").filter(function(){//div中有notab属性等于“notab”的不添加到tab里面去
				return $(this).attr("notab") != "notab";
			}).hide();
			/*if(self.option.items.length != pages.length){
				alert('Create Tab Error,Wrong Tab Item Number!');
				return;
			}*/
			var cls = self.option.bar ? "rui-tab-tit-h2" : "rui-tab-nav";
			if(self.option.size == "L"){
				cls += " rui-tab-h3";
			}
			var nav = $('<ul>').addClass(cls);
			self._contentId = this.option.id + '_tab_container';
			pages.wrapAll('<div class="rui-tab-container" id="'+self._contentId+'"></div>');
			self._tabs = [];
			$.each(self.option.items,function(i,n){
				//增加Tab菜单
				var li = $('<li>').attr("idx",i).bind(self.option.triggerType,function(){
						if(self._enable && $(this).attr("enable") && $(this).attr("idx") != self._selIdx){
							self.select(parseInt($(this).attr("idx")));
						}
					 })
					.hover(function(){
							if(self._enable && $(this).attr("enable")){
								$(this).addClass("rui-tab-hover");
							}
						},function(){
							$(this).removeClass("rui-tab-hover");
						})
					.attr('enable',true)//tab项是否可用
					.appendTo(nav);
				var link = $('<a>')
					.attr('href','javascript:void(0)')
					.html(n.title)
					.appendTo(li);

				//tab页内容
				var page = $("#"+n.tabId).addClass("tab-item");
				//如果tab 内容在外部，剪切到内部
				if((page.parent()[0].id||'') != self._contentId ){
					page.appendTo("#"+self._contentId);
				}
				if(n.loadType == 'iframe'){//iframe方式加载
					page.html(self.IFM_TEMP);
				}else if(n.loadType == 'html'){//直接注入html
					page.html(n.html) ;
				}
				var item = {};
				item.page = page;
				item.url = n.url;
				item.menu = li;
				item.resizeIfm = Util.isDefined(n.resizeIfm) ? n.resizeIfm : true;
				item.loadType = n.loadType;
				item.ajaxData = n.ajaxData;
				self._tabs.push(item);

				li = null;
				link = null;
				page = null;
				item = null;

			});
			self.element.prepend(nav);
			pages = null;
			nav = null;
		},

		_initView : function(){
			var self = this;
			this._resizeHandle = window.setInterval(function(){
				self._resizeIfame();
			},200);
		},

		//iframe自适应高度
		_resizeIfame : function(){
			var selIdx = this._selIdx,tab = this._tabs[selIdx];
			//自适应iframe高度
			if(tab && tab.loadType == 'iframe' && tab.resizeIfm){
				var page = tab.page;
				var iframe = page.find("iframe")[0];
				if(iframe && iframe.contentWindow){
					try{
						//var height = iframe.contentWindow.document.body.scrollHeight;
						var height = iframe.contentWindow.document.body.clientHeight,hadd = 18;
						if(iframe.style.height != ((height+hadd)+"px")){
							iframe.style.height =  (height+hadd)+"px";
						}
					}catch (ex){}
				}
				if((page[0].clientHeight+"px") != page[0].style.heigth){
					page[0].style.heigth = page[0].clientHeight+"px";
				}
			}
		},

		/**
		*选中Tab前调用方法
		*/
		_beforeSel : function(idx){
			var self = this,tabs = self._tabs;
			//按步点击时，会调用页面的回调方法
			if(self.option.stepByStep && idx > self._selIdx){
				var curTab = tabs[self._selIdx];
				if(curTab.loaded){
					if(curTab.loadType == 'iframe'){
						var frm = curTab.page.find("iframe")[0];
						if(frm && frm.contentWindow && frm.contentWindow.onNextTab && !frm.contentWindow.onNextTab(self._selIdx)){
							return false;
						}
					}else{
						if(!this.option.onNextTab(self._selIdx)){
							return false;
						}
					}
				}

			}
			return true;
		},

		/**
		设置选中的项
		@param idx {int} 选中的项ID，从0开始
		*/
		select : function(idx){
			var tabs = this._tabs,self = this;
			if(idx < 0) idx = 0;
			if(idx >= tabs.length) idx = tabs.length -1;
			if(!self._beforeSel(idx)){
				return;
			}
			var lastSelIdx = self._selIdx;//上次选中的Tab
			self._selIdx = idx;
			$.each(tabs,function(i,tab){
				var page = tab.page,menu = tab.menu;
				if(i == idx){
					page.show();
					menu.addClass("rui-selected");
					if((tab.loadType == 'ajax' || tab.loadType == 'iframe') && !tab.loaded){
						self._loadContent(tab);
					}
					if(tab.loadType == 'iframe' && tab.loaded){//iframe加载后每次选中会触发子页面方法
						var frm = tab.page.find("iframe")[0];
						frm && frm.contentWindow && frm.contentWindow.onShowTab && frm.contentWindow.onShowTab(idx);
					}
					if(!tab.loaded){//首次加载触发函数
						self.option.onTabLoaded(idx);
					}
					tab.loaded = true;
				}else{
					page.hide();
					menu.removeClass("rui-selected");
					if(lastSelIdx == i && tab.loadType == 'iframe' && tab.loaded ){//iframe加载的Tab隐藏时触发
						var frm = tab.page.find("iframe")[0];
						frm && frm.contentWindow && frm.contentWindow.onHideTab && frm.contentWindow.onHideTab(idx,lastSelIdx);
					}
				}

			});
			self._afterSel(idx);
			tabs = null;
			self = null;
		},

		/**
		*选中Tab后调用方法
		*/
		_afterSel : function(idx){
			if(this.option.stepByStep){//约束步步点击，禁止跨步点击
				var curSel = this._selIdx;
				for(var i=0; i < this._tabs.length; i++){
					var tab = this._tabs[i];
					var link = tab.menu;
					if(i <= curSel +1 ){
						link.attr("enable",true).removeClass("rui-tab-disabledClick");
					}else{
						link.attr("enable",false).addClass("rui-tab-disabledClick");
					}
				}
			}
			//触发选中事件
			this.option.onSelected(idx);
		},

		/**
		 * 选中下一项
		 */
		selectNext : function(){
			this.select(this._selIdx +1);
		},

		/**
		 * 选中上一项
		 */
		selectPre : function(){
			this.select(this._selIdx - 1);
		},

		/**
		 * 选中第一项
		 */
		selectFirst : function(){
			this.select(0);
		},

		/**
		 * 选中最后一项
		 */
		selectLast : function(){
			this.select(this._tabs.length - 1);
		},
		/**
		强制刷新某一项
		@param i {int} tab下标
		*/
		refresh : function(i){
			var tab = this._tabs[i];
			if(tab.loadType == 'ajax' || tab.loadType == 'iframe'){
				this._loadContent(tab);
			}
		},

		/**
		动态加载内容
		*/
		_loadContent : function(tab){
			var page = tab.page,url = tab.url,loadType = tab.loadType,timeStr = (new Date()).getTime(),self=this;
			if(url.indexOf("?")!= -1){
				url += "&"+timeStr;
			}else{
				url += "?"+timeStr;
			}
			if(!this._loader){
				this._loader = new Loader({
					area : this._contentId,
					completeAction:"hide",
					duration:3000 //防止出错时无法取消加载
				})
			}
			this._loader.loadStart();
			var callBack = function(){
				self._loadComplete(tab);
			}
			if(loadType == 'iframe'){//iframe方式
				page.find("iframe").load(callBack).attr("src",url);
			}else{// ajax方式
				page.load(url,tab.ajaxData,callBack);
			}
			//tab.loaded = true;
			page = null;
		},

		_loadComplete : function(tab){
			this._loader.loadComplete();
		},



		/**
		使控件不可选
		*/
		disable : function(){
			this._enable = false;
			this.element.find(">ul").addClass("rui-tab-disabled");
		},

		/**
		使控件可选
		*/
		enable : function(){
			this._enable = true;
			this.element.find(">ul").removeClass("rui-tab-disabled");
		},

		/**
		 * 获取选中的TAB项id
		 */
		getSelectedIndex : function(){
			return this._selIdx;

		},
		/**
		 设置参数
		 @param {String} key 设置的键值
		 @param {String} val 设置的值 <br/>


		setOption : function(key,val){

			switch(key){


				default : return;
			}
			this._setOpt(key,val);
		},

		_setOpt : function(key,val){
			this.option[key] = val;
		},
*/
		/**
		清除
		*/
        destroy : function(){
			window.clearInterval(this._resizeHandle);
			this._resizeHandle = null;
			var tabs = this._tabs;
			for(var i=0;i<tabs.length;i++){
				var item = tabs[i];
				var ifm = item.page.find("iframe").unbind().attr("src","about:blank");
				if(ifm.length > 0){
					try{
						var win = ifm[0].contentWindow;
			            win.document.write('');
			            win.document.close();
						CollectGarbage();
			        }catch(e){};
				}
				item.page = null;
				item.menu.unbind();
				item.menu = null;
				tabs[i] = null;
			}
			var tmp = this.element;
			this.element = null;
			this._tabs = null;
			if(this._loader){
				this._loader.destroy();
				this._loader = null;
			}
			Util.removeElement(tmp[0]);
		}
	}
});
