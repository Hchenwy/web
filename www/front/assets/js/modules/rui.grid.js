;(function() {
	if(!window.rui)
		window.rui = {};
})();

/**
 * @author lulinfeng  2015-11-24
 * @constructor Grid
 * @description 表格组件类，
 不依赖页面domId生成表格,若没有domId则生成element,手动添加到dom
 取消json数据格式,统一为数组
 取消 _tempGridData 参数, 因为是引用关系不如直接用girdData
 **/
rui.Grid = function(gridProperty) {
	/**
	 *@description 表格的宽度
	 */
	this.width = 0;
	/**
	 *@description 表格的高度
	 */
	this.height = 0;
	/**
	 *@description 表格数据
	 */
	this.gridData = [];
	/**
	 *@description 表格ID
	 */
	this.gridId = "";
	/**
	 *@description 表格是否可以滚动
	 */
	this.isScroll = false;
	/**
	 *@description 表格是否可以实现拖动并改变大小
	 */
	this.isResized = false;
	/**
	 *@description 表格的对外扩展事件
	 TODO: 完善
	 */
	this.extendEvents = {
		rowClick : null,
		rowDblClick : null
	};
	/**
	 *@description 表格的列信息
	 */
	this.columns = null;
	/**
	 *@description 表格控件对应的分页控件
	 */
	this.pageWidget = null;

	/**
	 *@description 分页控件的属性
	 */
	this.pageWidgetOptions = {};
	/**
	 *@description 分页控件对应的ID
	 */
	this.pageWidgetId = "";
	/**
	 *@description 选中的样式类名
	 */
	this.selectedClass = "rui-grid-row-selected";
	/**
	 *@description 隔间的样式类名
	 */
	this.intervalClass = "rui-grid-row-interval";
	/**
	 *@description 鼠标经过的样式类名
	 */
	this.hoverClass = "rui-grid-row-hover";
	/**
	 *@description  不可用的样式类名
	 */
	this.disabledClass = "rui-grid-row-disabled";
	/**
	 *@description 表格是否可以多选
	 */
	this.isMulti = false;
	/**
	 *@description 是否需要分页,如果需要分页的话pageWidget分页信息从gridData来获取否则就是服务分页pageWidget不能为空
	 */
	this.isPage = true;
	/**
	 *@description 获取函数的外接接口
	 */
	this.getGridDataFunc = null;
	/**
	 *@description 是否通过调用始初化参数来调用数据
	 */
	this.isNeedInit = false;
	/**
	 *@description 是否需要鼠标经过事件
	 */
	this.isNeedHover = true;
	/**
	 *@description 是否需要行合并
	 */
	this.isRowMerge = false;
	/**
	 *@description 表格是否需要相邻间隔的着色不一样
	 */
	this.isIntervalColor = true;
	/**
	 *@description  默认的列宽大小
	 */
	this._defaultColumnWidth = 0;
	/**
	 *@description 表格上一级DOM元素结点
	 */
	this._gridParentWidth = 0;
	/**
	 *@description 表格控件的根元素
	 */
	this.element = null;
	/**
	 *@description 表格控件是否可以操作
	 */
	this.enabled = true;
	/**
	 *@description 排序的时候,是否需要title
	 */
	this.orderNeedTitle = true;

	this.orderByFunc = false;

	this.multiWidth = 40;

	this._isQuery = false;
	/**
	 *@description 选中索引
	 */
	this.selectedIndexs = [];
	/**
	 * 是否启用跨页选中的功能
	 */
	this.isUsePageSelect = false;
	/**
	 * 一个表格的主健  如果是JSON类型的数  primaryKey为
	 * 可以代表表格主键的列的名称,如果为array数据时primaryKey为可代表主键的,列的索引
	 */
	this.primaryKey = false;
	/**
	 * 表格选中的数据
	 */
	this.selectedData = [];
	/**
	 * 表格内容的DOM
	 */
	this.bodyTable = false;
	/**
	 * 表格表头内容DOM
	 */
	this.headTable = false;
	/**
	 * 全选checkbox DOM
	 */
	this.selectAllCheckboxDOM = false;
	this.rowCheckboxDOM = [];
	this.scrollerDOM = false;
	if(gridProperty) {
		this.init(gridProperty);
		if(!this.isNeedInit) {
			this.render();
		}
	}
};
rui.Grid.prototype = {
	/**
	 * @description 初始化数据
	 * @param  {Object} gridProperty 跟表格相关的属性对象
	 **/
	init : function(gridProperty) {
		$.extend(this, gridProperty);
	},
	/**
	 默认参数的初始化
	 **/
	_initDefaulParam : function() {
		var totalLeftWidth = 0;
		var countColumnWidth = 0;
		//表头中有几个字段
		var colLen = this.columns.length;
		for(var i = 0; i < colLen; i++) {
			var width = this.columns[i].width;
			if(width && width != 0) {
				totalLeftWidth = totalLeftWidth + parseInt(width);
				countColumnWidth = countColumnWidth + 1;
			}
		}
		if(!this._gridParentWidth) {
			this._gridParentWidth = $(this.element).parent().width();
		}
		if(!this.width) {
			this.width = this._gridParentWidth;
		}
	},
	/**
	 * @description 绘制表格控件
	 **/
	render : function() {
		this.element = document.getElementById(this.gridId);
		if (!this.element) {
			this.element = document.createElement('div');
			this.element.className = 'rui-grid-main';
		}
		var element = $(this.element);
		if(!this.columns || this.columns.length == 0) {
			alert("columns is null, please check!");
			return;
		}
		if(!this.isPage) {
			element.addClass("rui-grid-main-border");
		}
		this._initDefaulParam();
		//创建表头
		this.headTable = document.createElement('table');
		this.headTable.className = 'rui-grid-table';
		/*if (this.width > 20) {
			this.headTable.style.width = this.width - 20 + 'px';
		}*/
		this.headDom = $('<div class="rui-grid-header"></div>').append(this.headTable);
		element.append(this.headDom);
		this._createHead();
		this.scrollerDOM = document.createElement('div');
		this.scrollerDOM.className = 'rui-grid-scroller';
		if (this.height) {
			this.scrollerDOM.style.height = this.height;
		}
		this.bodyTable = document.createElement('table');
		this.bodyTable.className = 'rui-grid-table';
		/*if (this.width > 20) {
			this.bodyTable.style.width = this.width - 20 + 'px';
		}*/
		$(this.scrollerDOM).append($('<div class="gridTbody"></div>').append(this.bodyTable));
		element.append(this.scrollerDOM);
		//创建表内空
		this._createTableData();
		//注册滚动事件
		this._initGobalEvent();
	},
	_initGobalEvent : function() {
		var $this = this;
		$(this.scrollerDOM).bind("scroll.scroller", function(event) {
			$this._onScrollGrid.call($this, event);
		});
		$(this.scrollerDOM).bind("resize.scroller", function(event) {
			$this._onScrollGrid.call($this, event);
		});
		if(this.isMulti) {
			$(this.selectAllCheckboxDOM).bind("click", function() {
				if(this.checked == true) {
					$this.selectAll(true);
				} else {
					$this.selectAll(false);
				}
			});
		}
	},
	/**
	 滚动表格的滚动条事件
	 **/
	_onScrollGrid : function(event) {
		var $this = this;
		var header = $($this.headDom);
		var scroller = $($this.scrollerDOM);
		if(scroller.scrollLeft() > 0) {
			header.css("position", "relative");
			var scroll = scroller.scrollLeft();
			var cssPre = scroller.css("left");
			var left = cssPre.substring(0, cssPre.indexOf("px")) * 1;
			header.css("left", left - scroll);
		}
		if(scroller.scrollLeft() == 0) {
			header.css("position", "relative");
			header.css("left", "0px");
		}
		return true;
	},
	_clearAndInitDOM : function() {
		$(this.bodyTable).empty();
	},
	/**
	 * @description 重新绘制
	 * @param  {Object} gridData 表格数据数据类型的数据或者存有json对象的数组,如果是表格类型的
	 **/
	update : function(gridData) {
		this._clearAndInitDOM();
		if(gridData) {
			// 如果有数据,要清空所有选择行
			if (this.selectAllCheckboxDOM) {
				this.selectAllCheckboxDOM.checked = false;
			}
			this.rowCheckboxDOM = [];
			this.gridData = gridData;
			if(this.pageWidget) {
				var pageSize = this.pageWidget.getPageSize();
				var curPage = this.pageWidget.getCurPage();
				var dataCount = this.gridData.length;
				// TODO: 为了适应前端页面定时调用,并保存在当前选择的页
				// 前端需要更改为更新某个单元格的做法,而不是定时拉取数据,刷新整个表格
				if (curPage > Math.ceil(dataCount/pageSize)) {
					this.pageWidget.setCurPage(Math.ceil(dataCount/pageSize) || 1);
				} else {
					this.pageWidget.setCurPage(curPage);
				}
			}
			if(this._queryConditon) {
				this._queryConditon = null;
			}
		}
		this._createTableData();
	},
	/**
	 * 创建表头
	 **/
	_createHead : function() {
		var $this = this;
		//表头
		var tbody = this.headTable.tBodies[0];
		var headHead = document.createElement("thead");
		var trHeader = document.createElement("tr");
		if(!tbody) {
			this.headTable.appendChild(headHead);
		} else {
			tbody.appendChild(headHead);
		}
		headHead.appendChild(trHeader);
		if(this.isMulti) {
			var theCell_0 = document.createElement("th");
			var div_0 = document.createElement("div");
			trHeader.appendChild(theCell_0);
			div_0.className = "rui-grid-td-div";
			this.selectAllCheckboxDOM = document.createElement('input');
			this.selectAllCheckboxDOM.type = 'checkbox';
			div_0.appendChild(this.selectAllCheckboxDOM);
			theCell_0.className = 'rui-grid-header-th rui-grid-header-multi';
			theCell_0.appendChild(div_0);
		}
		for(var i=0; i<this.columns.length; i++) {
			var thCell = document.createElement("th");
			trHeader.appendChild(thCell);
			thCell.className = 'rui-grid-header-th';
			var tHeadName = this.columns[i].caption;
			var headWidth = this.columns[i].width;
			//添加宽度默认为
			if(!this._isNull(headWidth)) {
				thCell.width = headWidth + "px";
			}
			var div = document.createElement("div");
			div.className = "rui-grid-td-div";
			div.innerHTML = tHeadName;
			thCell.appendChild(div);
			//hover事件处理
			var orderBy = this.columns[i].orderBy;
			if(!this._isNull(orderBy)) {
				thCell.colIndex = i;
				thCell.isFirst = true;
				thCell.orderBy = orderBy;
				$(thCell).addClass("rui-grid-header-none");
				if(this.orderNeedTitle) {
					thCell.title = "点击按" + tHeadName + "排序";
					$(thCell).bind("click", function() {
						var cell = this;
						$this._sortColumn.call($this, cell);
						cell.isFirst = false;
					});
				}
			}
		}
	},
	/**
	 * @description 获取行的数据
	 * @param  {Object} cell
	 * @return {null} null
	 **/
	_sortColumn : function(cell) {
		var colIndex = cell.colIndex;
		var orderType = cell.orderBy;
		var isFirst = cell.isFirst;
		var isArray = this._isArray(this.gridData[0]);
		var curStatus = "";
		if(isFirst) {
			if(!this.orderByFunc) {
				this.gridData.sort(this._generateCompareData(colIndex, isArray));
			}
			//如果降序的话
			if(orderType == "des") {
				if(this.orderByFunc) {
					this.orderByFunc(this.columns[colIndex].name, "des");
				} else {
					this.gridData.reverse();
				}
				$(cell).addClass("rui-grid-header-des");
			} else {
				$(cell).addClass("rui-grid-header-asc");
				if(this.orderByFunc) {
					this.orderByFunc(this.columns[colIndex].name, "asc");
				}
			}
			cell.isFirst = false;
		} else {

			if(cell.className.indexOf("rui-grid-header-des") >= 0) {
				$(cell).removeClass("rui-grid-header-des");
				$(cell).addClass("rui-grid-header-asc");
				if(this.orderByFunc) {
					this.orderByFunc(this.columns[colIndex].name, "asc");
				} else {
					this.gridData.reverse();
				}
			} else {
				$(cell).removeClass("rui-grid-header-asc");
				$(cell).addClass("rui-grid-header-des");
				if(this.orderByFunc) {
					this.orderByFunc(this.columns[colIndex].name, "des")
				} else {
					this.gridData.reverse();
				}
			}
		}
		var curIndex = parseInt(colIndex);
		if(this.isMulti) {
			curIndex = curIndex + 1;
		}
		var tr = cell.parentElement;
		for(var i = 0; i < tr.cells.length; i++) {
			var th = tr.cells[i];
			if(i == curIndex) {
				continue;
			}
			th.isFirst = true;
			var clsName = th.className;
			if(clsName.indexOf("rui-grid-header-des") != -1) {
				$(th).removeClass("rui-grid-header-des");
			}
			if(clsName.indexOf("rui-grid-header-asc") != -1) {
				$(th).removeClass("rui-grid-header-asc");
			}
		}
		if(this.orderByFunc) {
			return;
		}
		this.update();
	},
	/**
	 * @description 获取行的数据
	 * @param  {int} rowIndex
	 * @return {Object} 返回JSON类型的数据或者数组类型的数据
	 **/
	_generateCompareData : function(colIndex, isArray) {
		var $this = this;
		return function compareData(data1, data2) {
			var sDataType = $this.columns[colIndex].type;
			var vValue1 = isArray ? data1[colIndex] : data1[$this.columns[colIndex].name];
			var vValue2 = isArray ? data2[colIndex] : data2[$this.columns[colIndex].name];
			vValue1 = $this._converData(vValue1, sDataType);
			vValue2 = $this._converData(vValue2, sDataType);
			if(!vValue1) {
				return -1;
			}
			if(!vValue2) {
				return 1;
			}
			if(vValue1 < vValue2) {
				return -1;
			} else if(vValue1 > vValue2) {
				return 1;
			} else {
				return 0;
			}
		};
	},
	/**
	 * @description  判断函数是否存在
	 **/
	_converData : function(data, _dataType) {
		var value = data;
		var dataType = _dataType;
		if(!data) {
			value = "";
		}
		if(!dataType) {
			dataType = "";
		}
		dataType = dataType.toLowerCase();
		value = $.trim(value);
		if(!value) {
			value = "";
		}
		var v_result = null;
		switch (dataType) {
			case "number":
				v_result = new Number(value.replace(/,/g, ''));
				return isNaN(v_result) ? null : v_result;
			case "string":
				return value.toString();
			case "date":
				//去掉nbsp以及把-改成/再转换成日期类型的
				v_result = new Date(Date.parse(value.replace(/^[\s\u3000\xA0]+/g, '').replace(/-/g, '/')));
				return isNaN(v_result) ? null : v_result;
			default:
				return value.toString();
		}
	},
	/**
	 创建表内容:
	 **/
	_createTableData : function() {
		//表头
		var tableBody = null;
		if(this.bodyTable.tBodies[0]) {
			tableBody = this.bodyTable.tBodies[0];
		} else {
			tableBody = document.createElement("tbody");
			this.bodyTable.appendChild(tableBody);
		}
		this._initPageWidget();
		//处理数据为空的情况
		if(this.gridData.length == 0) {
			var theTr = document.createElement("tr");
			var td = document.createElement("td");
			var len = this.columns.length;
			if(this.isMulti) {
				len = len + 1;
			}
			td.colspan = len;
			td.style.width = "100%";
			theTr.appendChild(td);
			td.className = 'rui-grid-header-multi';
			td.innerHTML = "<b>无记录信息</b>";
			td.style.height = (this.height - 1) + "px";
			$(this.element).addClass("rui-grid-main-border");
			tableBody.appendChild(theTr);
			return;
		}
		var beginIndex = 0;
		var endIndex = this.gridData.length;
		if(this.isPage && this.pageWidget) {
			beginIndex = this.getRealIndex(0);
			endIndex = beginIndex + this.pageWidget.getPageSize();
			if(endIndex > this.gridData.length) {
				endIndex = this.gridData.length;
			}
		}
		var isArray = this._isArray(this.gridData[0]);
		var index = 0;
		var $this = this;
		for(var i = beginIndex; i < endIndex; i++) {
			var theTr = document.createElement("tr");
			$(theTr).data("rowTableIndex", index + "");
			tableBody.appendChild(theTr);
			var checkbox = null;
			if(this.isMulti) {
				var td1 = document.createElement("td");
				theTr.appendChild(td1);
				td1.className = 'rui-grid-body-td rui-grid-header-multi';
				var div_0 = document.createElement("div");
				checkbox = this._addCheckBox(index, td1);
				this.rowCheckboxDOM.push(checkbox);
			}
			if(isArray) {
				this._dealArrayData(theTr, index, i, checkbox);
			} else {
				this._dealJsonData(theTr, index, i, checkbox);
			}
			if(this.isIntervalColor) {
				if((i + 1) % 2 == 1) {
					$(theTr).addClass(this.intervalClass);
				}
			}
			this._dealTrEvent(theTr, checkbox, index);
			index++;
		}
		//处理跨页选中的代码
		this._dealPageSelect();
	},
	/**
	 处理分页组件
	 **/
	_initPageWidget : function() {
		/*谁说的数据不分页就是服务器分页了 -- lulinfeng*/
		//数据无须进行分页,则说明服务器分页,pageWidget不能为空
		var totalCount = this.gridData.length;
		if(this.isPage && this._isNull(this.pageWidget)) {
			this.pageWidgetOptions.totalCount = totalCount;
			this.pageWidget = new rui.Page(this.pageWidgetOptions);
			this.pageWidget.setBindWidget(this);
			this.element.appendChild(this.pageWidget.element);
		} else if(this.isPage && !this._isNull(this.pageWidget)) {
			this.pageWidget.setTotalCount(totalCount);
			if(!this.pageWidget.bindWidget) {
				this.pageWidget.setBindWidget(this);
			}
			this.pageWidget.update();
		}

	},
	/**
	 添加checkbox并且添加checkbox选中事件
	 **/
	_addCheckBox : function(rowIndex, td) {
		var checkObj = document.createElement("input");
		checkObj.type = "checkbox";
		td.appendChild(checkObj);
		checkObj.value = rowIndex;
		var $this = this;
		$(checkObj).on('click', function(event) {
			event.stopPropagation();
			var isChecked = this.checked;
			var row = $this.bodyTable.rows[rowIndex];
			var data = $this.getRowData(rowIndex + 1);
			if(isChecked) {
				$(row).addClass($this.selectedClass);
				if($this.isSelectAll()) {
					$this.selectAllCheckboxDOM.checked = true;
				}
				$this._addSelectedData([data]);
			} else {
				$(row).removeClass($this.selectedClass);
				$this._removeSelectedData([data]);
				$this.selectAllCheckboxDOM.checked = false;
			}
		});
		return checkObj;
	},
	/**
	 处理数组类型的数据
	 **/
	_dealArrayData : function(theTr, index, realIndex, checkbox) {
		for(var j = 0; j < this.columns.length; j++) {
			var columnName = this.columns[j].name;
			var cellValue = this.gridData[realIndex][j];
			if(!cellValue) {
				cellValue = "";
			}
			var td = document.createElement("td");
			td.className = 'rui-grid-body-td';
			//处理formater
			var formater = this.columns[j].formater;
			if(formater && formater != "") {
				this._dealFormater(theTr, formater, j, index, cellValue, this.gridData[realIndex]);
				continue;
			}
			//设置表格的样式
			theTr.appendChild(td);
			var div = document.createElement("div");
			td.appendChild(div);
			div.className = "rui-grid-td-div";
			div.innerHTML = cellValue;
			td.title=cellValue;//
			this._setCellStyle(j, td);
			//this._dealPageSelect(columnName, cellValue, checkbox, j)
		}
	},
	/**
	 处理json类型的数组
	 **/
	_dealJsonData : function(theTr, index, realIndex, checkbox) {
		for(var j = 0; j < this.columns.length; j++) {
			var columnName = this.columns[j].name;
			var cellValue = this.gridData[realIndex][columnName];
			if(!cellValue) {
				cellValue = "";
			}
			//处理formater
			var formater = this.columns[j].formater;
			if(formater && formater != "") {
				this._dealFormater(theTr, formater, j, index, cellValue, this.gridData[realIndex]);
				continue;
			}
			var td = document.createElement("td");
			td.className = 'rui-grid-body-td';
			var div = document.createElement("div");
			div.className = "rui-grid-td-div";
			if (this.columns[j].edit) {
				div.contentEditable = true;
				div.name = columnName;
				var self = this;
				if (this.columns[j].evt) {
					$(div).on('blur', this.clolumns[j].evt);
				} else {
					$(div).on('blur', function () {
						var rowIndex = $(this).parents('tr').data('rowIndex');
						var rowData = self.getRowData(rowIndex);
						rowData[this.name] = this.textContent;
					});
				}
			}
			div.innerHTML = cellValue;
			td.title=cellValue;//
			td.appendChild(div);
			theTr.appendChild(td);
			this._setCellStyle(j, td);
			//this._dealPageSelect(columnName, cellValue, checkbox, j)
		}
	},
	// TODO: 这个跨页选中处理函数太撮了..
	_dealPageSelect : function() {
		if(!this.isUsePageSelect || this.primaryKey == false || !this.isMulti) {
			return;
		}
		var pageData = this.getGridData(true);
		var rows = this.bodyTable.rows;
		if(!this.rowCheckboxDOM || this.rowCheckboxDOM.length == 0) {
			return;
		}
		//如果列的名称!=表格主键的名称则返回
		for(var i = 0; i < pageData.length; i++) {
			var isExsist = false;
			var temp = pageData[i];
			for(var j = 0; j < this.selectedData.length; j++) {
				var data = this.selectedData[j];
				if(temp[this.primaryKey] == data[this.primaryKey]) {
					isExsist = true;
					break;
				}
			}
			if(isExsist) {
				this.rowCheckboxDOM[i].checked = true;
				$(rows[i]).addClass(this.selectedClass);
			}
		}
		if(this.isSelectAll()) {
			this.selectAllCheckboxDOM.checked = true;
		}
	},
	/**
	 处理formater事件
	 **/
	_dealFormater : function(trObj, funName, colIndex, rowIndex, cellValue, rowData) {
		var td1 = document.createElement("td");
		td1.className = 'rui-grid-body-td';
		var cellValue11 = "";
		rowIndex = rowIndex + 1;
		if(typeof funName == "function") {
			cellValue11 = funName(rowIndex, cellValue, rowData);
		} else {
			var isFunExsit = this._isPageCallbackExist(funName);
			if(!isFunExsit) {
				alert("列formater函数不存在！请检查！");
				td1.innerHTML = cellValue;
				tdl.title= cellValue;//
				trObj.appendChild(td1);
				return;
			}
			cellValue11 = eval(funName + "(rowIndex,cellValue,rowData)");
		}
		var div = document.createElement("div");
		div.className = "rui-grid-td-div";
		if(cellValue11 instanceof jQuery) {
			cellValue11.appendTo($(div));
		} else if($.isArray(cellValue11)) {
			for(var t=0; t<cellValue11.length; t++) {
				cellValue11[t].appendTo($(div));
			}
		} else {
			div.innerHTML = cellValue11.toString();
			div.title=cellValue11.toString();
		}
		td1.appendChild(div);
		trObj.appendChild(td1);
		this._setCellStyle(colIndex, td1);
	},
	/**
	 设置表格数据的样式
	 **/
	_setCellStyle : function(colIndex, tdCell) {
		var className = this.columns[colIndex].className;
		var styleName = this.columns[colIndex].styleName;
		var width = this.columns[colIndex].width;
		var div = null;
		if($(tdCell).children().length > 0) {
			div = $(tdCell).children()[0];
		}
		//增加样式class
		if(!this._isNull(className) && div) {
			$(div).addClass(className);
		}
		//添加宽度默认为
		if(!this._isNull(width)) {
			tdCell.width = width + "px";
		}
	},
	/**
	 *处理TR事件
	 **/
	_dealTrEvent : function(tr, checkbox, index) {
		var $this = this;
		$(tr).data("rowIndex", (index + 1) + "");
		if($this.isNeedHover) {
			$(tr).on("mouseover", function() {
				$(this).addClass($this.hoverClass);
			});
			$(tr).on("mouseout", function() {
				$(this).removeClass($this.hoverClass);
			});
		}
		$(tr).on("click", function(event) {
			var realIndex = $this.getRealIndex(index + 1);
			var src = $(tr);
			// 单选
			if(!$this.isMulti) {
				src.parent().children().filter("." + $this.selectedClass).removeClass($this.selectedClass);
				src.addClass($this.selectedClass);
			} else {
				// 多选 只选,不反选
				if(tr.className.indexOf($this.selectedClass) == -1) {
					var rowData = $this.gridData[realIndex - 1];
					$this._addSelectedData([rowData]);
					src.addClass($this.selectedClass);
					checkbox.checked = true;
					if($this.isSelectAll()) {
						$this.selectAllCheckboxDOM.checked = true;
					}
				}
			}
		});
	},
	_addSelectedData : function(data) {
		if(!this.isUsePageSelect || this.primaryKey == false) {
			return;
		}
		if(!this.selectedData || this.selectedData.length <= 0) {
			this.selectedData = [];
		}
		if(!data || data.length <= 0) {
			return;
		}
		var isExsit = false;
		var newArray = [];
		for(var i = 0; i < data.length; i++) {
			var temp = data[i];
			var isExist = false;
			for(var j = 0; j < this.selectedData.length; j++) {
				if(temp[this.primaryKey] == this.selectedData[j][this.primaryKey]) {
					isExist = true;
					break;
				}
			}
			if(!isExist) {
				newArray.push(data[i]);
			}
		}
		this.selectedData = this.selectedData.concat(newArray);
	},
	_removeSelectedData : function(data) {
		if(!this.isUsePageSelect || this.primaryKey == false) {
			return;
		}
		if(!this.selectedData || this.selectedData.length <= 0) {
			return;
		}
		if(!data || data.length <= 0) {
			return;
		}
		var newArray = [];
		for(var i = 0; i < this.selectedData.length; i++) {
			var temp = this.selectedData[i];
			var isExist = false;
			for(var j = 0; j < data.length; j++) {
				if(temp[this.primaryKey] == data[j][this.primaryKey]) {
					isExist = true;
					break;
				}
			}
			if(!isExist) {
				newArray.push(this.selectedData[i]);
			}
		}
		this.selectedData = [];
		this.selectedData = newArray;
	},
	/**
	 * @description 获取行的数据
	 * @param  {int} rowIndex
	 * @return {Object} 返回JSON类型的数据或者数组类型的数据
	 **/
	getRowData : function(rowIndex) {
		var beginIndex = 0;
		if(!this.gridData.length) {
			alert("表格中没有数据");
			return null;
		}
		if(rowIndex <= 0 || rowIndex > this.gridData.length) {
			alert("索引范围出错!" + rowIndex);
			return;
		}
		//gridData中的数据是是需要分页的情况
		rowIndex = this.getRealIndex(rowIndex);
		if(rowIndex == -1) {
			return null;
		}
		return this.gridData[rowIndex - 1];
	},
	/**
	 * @description 重新设置某行的表格数据
	 * @param  {int} rowIndex 要更新行
	 * @param  {object} rowData 要更新的数据
	 * @return {Object} 返回JSON类型的数据或者数组类型的数据
	 **/
	setRowData : function(rowIndex, rowData, func) {
		var beginIndex = 0;
		if(!this.gridData.length) {
			alert("表格中没有数据");
			return null;
		}
		if(rowIndex <= 0 || rowIndex > this.gridData.length) {
			alert("索引范围出错!" + rowIndex);
			return;
		}
		if(!rowData) {
			alert("更新的新数据不能为空");
			return;
		}
		//gridData中的数据是是需要分页的情况
		rowIndex = this.getRealIndex(rowIndex);
		if(rowIndex == -1) {
			return null;
		}
		var isOk = true;
		//是否是异步调用
		if(func) {
			isOk = func(rowData);
		}
		if(!isOk) {
			return;
		}
		this.gridData[rowIndex - 1] = rowData;
		this.update();
		return true;
	},
	/**
	 * @description 重新设置某行的表格数据
	 * @param  {int} rowIndex 1-到pageNum
	 * @return {int} 返回经过分页计算过的索引
	 **/
	getRealIndex : function(rowIndex) {
		rowIndex = parseInt(rowIndex);
		if(this.isPage && this.pageWidget) {
			if(rowIndex > this.gridData.length) {
				return -1;
			}
			rowIndex = (this.pageWidget.getCurPage() - 1) * (this.pageWidget.getPageSize()) + rowIndex;
		}
		return rowIndex;
	},
	/**
	 * @description 获取选中表格中的数据
	 * @return {Object} 表格数据数据类型的数据或者存有json对象的数组,如果是表格类型的
	 * @return {isSelectPage}  返回,是否跨页选中的内容
	 **/
	getSelectedRows : function(isSelectPage) {
		if(isSelectPage) {
			return this.selectedData;
		}
		var selectedData = [];
		var rows = this.bodyTable.rows;
		if(this.selectedIndexs || this.selectedIndexs > 0) {
			delete this.selectedIndexs;
			this.selectedIndexs = [];
		}
		for(var i = 0; i < rows.length; i++) {
			if(rows[i].className.indexOf(this.selectedClass) != -1) {
				var data = this.getRowData(i + 1);
				var realIndex = this.getRealIndex(i);
				this.selectedIndexs.push(realIndex);
				selectedData.push(data);
			}
		}
		return selectedData;
	},
	/**
	 * @description 获取当前鼠标悬浮所在行的数据
	 */
	getHoverData: function () {
		var rowTableIndex = $(this.bodyTable).find('.' + this.hoverClass).data('rowTableIndex');
		var index = this.getRealIndex(rowTableIndex);
		return this.gridData[index];
	},
	/**
	 * @description 获取选中表格中的数据
	 * @param  {int} cols 封装的是表头的数据
	 **/
	setColumns : function(cols) {
		this.columns = cols;
	},
	/**
	 * @description    获取列的信息
	 * @param  {int} cols 封装的是表头的数据
	 **/
	getColumns : function() {
		return this.columns;
	},
	/**
	 * @description  获取表格所需要的数据
	 * @param  {int} data 封装的是表头的数据
	 **/
	setGridData : function(data) {
		this.gridData = data;
		if(this.pageWidget) {
			this.pageWidget.setCurPage(1);
		}
		if(this._queryConditon) {
			this._queryConditon = null;
		}

	},
	/**
	 * @description    获取表格或者表格某一个页的数据
	 * @param  {isPage} 是否是获取全当页的数据,还是全部的数据
	 **/
	getGridData : function(isPage) {
		if(!isPage || !this.isPage) {
			return this.gridData;
		}
		var beginIndex = 0;
		var endIndex = this.gridData.length;
		if(this.isPage && this.pageWidget) {
			beginIndex = this.getRealIndex(0);
			endIndex = beginIndex + this.pageWidget.getPageSize();
			if(endIndex > this.gridData.length) {
				endIndex = this.gridData.length;
			}
		}
		var pageData = [];
		for(var i = beginIndex; i < endIndex; i++) {
			pageData.push(this.gridData[i]);
		}
		return pageData;
	},
	/**
	 * @description  删除指的行中的表格数,并提供外接函数接口来实现,业务相关的处理
	 * @param  {int} rowIndex 表格行中的索引从1开始
	 * @param  {Function} func 外接函数实现业务处理
	 * @return {null}
	 **/
	removeRow : function(rowIndex, func) {
		if(!this.enabled) {
			return;
		}
		rowIndex = parseInt(rowIndex);
		var rowData = this.getRowData(rowIndex);
		if(rowData == null) {
			return;
		}
		var isOk = true;
		//是否是异步调用
		if(func) {
			isOk = func(rowData);
		}
		if(!isOk) {
			//alert("remove fail");
			return;
		}
		if(this.getGridDataFunc) {
			this.gridData = this.getGridDataFunc();
			if(!this._queryConditon) {
				this.queryGrid(this._queryConditon);
			} else {
				this.update();
			}
			return;
		}
		rowIndex = this.getRealIndex(rowIndex);
		if(rowIndex == -1) {
			return;
		}
		//移除该数据
		var newArray = [];
		for(var i = 0; i < this.gridData.length; i++) {
			if(i == (rowIndex - 1)) {
				continue;
			}
			newArray.push(this.gridData[i]);
		}
		this.gridData = null;
		this.gridData = [];
		this.gridData = newArray;
		this.update();
		return true;
	},
	/**
	 * @description  删除选中的行的业 务
	 * @param  {Function} func 外接函数实现业务处理
	 * @return {null}
	 **/
	removeSelectedRows : function(func) {
		if(!this.enabled) {
			return;
		}
		var isOk = true;
		//是否是异步调用
		var rowData = this.getSelectedRows();
		if(func) {
			isOk = func(rowData);
		}
		if(!isOk) {
			//alert("remove fail");
			return;
		}
		if(this.getGridDataFunc) {
			this.gridData = this.getGridDataFunc();
			if(!this._queryConditon) {
				this.queryGrid(this._queryConditon);
			} else {
				this.update();
			}
			return;
		}

		//移除该数据
		var newArray = [];
		if(!this.selectedIndexs || this.selectedIndexs.length <= 0) {
			return;
		}
		for(var i = 0; i < this.gridData.length; i++) {
			var selectedStr = "," + this.selectedIndexs.toString() + ",";
			var curStr = "," + (i) + ",";
			if(selectedStr.indexOf(curStr) >= 0) {
				continue;
			}
			newArray.push(this.gridData[i]);
		}
		this.gridData = null;
		this.gridData = [];
		this.gridData = newArray;
		this.update();
		return true;
	},
	/**
	 * @description 添加一个行的功能,并提供外接函数接口来实现,业务相关的处理
	 * @param  {Object} rowData 保存行信息的一个数组,或者JSON类型的数据
	 * @param  {Function} func 外接函数实现业务处理
	 * @return {null}
	 **/
	addRow : function(rowData, pos) {
		if(!this.enabled) {
			return;
		}
		if(rowData == null) {
			alert("data is null");
			return;
		}
		//非指定位置插入
		if(pos == undefined || Math.abs(pos) > this.gridData.length) {
			pos = 0;
		}
		if (pos == -1) {
			this.gridData.push(rowData);
		} else {
			this.gridData.splice(pos, 0, rowData);
		}
		if(this.pageWidget) {
			if(pos < 0) {
				pos = this.gridData.length + pos + 1;
			} else {
				pos++;
			}
			var pageSize = this.pageWidget.getPageSize();
			var curPage = pos % pageSize == 0 ? parseInt((pos / pageSize)) : parseInt((pos / pageSize)) + 1;
			this.pageWidget.setCurPage(curPage);
		}
		this.update();
		return true;
	},
	/**
	 * @description 通过设置跟列信息相关数据对表格进行过虑查询
	 * @param  {Object} rowData 保存行信息的一个数组,或者JSON类型的数据
	 * @param  {Function} func 外接函数实现业务处理
	 * @example var condition={id:"1",name="lulinfeng",} grid.queryGrid(condition);
	 * @return {null}
	 **/
	queryGrid : function(condition) {
		if(!this.enabled) {
			return;
		}
		var resultData = []//是个数据
		this._queryRowIndex = [];
		this._queryConditon = condition;
		for(var i = 0; i < this.gridData.length; i++) {
			var isPass = true;
			for(var m in condition) {
				var con = condition[m];
				if(con && con.toString() != "" && this.gridData[i][m].indexOf(con) == -1) {
					isPass = false;
					break;
				}
			}
			if(isPass) {
				resultData.push(this.gridData[i]);
				this._queryRowIndex.push(i);
			}
		}
		this._isQuery = true;
		this.gridData = resultData;
		if(this.pageWidget) {
			this.pageWidget.setCurPage(1);
		}
		this.update();
		this._isQuery = false;
	},
	/**
	 * @description 提供批量删除表格控件,并提供外接函数接口来实现,业务相关的处理
	 * @param  {int} beginIndex  所要删除的开始索引
	 * @param  {int} endIndex    所要删除的结束索引
	 * @param  {Function} func   外接函数实现业务处理
	 * @return {null}
	 **/
	removeRows : function(beginIndex, endIndex, func) {
		if(!this.enabled) {
			return;
		}
		if(beginIndex <= 0) {
			alert("beginIndex error must>=0");
			return;
		}
		if(endIndex <= 0) {
			alert("endIndex error must>=0");
			return;
		}

		if(beginIndex >= endIndex) {
			alert("beginIndex error must<endIndex");
			return;
		}
		var intervalVal = endIndex - beginIndex;
		beginIndex = this.getRealIndex(beginIndex);
		if(beginIndex == -1) {
			return;
		}
		endIndex = beginIndex + intervalVal;
		if(endIndex > this.gridData.length) {
			endIndex = this.gridData.length;
		}
		//获取数据
		var deleteRowDatas = [];
		var newGridData = [];
		for(var i = 0; i < this.gridData.length; i++) {
			if(i >= (beginIndex - 1) && i < endIndex) {
				deleteRowDatas.push(this.gridData[i]);
				continue;
			}
			newGridData.push(this.gridData[i]);
		}
		var isOk = false;
		//是否是异步调用
		if(func) {
			isOk = func(deleteRowDatas);
		}
		if(!isOk) {
			//alert("remove fail!");
			return;
		}
		if(this.getGridDataFunc) {
			this.gridData = this.getGridDataFunc();
			if(!this._queryConditon) {
				this.queryGrid(this._queryConditon);
			} else {
				this.update();
			}
			return;
		}
		//清除原数据
		this.gridData = null;
		this.gridData = newGridData;
		this.update();
		return true;
	},
	/**
	 * @description 提供批量添加表格数据的控件,并提供外接函数接口来实现,业务相关的处理
	 * @param  {Object} datas  所要添加的数据,数据类型是数组或者包括JSON对象的数组
	 * @param  {Function} func   外接函数实现业务处理
	 * @return {null}
	 **/
	addRows : function(datas, pos, func) {
		if(!this.enabled) {
			return;
		}
		if(!datas || !datas.length || datas.length == 0) {
			alert("data is null");
			return;
		}
		var isOk = true;
		//是否是异步调用
		if(func) {
			isOk = func(datas);
		}
		if(!isOk) {
			//alert("add Rows fail!");
			return;
		}
		if(this.getGridDataFunc) {
			this.gridData = this.getGridDataFunc();
			if(!this._queryConditon) {
				this.queryGrid(this._queryConditon);
			} else {
				this.update();
			}
			return;
		}
		if(!pos || pos <= 0) {
			if(this.insertWay == "begin") {
				pos = 1;
			} else {
				pos = this.gridData.length;
			}
		}
		var begin = pos;
		var pageIndex = pos;
		if(this.insertWay == "begin") {
			begin = pos - 1;
		} else {
			begin = pos;
		}
		for(var i = 0; i < datas.length; i++) {
			this.gridData.push("");
		}
		var len = this.gridData.length;
		var dataLen = datas.length;
		for(var i = len; i > (begin + dataLen); i--) {

			this.gridData[i - 1] = this.gridData[(i - dataLen - 1)];
		}
		for(var i = 0; i < datas.length; i++) {
			this.gridData[begin + i] = datas[i];
		}
		if(this.pageWidget) {
			if(this.insertWay != "begin") {
				pos++;
			}
			var pageSize = this.pageWidget.getPageSize();
			var curPage = pos % pageSize == 0 ? parseInt((pos / pageSize)) : parseInt((pos / pageSize)) + 1;
			this.pageWidget.setCurPage(curPage);
		}
		this.update();
		return true;
	},
	/**
	 * @description 提供批量删除表格控件,并提供外接函数接口来实现,业务相关的处理
	 * @param  {Boolean} trueOrfalse   让可以多选的表格,进行多选,或取消多选
	 * @return {null}
	 **/
	selectAll : function(trueOrfalse) {
		if(!this.enabled) {
			return;
		}
		if(!this.isMulti) {
			if(!trueOrfalse) {
				$(this.bodyTable).children().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
			}
			return;
		}
		$(this.selectAllCheckboxDOM).attr("checked", trueOrfalse);
		var checkBoxs = this.rowCheckboxDOM;
		if(!checkBoxs || checkBoxs.length == 0) {
			return;
		}
		var rows = this.bodyTable.rows;
		for(var i = 0; i < checkBoxs.length; i++) {
			//alert();
			var isDisabled = $(rows[i]).attr("disabled");
			if(isDisabled || isDisabled == "undefined") {
				checkBoxs[i].checked = false;
				continue;
			}
			checkBoxs[i].checked = trueOrfalse;
			var src = this.bodyTable.rows[i];
			if(!trueOrfalse) {
				if(src.className.indexOf(this.selectedClass) != -1) {
					$(src).removeClass(this.selectedClass);
				}
			} else {
				$(src).addClass(this.selectedClass);
			}
		}
		if(trueOrfalse) {
			this._addSelectedData(this.getSelectedRows());
		} else {
			this._removeSelectedData(this.getGridData(true));
		}
	},
	/**
	 * @description 让某一个选中或非选中
	 * @param  {int} rowIndex   行的索引位置从1开始
	 * @param  {Boolean} trueOrfalse   让表格的某一行选 中,或取消选中
	 * @return {null}
	 **/
	setSelectedRow : function(rowIndex, trueOrfalse) {
		if(!this.enabled) {
			return;
		}
		var rows = this.bodyTable.rows;
		rowIndex = parseInt(rowIndex) - 1;
		if(rowIndex < 0) {
			return;
		}
		var src = this.bodyTable.rows[rowIndex];
		if(!src) {
			return;
		}
		//处理单选
		if(!this.isMulti) {
			$(this.bodyTable).children().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
			if(!trueOrfalse) {
				if(src.className.indexOf(this.selectedClass) != -1) {
					$(src).removeClass(this.selectedClass);
				}
			} else {
				$(src).addClass(this.selectedClass);
			}
			return;
		}
		var checkBoxs = this.rowCheckboxDOM
		if(!checkBoxs[rowIndex]) {
			return;
		}
		checkBoxs[rowIndex].checked = trueOrfalse;
		if(!trueOrfalse) {
			if(src.className.indexOf(this.selectedClass) != -1) {
				$(src).removeClass(this.selectedClass);
			}
		} else {
			$(src).addClass(this.selectedClass);
		}
	},
	/**
	 * @description 判断是否全选
	 * @return {null}
	 **/
	isSelectAll : function() {
		if(!this.enabled) {
			return false;
		}
		var checkBoxs = this.rowCheckboxDOM;
		if(!checkBoxs || !checkBoxs.length) {
			return false;
		}
		var isAll = true;
		for(var i = 0; i < checkBoxs.length; i++) {
			if(!checkBoxs[i].checked) {
				isAll = false;
				break;
			}
		}
		return isAll;
	},
	/**
	 * @description 让某一行可运行或者不可运行.
	 * @param  {int} rowIndex   表格中行的索引
	 * @param  {Boolean} trueOrfalse   让可以多选的表格,进行多选,或取消多选
	 * @return {null}
	 **/
	setRowEnabled : function(rowIndex, trueOrFalse) {

		if(!this.enabled) {
			return;
		}
		rowIndex = parseInt(rowIndex);
		if(rowIndex <= 0) {
			alert("parameter rowIndex<=0 is error");
			return false;
		}
		var rows = this.bodyTable.rows;
		if(rowIndex > rows.length) {
			alert("parameter rowIndex must less than " + rows.length);
			return false;
		}
		var row = rows[rowIndex - 1];
		var checkbox = null;
		var checkBoxs = this.rowCheckboxDOM;
		if(checkBoxs && checkBoxs.length && this.isMulti) {
			checkbox = checkBoxs[rowIndex - 1];
		}
		if(checkbox) {
			$(checkbox).attr("disabled", !trueOrFalse);
		}
		if(trueOrFalse) {
			$(row).removeClass(this.disabledClass);
			this._dealTrEvent(row, checkbox, rowIndex);
			$(row).attr("disabled", false);
		} else {
			$(row).addClass(this.disabledClass);
			$(row).unbind("mouseover");
			$(row).unbind("mouseout");
			$(row).unbind("click");
			$(row).attr("disabled", true);
		}
		return false;
	},
	/**
	 * @description 某一行是否选中
	 * @param  {int} rowIndex   表格中行的索引从1开始
	 * @param  {Boolean} trueOrFalse   让可以多选的表格,进行多选,或取消多选
	 * @return {Boolean}  true or false
	 **/
	isRowSelected : function(rowIndex) {
		rowIndex = parseInt(rowIndex);
		if(rowIndex <= 0) {
			alert("parameter rowIndex<=0 is error");
			return false;
		}
		var rows = this.bodyTable.rows;
		if(rowIndex >= rows.length) {
			alert("parameter rowIndex must less than " + table.rows.length);
			return false;
		}
		var row = rows[rowIndex - 1];
		if(row.className.indexOf("rui-grid-row-selected") != -1) {
			return true;
		}
		return false;
	},
	/**
	 * @description 设置表头的名称
	 * @param  {int} rowIndex  表头的索引从01开始
	 * @param  {String} headName 表头重的名称
	 * @return {null} 无返回
	 **/
	setHeadName : function(index, headName) {
		var row = this.headTable.rows[0];
		$(row.cells[index]).html(headName);
	},
	/**
	 * @description 判断是否有选中的行
	 * @return {Boolean} true or false
	 **/
	hasSelectedRow : function() {
		var selectedData = [];
		var rows = this.bodyTable.rows;
		var isSelected = false;
		for(var i = 0; i < rows.length; i++) {
			if(rows[i].className.indexOf(this.selectedClass) != -1) {
				isSelected = true;
				break;
			}
		}

		return isSelected;
	},
	/**
	 * @description 表格中的行数
	 * @return {int}
	 **/
	getRowSize : function() {
		var rows = this.bodyTable.rows;
		return rows.length;
	},
	/**
	 * @description 设置表格的扩展事件
	 * @param  {String} enventKey  事件对应的键值目前主要有两键值rowClick , rowDblClick
	 * @param  {Function} func   rowClick或者rowDblClick 对应的外接函数
	 * @return {null}  true or false
	 **/
	pushExtendEvents : function(enventKey, func) {
		this.extendEvents[enventKey] = func;
		return;
	},
	/**
	 * @description 从扩展事件的集合中获取扩展事件的键来获取事件函数
	 * @param  {String} key  事件对应的键值目前主要有两键值rowClick , rowDblClick
	 * @return {Function}  返回事件函数
	 **/
	getExtendEvent : function(key) {
		var value = this.extendEvents[key];
		return value;
	},
	/**
	 * @description 设置extendEvents属性的值
	 * @param  {Object} extendEvents  如 {rowClick:func1, rowDblClick:func2};
	 * @return {Function}  返回事件函数
	 **/
	setExtendEvents : function(extendEvents) {
		this.extendEvents = extendEvents;
	},
	/**
	 * 重绘表头
	 */
	resetGridHead : function(cols) {
        this.columns=cols;
        $(this.headTable).empty();
		$(this.headTable).html("");
		this._createHead();
	},
	/**
	 * @description  销回表格控件的对象
	 * @return {null}  无返回值
	 **/
	destroy : function() {
		if(this.element) {
			$(this.element).empty();
			$(this.element).html("");
		}
	},
	/**
	 * @description  显示表格控件
	 * @return {null}  无返回值
	 **/
	show : function() {
		$(this.element).show();
		if(this.pageWidget) {
			this.pageWidget.show();
		}
	},
	/**
	 * @description  隐藏表格控件
	 * @return {null}  无返回值
	 **/
	hide : function() {
		$(this.element).hide();
		if(this.pageWidget) {
			this.pageWidget.hide();
		}

	},
	/**
	 * @description    让表格控件可以活动
	 * @return {null}  无返回值
	 **/
	enable : function() {
		$(this.element).attr("disabled", false);
		this.enabled = true;
		this.update();
		if(this.pageWidget) {
			this.pageWidget.enable();
		}
	},
	/**
	 * @description  让表格控件不可以活动
	 * @return {null}  无返回值
	 **/
	disable : function() {
		$(this.element).attr("disabled", true);
		this.enabled = false;
		this.update();
		if(this.pageWidget) {
			this.pageWidget.disable();
		}
	},
	/**
	 * @description  判断是否是空值
	 **/
	_isNull : function(strValue) {
		if(!strValue || strValue == "") {
			return true;
		} else {
			return false;
		}
	},
	/**
	 * @description  判断是否数组
	 **/
	_isArray : function(obj) {
		return Object.prototype.toString.apply(obj) === '[object Array]';
	},
	/**
	 * @description  判断函数是否存在
	 **/
	_isPageCallbackExist : function(funName) {
		try {
			if( typeof eval(funName) == "undefined") {
				return false;
			}
			if( typeof eval(funName) == "function") {
				return true;
			}
		} catch(e) {
			return false;
		}
	}
};
