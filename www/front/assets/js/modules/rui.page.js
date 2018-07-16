;(function() {
	if(!window.rui)
		window.rui = {};
})();
/**
 * @author lulinfeng
 * @constructor PageWidget
 * @description 分页组件类，用于展现表格的信息
 **/
rui.Page = function(pageProperty) {
	this.element = null;
	/**
	 *@description 每页的记录数
	 */
	this.pageSize = 10;
	/**
	 *@description 当前页默认为1
	 */
	this.curPage = 1;
	/**
	 *@description 总页数
	 */
	this.pageCount = 0;
	/**
	 *@description 总记录数
	 */
	this.totalCount = 0;
	this.pageId = "";
	/**
	 *@description 回调函数
	 */
	this.pageCallBack = null;
	/**
	 *@description 绑定表格控件
	 */
	this.bindWidget = null;
	/**
	 *@description 是否需要通过调用始化函数来,绘制默认不须要
	 */
	this.isNeedInit = false;
	/**
	 *@description 是否需要页数选择框
	 */
	this.isPageSizeChange = true;
	/**
	 *@description  是否需要统计信息
	 */
	this.isNeedTotalInfo = true;
	/**
	 *@description  可点击的页码数
	 */
	this.pageNumShown = 5;
	/**
	 *@description 表格控件是否可以操作
	 *@field
	 */
	this.enabled = true;
	/**
	 *@description 可以非常表格控件相关的统计信息之间用<span></span>来显示
	 *@field
	 */
	this.otherCountInfo = "";
	/**
	 *@description 每页大小的可以选项
	 *@field
	 */
	this.pageSizeOptions = [10, 20, 50, 100, 200];
	/**
	 * 可供选的每页大小的数量
	 */
	this._ZH_PAGE_TEMPLETE = "<ul>" +
		"<li class=\"j-first rui-page-nation-item\"><a class=\"rui-page-nation-first rui-page-nation-a\" href=\"javascript:;\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-fast-backward'></span></span></a><span class=\"rui-page-nation-first rui-page-nation-span\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-fast-backward'></span></span></span></li>" +
		"<li class=\"j-prev rui-page-nation-item\"><a class=\"rui-page-nation-previous rui-page-nation-a\" href=\"javascript:;\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-backward'></span></span></a><span class=\"rui-page-nation-previous rui-page-nation-span\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-backward'></span></span></span></li>" +
		"<li class=\"rui-page-nation-jumpto rui-page-nation-item\">" +
		"<input class=\"rui-page-nation-input \" type=\"text\" size=\"4\" value=\"#currentPage#\" /><input class=\"rui-page-nation-goto\" type=\"button\" value=\"跳转\" /></li>" +
		"<li class=\"j-next rui-page-nation-item\"><a class=\"rui-page-nation-next rui-page-nation-a\" href=\"javascript:;\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-forward'></span></a><span class=\"rui-page-nation-next rui-page-nation-span\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-forward'></span></span></li>" +
		"<li class=\"j-last rui-page-nation-item\"><a class=\"rui-page-nation-last rui-page-nation-a\" href=\"javascript:;\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-fast-forward'></span></a><span class=\"rui-page-nation-last rui-page-nation-span\">" +
		"<span class='rui-page-nation-span-txt'><span class='glyphicon glyphicon-fast-forward'></span></span></li>" +
		"</ul>";
	this.page_setting = {
		first : "li.j-first",
		prev : "li.j-prev",
		next : "li.j-next",
		last : "li.j-last",
		nums : "li.rui-page-nation-jnum>a",
		jumpto : "li.rui-page-nation-jumpto",
		pageNumFrag : '<li class="#liClass# rui-page-nation-item"><a href="javascript:;" class="rui-page-nation-a">#pageNum#</a></li>'
	};
	if(pageProperty) {
		this.init(pageProperty);
		if(!this.isNeedInit) {
			this.render();
		}
	}
};
rui.Page.prototype = {
	/**
	 * @description 初始化数据
	 * @param  {Object} gridProperty 跟分页控件相关的属性对象
	 **/
	init : function(pageProperty) {
		$.extend(this, pageProperty);
	},
	/**
	 * @description 绘制分页控件
	 **/
	render : function() {
		this.element = document.getElementById(this.pageId);
		if (!this.element) {
			this.element = document.createElement('div');
		}
		this.element.className = 'rui-page';
		var tmp = document.createElement('div');
		tmp.className = 'rui-page-main';
		this._pageCountDom = document.createElement('div');
		this._pageCountDom.className = 'rui-page-count';
		this._pageSizeDom = document.createElement('span');
		this._totalCountDom = document.createElement('span');
		this._otherInfoDom = document.createElement('span');
		$(this._pageCountDom).append(this._pageSizeDom, this._totalCountDom, this._otherInfoDom);
		this._pageInfoDom = document.createElement('div');
		this._pageInfoDom.className = 'rui-page-nation';
		$(tmp).append(this._pageCountDom, this._pageInfoDom);
		$(this.element).append(tmp);

		//绘制可以改变页面大小的select控件
		this._renderChangePageSize();
		//绘制统计信息
		this._renderTotalCount();
		//绘制其它信息
		this.renderOtherInfo();
		//绘制分页组件
		this._renderPageInfo();

	},
	/**
	 绘制分页代码
	 **/
	_renderPageInfo : function() {
		var $this = this;
		var pageInfo = $(this._pageInfoDom);
		var interval = this._getInterval();
		var pageNumFrag = "";
		var endIndex = interval.end;

		for(var i = interval.start; i < interval.end; i++) {
			pageNumFrag += this.page_setting.pageNumFrag.replace("#pageNum#", i).replace("#liClass#", i == this.getCurPage() ? 'rui-page-nation-selected rui-page-nation-jnum' : 'rui-page-nation-jnum');
		}
		var tempPag = this._ZH_PAGE_TEMPLETE;
		pageInfo.html(tempPag.replace("#pageNumFrag#", pageNumFrag).replace("#currentPage#", this.getCurPage())).find("li");
		var lis = pageInfo.find("li");
		//添加鼠标经过事件
		lis.each(function() {
			var $li = $(this)
			$li.hover(function() {
				$li.addClass("rui-page-nation-hover");
			}, function() {
				$li.removeClass("rui-page-nation-hover");
			});
		});
		var $first = pageInfo.find(this.page_setting.first);
		var $prev = pageInfo.find(this.page_setting.prev);
		var $next = pageInfo.find(this.page_setting.next);
		var $last = pageInfo.find(this.page_setting.last);
		if(this._hasPrev()) {
			$first.add($prev).find(">span").hide();
			$this._bindEvent($prev, this.getCurPage() - 1);
			$this._bindEvent($first, 1);
		} else {
			$first.add($prev).addClass("rui-page-nation-disabled").find(">a").hide();
		}
		if(this._hasNext()) {
			$next.add($last).find(">span").hide();
			$this._bindEvent($next, $this.getCurPage() + 1);
			$this._bindEvent($last, $this.getPageCount());
		} else {
			$next.add($last).addClass("rui-page-nation-disabled").find(">a").hide();
		}
		pageInfo.find(this.page_setting.nums).each(function(i) {
			var li = $(this);
			$this._bindEvent.call($this, li, i + interval.start);
		});
		var pageCallBack = this.pageCallBack;
		pageInfo.find(this.page_setting.jumpto).each(function() {
			if(!$this.enabled) {
				return;
			}
			var $page = $(this);
			var $inputBox = $page.find(":text");
			var $button = $page.find(":button");
			$button.bind("click", function(event) {
				var curPage = parseInt($inputBox.val());
				if(!isNaN(curPage)) {
					curPage = parseInt(curPage);
				} else {
					curPage = 1;
				}
				if(curPage == 0) {
					curPage = 1;
					$button[0].value = curPage;
				}
				if(curPage >$this.pageCount) {
					curPage =$this.pageCount;
					$button[0].value = curPage;
				}
				if($this.pageCallBack) {
					var param=$this._genernateCallBackParam(curPage);
					$this.pageCallBack(param);
					return;
				}
				$this.setCurPage(curPage);
				if($this.bindWidget) {
					$this.bindWidget.update();
				} else {
					$this.update();
				}
				event.preventDefault();
			});
			$inputBox.keyup(function(event) {
				if(event.keyCode == 13)
					$button.click();
			});
		});
	},
	/**
	 绘制统计信息
	 **/
	_renderTotalCount : function() {
		if(this.isNeedTotalInfo) {
			var totalNum = (window.language && window.language == "en") ? "Total Count:" + this.getTotalCount() : "共" + this.getTotalCount() + "条 "
			$(this._totalCountDom).html(totalNum);
		}
	},
	/**
	 * 给制
	 */
	renderOtherInfo : function(otherInfo) {
		if(otherInfo) {
			this.otherCountInfo = otherInfo;
		}
		if(this.otherCountInfo && this.otherCountInfo != "") {
			$(this._otherInfoDom).html(this.otherCountInfo);
		}
	},
	/**
	 * 绘制统计信息
	 */
	_renderChangePageSize : function() {
		var $this = this;
		if($this.isPageSizeChange) {
			// $($this._pageSizeDom).html('显示:<select class="rui-page-count-select" id="' + this.pageId + '_pageSizeSelect"></select>条 ');
			// var pageSizeSelect = document.getElementById($this.pageId + "_pageSizeSelect");

			$this.pageSizeSelect = document.createElement('select');
			$this.pageSizeSelect.className = 'rui-page-count-select';
			var isHasCurPageSize = false;
			if($this.pageSizeOptions && $this.pageSizeOptions.length > 0) {
				for(var i = 0; i < $this.pageSizeOptions.length; i++) {
					var option = $this.pageSizeOptions[i];
					if($this.pageSize == parseInt(option)) {
						isHasCurPageSize = true;
					}
					$this.pageSizeSelect.options.add(new Option(option, option));
				}
			}
			if(!isHasCurPageSize) {
				$this.pageSizeSelect.options.add(new Option($this.pageSize, $this.pageSize));
			}
			$this.pageSizeSelect.value = $this.getPageSize();
			$($this._pageSizeDom).append( $this.pageSizeSelect);
			$($this.pageSizeSelect).bind("change", function() {
				var pageSize = parseInt(this.value);
				var curPage = 1;
				$this.setCurPage(curPage);
				if($this.pageCallBack) {
					var param=$this._genernateCallBackParam(curPage);
					$this.pageCallBack(param);
					return;
				}
				$this.setPageSize(pageSize);
			});
		}
	},
	/**
	 * @description 重绘制分页控件
	 **/
	update : function(curPage) {
		if(!this.element) {
			return;
		}
		if(this.isNeedTotalInfo) {
			this._renderTotalCount();
		}
		$(this._pageInfoDom).empty();
		$(this._pageInfoDom).html("");
		this._pageInfoDom.innerHTML = "";
		if(curPage) {
			this.curPage = curPage;
		}
		//绘制分页组件
		this._renderPageInfo();
	},
	/**
	 是否有上一页
	 **/
	_hasPrev : function() {
		return this.getCurPage() > 1;
	},
	/**
	 是否有下一页
	 **/
	_hasNext : function() {
		return this.getCurPage() < this.getPageCount();
	},
	/**
	 计算页数间隔
	 **/
	_getInterval : function() {
		var halfNum = parseInt(Math.ceil(this.pageNumShown / 2));
		var pageCount = this.getPageCount();
		var start = 0;
		var end = 0;
		if(this.curPage < halfNum) {
			start = 1;
			end = Math.min(this.pageNumShown + 1, pageCount);
		} else if((this.curPage + halfNum) <= pageCount) {
			start = this.curPage - halfNum + 1;
			end = Math.min(this.curPage + halfNum, pageCount);
		} else {
			start = pageCount - this.pageNumShown + 1;
			end = pageCount + 1;
		}
		if(pageCount <= this.pageNumShown) {
			start = 1;
			end = this.pageCount + 1;
		}
		if(this.pageNumShown == 2 && pageCount != this.curPage) {
			end = end + 1;
		}
		return {
			start : start,
			end : end
		};
	},
	/**
	 私有函数事件的绑定
	 **/
	_bindEvent : function($target, pageNum) {
		var $this = this;
		//外部函数调用
		if(!$this.enabled) {
			return;
		}
		if($this.pageCallBack) {
			$target.bind("click", {
				pageNum : pageNum,
				callback : $this.pageCallBack
			}, function(event) {
				var curPage = parseInt(event.data.pageNum);
				var param=$this._genernateCallBackParam(curPage);
				event.data.callback(param);
			});
			return;
		}
		$target.bind("click", {
			pageNum : pageNum
		}, function(event) {
			var curPage = parseInt(event.data.pageNum);
			$this.setCurPage(curPage);
			if($this.bindWidget) {
				$this.bindWidget.update();
			} else {
				$this.update();
			}
			event.preventDefault();
		});
	},
	/**
	 * 服务器访问数据时，自动生成访问服务器需要地数据包
	 */
	_genernateCallBackParam:function(curPage){
		this.setCurPage(curPage);
		var pageParam={};
		pageParam.curPage=curPage;
		var beginIndex=(curPage-1)*(this.pageSize)+1;
		var endIndex=(curPage-1)*(this.pageSize)+this.pageSize;
		pageParam.beginIndex=beginIndex;
		pageParam.endIndex=endIndex;
        return pageParam;
	},
	/**
	 * @description 设置当前页
	 * @param  {int} curPage 设置当前页
	 * @return {null} 返回空
	 **/
	setCurPage : function(curPage) {
		this.curPage = curPage;
	},
	/**
	 * @description  设置绑定的组件
	 * @param  {int} bindWidget 设置绑定的组件
	 * @return {null} 返回空
	 **/
	setBindWidget : function(bindWidget) {
		this.bindWidget = bindWidget;
	},
	/**
	 * @description  获取绑定的组件
	 * @return {Object}  返回分页控件所绑定的UI组件
	 **/
	getBindWidget : function() {
		return this.bindWidget;
	},
	/**
	 * @description  获取当前页
	 * @return {int}  返回当前页的页数
	 **/
	getCurPage : function() {
		return this.curPage;
	},
	/**
	 * @description  设置每页数据的大小
	 * @param  {int} pageSize 设置当前页
	 * @return {null}  返回空值
	 **/
	setPageSize : function(pPageSize) {
		this.pageSize = pPageSize;
		if(!this.isPageSizeChange) {
			return;
		}
		if(this.bindWidget) {
			this.bindWidget.update();
		}
	},

	/**
	 * @description 获取每页的大小
	 * @return {int}
	 **/
	getPageSize : function() {
		return this.pageSize;
	},
	/**
	 * @description 获取总页数的大小
	 * @return {null}  返回空值
	 **/
	getPageCount : function() {
		try {
			if(this.totalCount % this.pageSize == 0) {
				this.pageCount = parseInt((this.totalCount / this.pageSize))
			} else {
				this.pageCount = parseInt((this.totalCount / this.pageSize)) + 1;
			}
		} catch (ex) {
			this.pageCount = 0;
		}
		return this.pageCount;
	}
	/**
	 * @description 设置记录总数
	 * @param  {int} totalCount 设置当前页
	 * @return {null}  返回空值
	 **/,
	setTotalCount : function(totalCount) {
		this.totalCount = totalCount;
	},
	/**
	 * @description 获取记录总数
	 * @return {null}  返回空值
	 **/
	getTotalCount : function() {
		return this.totalCount;
	},
	/**
	 * @description 显示关联的分页控件对应的DOM
	 * @return {null}  返回空值
	 **/
	show : function() {
		$(this.element).show();
	},
	/**
	 * @description 隐藏关联的分页控件对应的DOM
	 * @return {null}  返回空值
	 **/
	hide : function() {
		$(this.element).hide();
	},
	/**
	 * @description  分页控件对应的DOM使能
	 * @return {null}  返回空值
	 **/
	enable : function() {
		this.enabled = true;
		this.element.disabled = false;
		this.update();
	},
	/**
	 * @description  分页控件对应的DOM使不能
	 * @return {null}  返回空值
	 **/
	disable : function() {

		this.enabled = false;
		this.element.disabled = true;
		this.update();
	}
};
