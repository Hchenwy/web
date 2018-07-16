/**
 * @author lulinfeng 2015-03-09
 * @constructor Grid
 * @description 表格组件，去除对IE6/7/8的支持
 **/

define(['jquery', 'pagination'], function ($, Pagination) {
	var Grid = function(gridProperty) {
		/* 表格的宽度 */
		this.width = 0;
		/* 表格的高度 */
		this.height = 0;
		/* 表关元素默认的文本方向 */
		this.align = "";
		/* 表格数据 */
		this.gridData = null;
		/* 表格ID */
		this.gridId = "";
		/* 表格是否可以滚动 */
		this.isScroll = false;
		/* 表格是否可以实现拖动并改变大小 */
		this.isResized = false;
		/* 表格的对外扩展事件 */
		this.extendEvents = {
			rowClick : null,
			rowDblClick : null
		};
		/* 表格的列信息 */
		this.columns = null;
		/* 表格控件对应的分页控件 */
		this.pageWidget = null;
		/* 分页控件的属性 */
		this.pageWidgetOptions = {};
		/* 分页控件对应的ID */
		this.pageWidgetId = "";
		/* 选中的样式类名 */
		this.selectedClass = "rui-grid-row-selected";
		/* 隔间的样式类名 */
		this.intervalClass = "rui-grid-row-interval";
		/* 鼠标经过的样式类名 */
		this.hoverClass = "rui-grid-row-hover";
		/*  不可用的样式类名 */
		this.disabledClass = "rui-grid-row-disabled";
		/* 表格是否可以多选 */
		this.isMulti = false;
		/* 是否需要分页,如果需要分页的话,pageWidget分页信息从gridData来获取,
		   否则就是服务分页pageWidget不能为空 */
		this.isPage = true;
		/* 获取函数的外接接口 */
		this.getGridDataFunc = null;
		/* 是否通过调用始初化参数来调用数据 */
		this.isNeedInit = false;
		/* 是否需要鼠标经过事件 */
		this.isNeedHover = true;
		/* 是否需要行合并 */
		this.isRowMerge = false;
		/* 表格是否需要相邻间隔的着色不一样 */
		this.isIntervalColor = true;
		/*  默认的列宽大小 */
		this._defaultColumnWidth = 0;
		/* 表格上一级DOM元素结点 */
		this._gridParentWidth = 0;
		/* 实现列相同记录的列进行行合并,是一个数组 *@see [1,2] */
		this.mergeRowIndexs = null;
		/* 用于程序由于用来临时保存表格数据的数组 */
		this._tempGridData = null;
		/* 表格控件的根元素 */
		this.element = null;
		/* 表格控件是否可以操作 */
		this.enabled = true;
		/* 插入方式 begin,end 默认为after; */

		this.insertWay = "after";
		/* 排序的时候,是否需要title */
		this.orderNeedTitle = true;

		this.orderByFunc = false;
		this._gridParentWidth = 0;

		this.multiWidth = 40;

		this._isQuery = false;
		/* 选中索引 */
		this.selectedIndexs = [];
		/* 是否启用跨页选中的功能 */
		this.isUsePageSelect = false;
		/**
		 * 一个表格的主健  如果是JSON类型的数  primaryKey为
		 * 可以代表表格主键的列的名称,如果为array数据时primaryKey为可代表主键的,列的索引
		 */
		this.primaryKey = false;

		/* 表格选中的数据 */
		this.selectedData = [];
		/* 表格的控件默认属性 */
		this.noRecordMsg = null;

		this._defaultNoRecordMsg = "";
		/* 表格内容的DOM */
		this.dataTableDOM = false;
		/* 表格表头内容DOM */
		this.headTableDOM = false;
		/* 全选checkbox DOM */
		this.selectAllCheckboxDOM = false;
		this.rowCheckboxDOM = [];
		this.scrollerDOM = false;
		this.defaultProperties = {
			width : 450,
			column_default_align : "center"
		};
		if(gridProperty) {
			this.init(gridProperty);
			if(!this.isNeedInit) {
				this.render();
			}
		}
	};
	Grid.prototype = {
		/**
		 *  初始化数据
		 * @param  {Object} gridProperty 跟表格相关的属性对象
		 **/
		init : function(gridProperty) {
			$.extend(this, gridProperty);
		},
		/* 默认参数的初始化 */
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
			if(!this._gridParentWidth || this._gridParentWidth == "") {
				this._gridParentWidth = $(this.element).parent().width();
			}
			if(!this.width || this.width == 0) {
				this.width = this._gridParentWidth;
			}
			if(this.width == 0) {
				this.width = this.defaultProperties.width;
			}
			if(this._isNull(this.align)) {
				this.align = this.defaultProperties.default_align;
			}
			var modWidth = 0;
			var isIE6 = false;

			if(this.isMulti) {
				this._defaultColumnWidth = parseInt((this.width - this.multiWidth - totalLeftWidth - this.columns.length - 20) / (this.columns.length - countColumnWidth));
				modWidth = (this.width - this.multiWidth - totalLeftWidth - this.columns.length - 1) % (this.columns.length - countColumnWidth);
			} else {
				this._defaultColumnWidth = parseInt((this.width - totalLeftWidth - this.columns.length - 19) / (this.columns.length - countColumnWidth));
				modWidth = (this.width - totalLeftWidth - this.columns.length - 1) % (this.columns.length - countColumnWidth);
			}
			if(!this._defaultColumnWidth || (parseInt(this._defaultColumnWidth)) <= 0) {
				this._defaultColumnWidth = 80;
			}
		},
		/* 绘制表格控件 */
		render : function() {
			this.element = document.getElementById(this.gridId);
			var element = $(this.element);
			if(!this.element) {
				alert("grid id is null,please check");
				return;
			}
			if(!this.columns || this.columns.length == 0) {
				alert("columns is null,please check!");
				return;
			}
			//让表的父亲结点实现可以拖动
			element.parent().addClass("j-resizeGrid");
			element.wrap(" <div class='rui-grid'></div>");
			if(!this.isPage) {
				element.parent().append("<div style='width:100%' id='" + this.gridId + "_autoDiv'></div>");
			}
			//没有分页控件的时候添加一个100%的元素用来在IE6中做自适应
			element.addClass("rui-grid-main");
			if(!this.isPage) {
				element.addClass("rui-grid-main-border");
			}
			this._initDefaulParam();
			//搭建框框
			element.html("<div class='rui-grid-header' ><div class='rui-grid-thead' id='" + this.gridId + "_thead'><table id='" + this.gridId + "_headerTable' class='rui-grid-table' style='width:" + (this.width - 2) + "px;'></table></div></div>");
			//创建表头
			this.headTableDOM = document.getElementById(this.gridId + "_headerTable");

			this._createHead();
			element.append("<div class='rui-grid-scroller' id='" + this.gridId + "_scroller'><div class='gridTbody'><table class='rui-grid-table' id='" + this.gridId + "_tableContent' style='width:" + (this.width - 2) + "px;'></table></div></div>");
			this.dataTableDOM = document.getElementById(this.gridId + "_tableContent");
			//创建表内空
			this._createTableData();
			//合并单元格功能
			this._dealMergeRow();
			var $this = this;
			//注册滚动事件
			this.scrollerDOM = document.getElementById($this.gridId + "_scroller");
			var resizeTimer = null
			this._initGobalEvent();
		},
		_initGobalEvent : function() {
			var $this = this;
			/* 窗口拖动事件 */
			$(this.scrollerDOM).bind("scroll.scroller", function(event) {
				$this._onScrollGrid.call($this, event);
			});
			if(this.isMulti) {
				$(this.selectAllCheckboxDOM).bind("click", function() {
					if(this.checked == true) {
						$this.selectAll(true);
					} else {
						$this.selectAll(false);
					}
				})
			}
		},
		/* 滚动表格的滚动条事件 */
		_onScrollGrid : function(event) {
			var $this = this;
			var header = $("#" + $this.gridId + "_thead");
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
		/**
		 自适应表格控件
		 **/
		_onResizeGrid : function(event) {
			if(!this.firstResize) {
				this.firstResize = true;
				return;
			}
			var gridId = this.gridId;
			var scroller = $(this.scrollerDOM);
			var head = $("#" + this.gridId + "_thead");
			var headWidth = head.width();
			var element = $(this.element);
			var width = 0;
			//用分页控件DIV做自适应
			if(this.pageWidget && this.pageWidget.pageId) {
				var pageId = this.pageWidget.pageId;
				width = $("#" + pageId).width();
			}
			//添加一个100%的div做自适应
			else {
				width = $("#" + gridId + "_autoDiv").width();
			}
			if(width <= 0) {
				return;
			}
			$(this.element).width(width + "px");
			scroller.width((width - 2) + "px");
			scroller[0].doScroll();
			return;

		},
		_clearAndInitDOM : function() {
			var rowNum = this.dataTableDOM.rows.length;
			for(var i = 0; i < rowNum; i++) {
				var row = $(this.dataTableDOM.rows[i]);
				if(this.isMutil) {
					var checkbox = this.rowCheckboxDOM[i];
					$(checkbox).unbind("click");
					$(checkbox).remove();
				}
				row.unbind("mouseover");
				row.unbind("mouseout");
				row.unbind("click");
				row.unbind("dblclick");
				row.html("");
				this.dataTableDOM.deleteRow(i);
				rowNum = rowNum - 1;
				i = i - 1;
			}
			this.rowCheckboxDOM = [];
			$(this.dataTableDOM).empty();
			$(this.dataTableDOM).html("");

		},
		/* 重新绘制
		 * @param  {Object} gridData 表格数据数据类型的数据或者存有json对象的数组,如果是表格类型的
		 */
		update : function(gridData) {
			this._clearAndInitDOM();
			if(gridData) {
				this.gridData = gridData;
				this._tempGridData = [];
				this._tempGridData = gridData;
				if(this.pageWidget) {
					this.pageWidget.setCurPage(1);
				}
				if(this._queryConditon) {
					this._queryConditon = null;
				}
			}
			this._createTableData();
			//如果需要合并则进行合并
			this._dealMergeRow();
		},
		/* 创建表头 */
		_createHead : function() {
			var $this = this;
			//表头
			var tbody = this.headTableDOM.tBodies[0];
			var headHead = document.createElement("thead");
			var trHeader = document.createElement("tr");
			if(!tbody) {
				this.headTableDOM.appendChild(headHead);
			} else {
				tbody.appendChild(headHead);
			}
			headHead.appendChild(trHeader);
			if(this.isMulti) {
				var theCell_0 = document.createElement("th");
				var div_0 = document.createElement("div")
				trHeader.appendChild(theCell_0);
				div_0.className = "rui-grid-td-div";
				div_0.innerHTML = "<input type='checkbox' id='" + this.gridId + "_selectTrueOrFalse'/>";
				theCell_0.align = "center";
				theCell_0.className = 'rui-grid-header-th rui-grid-header-multi';
				// zyb----添加
				theCell_0.appendChild(div_0);
				this.selectAllCheckboxDOM = document.getElementById(this.gridId + "_selectTrueOrFalse");
			}
			for(var i = 0; i < this.columns.length; i++) {
				var thCell = document.createElement("th");
				trHeader.appendChild(thCell);
				thCell.className = 'rui-grid-header-th';
				// zyb----添加
				var tHeadName = this.columns[i].caption;
				var isZh = true;
				//中英文支持
				if(window.language && window.language == "en") {
					tHeadName = this.columns[i].enCaption;
					isZh = false;
				}
				var headerClass = this.columns[i].headerStyle;
				var headerStyle = this.columns[i].headerStyle;
				var headWidth = this.columns[i].width;
				//增加样式类
				if(!this._isNull(headerClass)) {
					thCell.className = headerClass;
				}
				//增加样式
				if(!this._isNull(headerStyle)) {
					$(thCell).css(headerStyle);
				}
				if(!this._isNull(this.align)) {
					thCell.align = this.align;
				} else {
					thCell.align = this.defaultProperties.column_default_align;
				}
				//添加宽度默认为
				if(!this._isNull(headWidth)) {
					thCell.width = headWidth + "px";
				} else {
					thCell.width = this._defaultColumnWidth + "px";
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
						if(isZh) {
							thCell.title = "点击按" + tHeadName + "排序";
						} else {
							thCell.title = "click order by " + tHeadName;
						}
						$(thCell).bind("click", function() {
							var cell = this;
							$this._sortColumn.call($this, cell);
							cell.isFirst = false;
						})
					}
				}
			}
		},
		/**
		 *  获取行的数据
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
		 *  获取行的数据
		 * @param  {int} rowIndex
		 * @return {Object} 返回JSON类型的数据或者数组类型的数据
		 **/
		_generateCompareData : function(colIndex, isArray) {
			var $this = this;
			return function compareData(data1, data2) {
				var sDataType = $this.columns[colIndex].type;
				var vValue1 = isArray ? data1[colIndex] : data1[$this.columns[colIndex].name]
				var vValue2 = isArray ? data2[colIndex] : data2[$this.columns[colIndex].name]
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
		 *   判断函数是否存在
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
			if(this.dataTableDOM.tBodies[0]) {
				tableBody = this.dataTableDOM.tBodies[0];
			} else {
				tableBody = document.createElement("tbody");
				this.dataTableDOM.appendChild(tableBody);
			}
			if(!this._tempGridData || this._tempGridData.length == 0) {
				this._tempGridData = this.gridData;
			}
			//如果数据为空看一下,则看一下数据获取函数是否OK
			if(!this._isQuery) {
				if(!this.gridData || !this.gridData.length) {
					try {
						if(this.getGridDataFunc) {
							this.gridData = this.getGridDataFunc();
						}
					} catch(err) {
						alert("运行从接口函数:getGridDataFunc 获取数据失败!");
						return;
					}
				}
			}
			if(this.isMulti) {
				this.selectAllCheckboxDOM.checked = false;
			}
			//初始化分页控件
			this._initPageWidget();
			//处理数据为空的情况
			if(!this.gridData || this.gridData.length <= 0) {
				var theTr = document.createElement("tr");
				tableBody.appendChild(theTr);
				var td = document.createElement("td");
				var len = this.columns.length;
				if(this.isMulti) {
					len = len + 1;
				}
				td.colspan = len;
				td.style.width = "99%";
				theTr.appendChild(td);
				td.className = 'rui-grid-header-multi';
				if(window.language && window.language == "en") {
					this._defaultNoRecordMsg = "<b>No Record Found</b>"
				} else {
					this._defaultNoRecordMsg = "<b>无记录信息</b>";
				}
				if(this._isNull(this.noRecordMsg)) {
					this.noRecordMsg = this._defaultNoRecordMsg;
				}
				cellValue = this.noRecordMsg;
				td.innerHTML = cellValue;
				td.style.height = (this.height - 1) + "px";
				$(this.element).addClass("rui-grid-main-border");
				return;
			} else {
				if(this.isPage) {
					if(this.element.className.indexOf("rui-grid-main-border") >= 0) {
						$(this.element).removeClass("rui-grid-main-border");
					}
				}
			}
			var beginIndex = 0;
			var endIndex = this.gridData.length;
			if(this.isPage && this.pageWidget) {
				beginIndex = this.getRealIndex(0)
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
					var multiOption = this._createMutilOption(i + 1);
					var td1 = document.createElement("td");
					theTr.appendChild(td1);
					td1.className = 'rui-grid-body-td rui-grid-header-multi';
					// zyb------添加
					var div_0 = document.createElement("div");
					checkbox = this._addCheckBox(index, td1);
					this.rowCheckboxDOM.push(checkbox);
					$(checkbox).bind("click", function(event) {
						event.stopPropagation();
						var isChecked = this.checked;
						var rowIndex = parseInt(this.value)
						var row = $this.dataTableDOM.rows[rowIndex];
						var data = $this.getRowData(rowIndex + 1);
						if(isChecked) {
							//$this._isBlockTrEvent = true;
							if(row.className.indexOf($this.selectedClass) == -1) {
								$(row).addClass($this.selectedClass);
							}
							if($this.isSelectAll()) {
								$this.selectAllCheckboxDOM.checked = true;
							}
							$this._addSelectedData([data]);
						} else {
							//$this._isBlockTrEvent = true;
							if(row.className.indexOf($this.selectedClass) != -1) {
								$(row).removeClass($this.selectedClass);
							}
							$this._removeSelectedData([data]);
							$this.selectAllCheckboxDOM.checked = false;
						}
					});
					td1.align = "center";
				}
				if(isArray) {
					this._dealArrayData(theTr, index, i, checkbox);
				} else {
					this._dealJsonData(theTr, index, i, checkbox);
				}
				if(this.isIntervalColor) {
					if((i + 1) % 2 == 0) {
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
		 * 处理合并内容的相同相邻的数据的行单元
		 **/
		_dealMergeRow : function() {
			if(this.mergeRowIndexs && this.mergeRowIndexs.length && this.mergeRowIndexs.length > 0) {
				for(var i = 0; i < this.mergeRowIndexs.length; i++) {
					this.mergeRow(this.mergeRowIndexs[i]);
				}
			}
		},
		/**
		 处理分页组件
		 **/
		_initPageWidget : function() {
			//数据无须进行分页则说明服务器分页pageWidget不能为空
			var totalCount = 0;
			if(!this.gridData) {
				this.gridData = [];
			}
			if(this.gridData.length) {
				totalCount = this.gridData.length;
			}
			if(this.isPage && this._isNull(this.pageWidget)) {
				var gridDiv = $(this.element);
				var pageWidgetId = this.gridId + "_pageId";
				gridDiv.parent().append("<div id='" + this.gridId + "_pageId'></div>");
				this.pageWidgetOptions.totalCount = totalCount;
				this.pageWidgetOptions.pageId = pageWidgetId;
				this.pageWidget = new Pagination(this.pageWidgetOptions);
				this.pageWidget.setBindWidget(this);
				this._isPageInit = true;
				return;
			} else if(this.isPage && !this._isNull(this.pageWidget)) {
				this.pageWidget.setTotalCount(totalCount);
				if(!this.pageWidget.bindWidget) {
					this.pageWidget.setBindWidget(this);
				}
				this.pageWidget.update();
				return;
			} else {
				this._isPageInit = true;
			}

		},
		/**
		 添加checkbox并且添加checkbox选中事件
		 **/
		_addCheckBox : function(rowIndex, td) {
			var checkObj = document.createElement("input");
			checkObj.type = "checkbox";
			td.appendChild(checkObj);
			checkObj.id = this.gridId + "_row_checkbox" + rowIndex;
			checkObj.name = this.gridId + "_row_checkbox";
			checkObj.value = rowIndex;
			return checkObj;
		},
		/**
		 *创建多选框
		 **/
		_createMutilOption : function(rowIndex) {
			var str = "<input type='checkbox' id='" + this.gridId + "_row_checkbox" + rowIndex + "' name='" + this.gridId + "_row_checkbox' value='" + rowIndex + "'/>";
			return str;
		},
		/**
		 处理数组类型的数据
		 **/
		_dealArrayData : function(theTr, index, realIndex, checkbox) {
			for(var j = 0; j < this.columns.length; j++) {
				var columnName = this.columns[j].name
				var cellValue = this.gridData[realIndex][j];
				if(!cellValue) {
					cellValue = "";
				}
				var td = document.createElement("td");
				td.className = 'rui-grid-body-td';
				// zyb------添加
				//处理formater
				var formater = this.columns[j].formater;
				if(formater && formater != "") {
					this._dealFormater(theTr, this.columns[j].formater, j, index, cellValue, this.gridData[realIndex]);
					continue;
				}
				//设置表格的样式
				theTr.appendChild(td);
				var div = document.createElement("div");
				td.appendChild(div);
				div.className = "rui-grid-td-div";
				div.innerHTML = cellValue;
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
				var td = document.createElement("td");
				td.className = 'rui-grid-body-td';
				// zyb------添加
				//处理formater
				var formater = this.columns[j].formater;
				if(formater && formater != "") {
					this._dealFormater(theTr, this.columns[j].formater, j, index, cellValue, this.gridData[realIndex]);
					continue;
				}
				theTr.appendChild(td);
				var div = document.createElement("div");
				td.appendChild(div);
				div.className = "rui-grid-td-div";
				div.innerHTML = cellValue;
				this._setCellStyle(j, td);
				//this._dealPageSelect(columnName, cellValue, checkbox, j)
			}
		},
		_dealPageSelect : function() {
			if(!this.isUsePageSelect || this.primaryKey == false || !this.isMulti) {
				return;
			}
			var pageData = this.getGridData(true);
			var rows = this.dataTableDOM.rows;
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
			// zyb------添加
			var cellValue11 = "";
			rowIndex = rowIndex + 1;
			if( typeof funName == "function") {
				cellValue11 = funName(rowIndex, cellValue, rowData);
			} else {
				var isFunExsit = this._isPageCallbackExist(funName);
				if(!isFunExsit) {
					alert("列formater函数不存在！请检查！");
					cellValue11 = "undefined";
					trObj.appendChild(td1);
					td1.innerHTML = cellValue;
					return;
				}
				cellValue11 = eval(funName + "(rowIndex,cellValue,rowData)");
			}
			trObj.appendChild(td1);
			var div = document.createElement("div");
			td1.appendChild(div);
			div.className = "rui-grid-td-div";
			if( cellValue11 instanceof $) {
				cellValue11.appendTo($(div));
			} else if($.isArray(cellValue11)) {
				for(var t = 0; t < cellValue11.length; t++) {
					cellValue11[t].appendTo($(div));
				}
			} else {
				div.innerHTML = cellValue11.toString();
			}
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
			if($(tdCell).children()) {
				div = $(tdCell).children()[0];
			}
			if(!this._isNull(this.align)) {
				tdCell.align = this.align;
				if(div) {
					div.align = this.align;
				}
			} else {
				tdCell.align = this.defaultProperties.column_default_align;
			}
			//增加样式class
			if(!this._isNull(className)) {
				//$(tdCell).addClass(className);
				if(div) {
					$(div).addClass(className);
				}
			}
			//增加样式
			var chl = $(tdCell).children();
			if(!this._isNull(styleName)) {
				//$(tdCell).css(styleName);
				if(div) {
					$(div).css(styleName);
				}
			}
			//文字的方向

			//添加宽度默认为
			if(!this._isNull(width)) {
				tdCell.width = width + "px";
			} else {
				tdCell.width = this._defaultColumnWidth + "px";
			}

		},
		/**
		 *处理TR事件
		 **/
		_dealTrEvent : function(tr, checkbox, index) {
			var $this = this;
			$(tr).data("rowIndex", (index + 1) + "");
			if($this.isNeedHover) {
				$(tr).bind("mouseover", function() {
					var rowIndex = parseInt($(tr).data("rowIndex"));
					if(!$this.enabled) {
						return;
					}
					if($this.isIntervalColor) {
						if((rowIndex) % 2 == 0) {
							$(this).removeClass($this.intervalClass);
						}
					}
					$(this).addClass($this.hoverClass);
				});
				$(tr).bind("mouseout", function() {
					var rowIndex = parseInt($(tr).data("rowIndex"));
					if(!$this.enabled) {
						return;
					}
					$(this).removeClass($this.hoverClass);
					if($this.isIntervalColor) {
						if((rowIndex) % 2 == 0) {
							$(this).addClass($this.intervalClass);
						}
					}
				});
			}
			//外理单击事件
			var timeFn = null;
			var isMulti = this.isMulti;
			$(tr).bind("click", function(event) {
				if(!$this.enabled) {
					return;
				}
				var rowIndex = parseInt($(this).data("rowIndex"))
				clearTimeout(timeFn);
				timeFn = setTimeout(function() {
					$this._doClickEvent.call($this, tr, rowIndex, checkbox, "click");
				}, 180);
				event.stopPropagation();
			});
			$(tr).bind("dblclick", function(event) {
				if(!$this.enabled) {
					return;
				}
				clearTimeout(timeFn);
				var rowIndex = parseInt($(this).data("rowIndex"))
				$this._doClickEvent.call($this, tr, rowIndex, checkbox, "dblclick");
				event.stopPropagation();

			});
		},
		/**
		 * 鼠标单击事件处理
		 **/
		_doClickEvent : function(tr, index, checkbox, eventType) {
			var realIndex = this.getRealIndex(index);
			var rowData = this.gridData[realIndex - 1];
			var src = $(tr);
			if(eventType == "dblclick") {
				var rowData = this.gridData[index]
				var src = $(tr);
				if(this.extendEvents["rowDblClick"] && this.extendEvents["rowDblClick"] != "") {
					try {
						this.extendEvents["rowDblClick"](rowData, index);
					} catch(e) {
					}
				}
			} else {
				if(this.extendEvents["rowClick"] && this.extendEvents["rowClick"] != "") {
					try {
						this.extendEvents["rowClick"](rowData, index);
					} catch(e) {
					}
				}
			}
			if(!this.isMulti) {
				src.parent().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
				src.addClass(this.selectedClass);
			} else {
				if(eventType == "dblclick") {
					src.parent().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
					//选移除选的
					var selectedData = this.getSelectedRows();
					this._removeSelectedData(selectedData);
					this.selectAll(false);
					checkbox.checked = true;
					//添加选中的
					this._addSelectedData([rowData]);
					src.addClass(this.selectedClass);
					if(this.isMulti) {
						this.selectAllCheckboxDOM.checked = false;
					}
				} else {
					if(this._isBlockTrEvent) {
						src.trigger('dblclick');
						this._isBlockTrEvent = false;
						return;
					}
					if(tr.className.indexOf(this.selectedClass) != -1) {
						this._removeSelectedData([rowData]);
					} else {
						this._addSelectedData([rowData]);
						src.addClass(this.selectedClass);
						checkbox.checked = true;
						if(this.isSelectAll()) {
							this.selectAllCheckboxDOM.checked = true;
						}
					}
				}
			}

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
			var newArray = []
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
		 *  获取行的数据
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
		 *  重新设置某行的表格数据
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
		 *  重新设置某行的表格数据
		 * @param  {int} rowIndex 1-到pageNum
		 * @return {int} 返回经过分页计算过的索引
		 **/
		getRealIndex : function(rowIndex) {
			 rowIndex=parseInt(rowIndex);
			if(this.isPage && this.pageWidget) {
				if(rowIndex > this.gridData.length) {
					return -1;
				}
				rowIndex = (this.pageWidget.getCurPage() - 1) * (this.pageWidget.getPageSize()) + rowIndex;
			}
			return rowIndex;
		},
		/**
		 *  获取选中表格中的数据
		 * @return {Object} 表格数据数据类型的数据或者存有json对象的数组,如果是表格类型的
		 * @return {isSelectPage}  返回,是否跨页选中的内容
		 **/
		getSelectedRows : function(isSelectPage) {
			if(isSelectPage) {
				return this.selectedData;
			}
			var selectedData = [];
			var rows = this.dataTableDOM.rows;
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
		 *  获取选中表格中的数据
		 * @param  {int} cols 封装的是表头的数据
		 **/
		setColumns : function(cols) {
			this.columns = cols;
		},
		/**
		 *     获取列的信息
		 * @param  {int} cols 封装的是表头的数据
		 **/
		getColumns : function() {
			return this.columns;
		},
		/**
		 *   获取表格所需要的数据
		 * @param  {int} data 封装的是表头的数据
		 **/
		setGridData : function(data) {
			this.gridData = data;
			this._tempGridData = this.gridData;
			if(this.pageWidget) {
				this.pageWidget.setCurPage(1);
			}
			if(this._queryConditon) {
				this._queryConditon = null;
			}

		},
		/**
		 *     获取表格或者表格某一个页的数据
		 * @param  {isPage} 是否是获取全当页的数据,还是全部的数据
		 **/
		getGridData : function(isPage) {
			if(!isPage || !this.isPage) {
				return this.gridData;
			}
			if(!this.gridData) {
				return [];
			}

			var beginIndex = 0;
			var endIndex = this.gridData.length;
			if(this.isPage && this.pageWidget) {
				beginIndex = this.getRealIndex(0)
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
		 *   删除指的行中的表格数,并提供外接函数接口来实现,业务相关的处理
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
				this._tempGridData = this.gridData;
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
		 *   删除选中的行的业 务
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
				this._tempGridData = this.gridData;
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
		 *  添加一个行的功能,并提供外接函数接口来实现,业务相关的处理
		 * @param  {Object} rowData 保存行信息的一个数组,或者JSON类型的数据
		 * @param  {Function} func 外接函数实现业务处理
		 * @return {null}
		 **/
		addRow : function(rowData, pos, func) {
			if(!this.enabled) {
				return;
			}
			if(rowData == null) {
				alert("data is null");
				return;
			}
			var isOk = true;
			//是否是异步调用
			if(func) {
				isOk = func(rowData);
			}
			if(!isOk) {
				//alert("add fail!");
				return;
			}
			if(this.getGridDataFunc) {
				this.gridData = this.getGridDataFunc();
				this._tempGridData = this.gridData;
				if(!this._queryConditon) {
					this.queryGrid(this._queryConditon);
				} else {
					this.update();
				}
				return;
			}
			//非指定位置插入
			if(!pos || pos <= 0) {
				if(this.insertWay == "begin") {
					pos = 1;
				} else {
					pos = this.gridData.length;
				}
			}
			//在指定位置插入
			if(pos > this.gridData.length) {
				alert("paramter pos must less lan" + this.gridData.length);
				return;
			}
			var begin = pos;
			var pageIndex = pos;
			if(this.insertWay == "begin") {
				begin = pos - 1;
			} else {
				begin = pos;
			}
			this.gridData.push("");
			var len = this.gridData.length;
			for(var i = len - 1; i > begin; i--) {
				this.gridData[i] = this.gridData[i - 1];
			}
			this.gridData[begin] = rowData;
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
		 *  通过设置跟列信息相关数据对表格进行过虑查询
		 * @param  {Object} rowData 保存行信息的一个数组,或者JSON类型的数据
		 * @param  {Function} func 外接函数实现业务处理
		 * @example var condition={id:"1",name="chu",} grid.queryGrid(condition);
		 * @return {null}
		 **/
		queryGrid : function(condition) {
			if(!this.enabled) {
				return;
			}
			var resultData = []//是个数据
			this._queryRowIndex = [];
			this._queryConditon = condition;
			if(!this._tempGridData) {
				this._tempGridData = [];
			}
			for(var i = 0; i < this._tempGridData.length; i++) {
				var isPass = true;
				for(var m in condition) {
					var con = condition[m];
					if(con && con.toString() != "" && this._tempGridData[i][m].indexOf(con) == -1) {
						isPass = false;
						break;
					}
				}
				if(isPass) {
					resultData.push(this._tempGridData[i]);
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
		 *  提供批量删除表格控件,并提供外接函数接口来实现,业务相关的处理
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
				this._tempGridData = this.gridData;
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
		 *  提供批量添加表格数据的控件,并提供外接函数接口来实现,业务相关的处理
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
				this._tempGridData = this.gridData;
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
		 *  提供批量删除表格控件,并提供外接函数接口来实现,业务相关的处理
		 * @param  {Boolean} trueOrfalse   让可以多选的表格,进行多选,或取消多选
		 * @return {null}
		 **/
		selectAll : function(trueOrfalse) {
			if(!this.enabled) {
				return;
			}
			if(!this.isMulti) {
				if(!trueOrfalse) {
					$(this.dataTableDOM).children().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
				}
				return;
			}
			$(this.selectAllCheckboxDOM).attr("checked", trueOrfalse);
			var checkBoxs = this.rowCheckboxDOM;
			if(!checkBoxs || checkBoxs.length == 0) {
				return;
			}
			var rows = this.dataTableDOM.rows;
			for(var i = 0; i < checkBoxs.length; i++) {
				//alert();
				var isDisabled = $(rows[i]).attr("disabled");
				if(isDisabled || isDisabled == "undefined") {
					checkBoxs[i].checked = false;
					continue;
				}
				checkBoxs[i].checked = trueOrfalse;
				var src = this.dataTableDOM.rows[i];
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
		 *  让某一个选中或非选中
		 * @param  {int} rowIndex   行的索引位置从1开始
		 * @param  {Boolean} trueOrfalse   让表格的某一行选 中,或取消选中
		 * @return {null}
		 **/
		setSelectedRow : function(rowIndex, trueOrfalse) {
			if(!this.enabled) {
				return;
			}
			var rows = this.dataTableDOM.rows;
			rowIndex = parseInt(rowIndex) - 1;
			if(rowIndex < 0) {
				return;
			}
			var src = this.dataTableDOM.rows[rowIndex];
			if(!src) {
				return;
			}
			//处理单选
			if(!this.isMulti) {
				$(this.dataTableDOM).children().children().filter("." + this.selectedClass).removeClass(this.selectedClass);
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
		 *  判断是否全选
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
		 *  让某一行可运行或者不可运行.
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
			var rows = this.dataTableDOM.rows;
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
				$(row).unbind("dblclick");
				$(row).attr("disabled", true);
			}
			return false;
		},
		/**
		 *  某一行是否选中
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
			var rows = this.dataTableDOM.rows;
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
		 *  设置表头的名称
		 * @param  {int} rowIndex  表头的索引从01开始
		 * @param  {String} headName 表头重的名称
		 * @return {null} 无返回
		 **/
		setHeadName : function(index, headName) {
			var row = this.headTableDOM.rows[0];
			$(row.cells[index]).html(headName);
		},
		/**
		 *  判断是否有选中的行
		 * @return {Boolean} true or false
		 **/
		hasSelectedRow : function() {
			var selectedData = [];
			var rows = this.dataTableDOM.rows;
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
		 *  表格中的行数
		 * @return {int}
		 **/
		getRowSize : function() {
			var rows = this.dataTableDOM.rows;
			return rows.length;
		},
		/**
		 *  设置表格的扩展事件
		 * @param  {String} enventKey  事件对应的键值目前主要有两键值rowClick , rowDblClick
		 * @param  {Function} func   rowClick或者rowDblClick 对应的外接函数
		 * @return {null}  true or false
		 **/
		pushExtendEvents : function(enventKey, func) {
			this.extendEvents[enventKey] = func;
			return;
		},
		/**
		 *  从扩展事件的集合中获取扩展事件的键来获取事件函数
		 * @param  {String} key  事件对应的键值目前主要有两键值rowClick , rowDblClick
		 * @return {Function}  返回事件函数
		 **/
		getExtendEvent : function(key) {
			var value = this.extendEvents[key];
			return value;
		},
		/**
		 *  设置extendEvents属性的值
		 * @param  {Object} extendEvents  如 {rowClick:func1, rowDblClick:func2};
		 * @return {Function}  返回事件函数
		 **/
		setExtendEvents : function(extendEvents) {
			this.extendEvents = extendEvents;
		},
		/**
		 *   简单合并内容相同的表格数据      列的索引      colIndex从1开始
		 * @param  {Object} extendEvents  如 {rowClick:func1, rowDblClick:func2};
		 * @return {Function}  返回事件函数
		 **/
		setExtendEvents : function(extendEvents) {
			this.extendEvents = extendEvents;
		},
		/**
		 *   简单合并内容相同的表格数据      列的索引      colIndex从1开始
		 * @param  {int} index  要对哪一列进行合并
		 * @return {null}  无返回值
		 **/
		mergeRow : function(index) {
			var colIndex = parseInt(index);
			if(colIndex <= 0) {
				alert("parameter 'index' must >0 is error");
				return;
			}
			if(colIndex > this.columns.length) {
				alert("parameter 'index' must <" + (this.columns.length + 1) + " is error");
				return;
			}
			var tableId = "#" + this.gridId + "_tableContent";
			table = $(tableId + " tr td:nth-child(" + colIndex + ")");
			var firsttd = "";
			var currenttd = "";
			var spanNum = 0;
			table.each(function(i) {
				if(i == 0) {
					firsttd = $(this);
					spanNum = 1;
				} else {
					currenttd = $(this);
					if(firsttd.html() == currenttd.html()) {
						spanNum++;
						currenttd.hide();
						//remove();
						firsttd.attr("rowSpan", spanNum);
					} else {
						firsttd = $(this);
						spanNum = 1;
					}

				}
			});
		},
		/**
		 * 重绘表头
		 */
		resetGridHead : function(cols) {
	        this.columns=cols;
	        $(this.headTableDOM).empty();
			$(this.headTableDOM).html("");
			this._createHead();
		},
		/**
		 *   销回表格控件的对象
		 * @return {null}  无返回值
		 **/
		destroy : function() {
			if(this.element) {
				$(this.element).empty();
				$(this.element).html("");
			}
		},
		/**
		 *   显示表格控件
		 * @return {null}  无返回值
		 **/
		show : function() {
			$(this.element).show();
			if(this.pageWidget) {
				this.pageWidget.show();
			}
		},
		/**
		 *   隐藏表格控件
		 * @return {null}  无返回值
		 **/
		hide : function() {
			$(this.element).hide();
			if(this.pageWidget) {
				this.pageWidget.hide();
			}

		},
		/**
		 *     让表格控件可以活动
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
		 *   让表格控件不可以活动
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
		 * 阻塞TR事件
		 */
		blockTrEvent : function() {
			this._isBlockTrEvent = true;
		},
		/**
		 *   判断是否是空值
		 **/
		_isNull : function(strValue) {
			if(!strValue || strValue == "") {
				return true;
			} else {
				return false;
			}
		},
		/**
		 *   判断是否数组
		 **/
		_isArray : function(obj) {
			return Object.prototype.toString.apply(obj) === '[object Array]';
		},
		/**
		 *   判断函数是否存在
		 **/
		_isPageCallbackExist : function(funName) {
			try {
				if( typeof                                    eval(funName) == "undefined") {
					return false;
				}
				if( typeof                                   eval(funName) == "function") {
					return true;
				}
			} catch(e) {
				return false;
			}
		}
	};

	return Grid
});
