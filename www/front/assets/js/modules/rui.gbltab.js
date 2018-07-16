;(function() {
	if(!window.rui)
		window.rui = {};
})();
/**
 * @author lulinfeng QQ:811191000 2015-11-30
 * @constructor Tab
 * @description 全局配置页自动生成控件
 **/

/* tabs */
rui.GblTab = function(option) {
	this.element = null;
	this.cls = 'tabbable tabbable-custom tabbable-full-width';
	this.data = null;
	this.init(option);
};
rui.GblTab.prototype = {
	init: function (option) {
		if (option) {
			$.extend(this, option);
		}
		this.element = document.createElement('div');
		this.element.className = this.cls;
		this.nav = document.createElement('ul');
		this.nav.className = 'nav nav-tabs';
		this.element.appendChild(this.nav);
		this.body = document.createElement('div');
		this.body.className = 'tab-content';
		this.element.appendChild(this.body);
	},
	update: function (struct) {
		var i;
		for (i=0; i<struct.length; i++) {
			this.addNav(struct[i], i==0);
			var tabPannel = document.createElement('div');
			tabPannel.id = struct[i].name + '_id';
			tabPannel.className = 'tab-pane';
			if (i==0) {
				tabPannel.classList.add('active');
			}
			this.addTab(struct[i].child, tabPannel);
			this.body.appendChild(tabPannel);
		}
	},
	addNav: function(item, isFirst) {
		var cls = isFirst ? 'class="active"' : '';
		var nav = '<li ' + cls + '><a href="#'+item.name+'_id" data-toggle="tab">' +
					item.cname + '</a></li>';
		$(this.nav).append(nav);
	},
	/*根据switch这个类型才去结构里取包含的子项*/
	addTab: function (struct, parent) {
		var i, k, j, item, sw_data, is_checked;
		// 生成tab
		for (i=0; i<struct.length; i++) {
			item = struct[i];
			is_checked = false;
			if (item.type == 'check_input') {
				is_checked = eval('this.$scope.' + item.value);
			}
			var item_dom = this.tabFormat[item.type].call(this, item, !!is_checked);
			$(parent).append(item_dom);
			/* 开关控件有child的话(switch和checkbox), 任何有子项的都这么做,只是定义子项根有所取舍 */
			if (item.child && item.child.length>0) {
				var children;
				if (item.type == 'switch') {
					children = document.createElement('div');
					children.id = item.value.replace(/\./g, '_');
					/* 根据开关的后台数据， 隐藏和显示子项 */
					sw_data = eval('this.$scope.' + item.value);
					children.style.display = sw_data == item.option[0] ? 'block' : 'none';
				} else if (item.type == 'interface_panel') {
					children = item_dom;
				}
				/* 递归 */
				this.addTab(item.child, children);
				parent.appendChild(children);
			}
		}
	},
	tabFormat: {
		input: function (data) {
			var html = '<div class="mag15"><div class="col-md-3 float_right">'+data.cname+
					'</div></div>';
			var div = document.createElement('div');
			div.className = 'col-md-9';
			var input = document.createElement('input');
			input.setAttribute('ng-model', data.value);
			input.setAttribute('type', 'text');
			if (data.placeholder) {
				input.setAttribute('placeholder', data.placeholder);
			}
			var i;
			for (i in data.attrs) {
				input.setAttribute(i, data.attrs[i]);
			}
			div.appendChild(input);
			if (data.help_text) {
				div.appendChild($('<span class="help-text">'+data.help_text+'</span>')[0]);
			}
			var err_tip = document.createElement('span');
			err_tip.className = 'err-tip';
			div.appendChild(err_tip);
			if (data.varify_re) {
				var $scope = this.$scope;
				$(input).on('blur', function () {
					var result = false;
					if (typeof(data.varify_re) == 'string') {
						result = eval(data.varify_re)(input.value, $scope);
					} else if (typeof(data.varify_re) == 'function'){
						result = data.varify_re(input.value, $scope);
					} else {
						result = data.varify_re.test(input.value);
					}
					if (!result) {
						$(input).addClass('err');
						err_tip.textContent = data.err_tip;
					} else {
						$(input).removeClass('err');
						err_tip.textContent = '';
					}
				});
			}
			return $(html).append(div);
		},
		array_input: function (data) {
			var html = '<div class="mag15">'+
				'<div class="col-md-3 float_right">'+data.cname+'</div></div>';
			/*input bar*/
			var element = document.createElement('div');
			element.className = 'col-md-9';
			var input = document.createElement('input');
			input.placeholder = data.placeholder || '';
			var add_button = document.createElement('i');
			add_button.textContent = '添加';
			add_button.className = 'smb-btn';
			var err_tip = document.createElement('span');
			err_tip.className = 'err-tip';
			element.appendChild(input);
			element.appendChild(add_button);
			element.appendChild(err_tip);

			var ul = document.createElement('ul');
			ul.className = 'array-input';
			var data_list = eval('this.$scope.' + data.value);
			var i, li;
			for (i=0; i<data_list.length; i++) {
				li = '<li>'+data_list[i]+'<i class="smb-btn smb-btn-del del">删除</i></li>';
				$(ul).append(li);
			}
			element.appendChild(ul);
			/*event*/
			var self = this;
			$(add_button).on('click', function () {
				var content = input.value;
				var result = false;
				if (!!data.varify_re) {
					if (typeof(data.varify_re) == 'string') {
						result = eval(data.varify_re)(input.value);
					} else if (typeof(data.varify_re) == 'function'){
						result = data.varify_re(input.value);
					} else {
						result = data.varify_re.test(input.value);
					}
					if (!result) {
						$(input).addClass('err');
						err_tip.textContent = data.err_tip;
						return false;
					} else {
						$(input).removeClass('err');
						err_tip.textContent = '';
					}
				}
				input.value = "";
				// data.value 必须是数组
				var ul_data = eval('self.$scope.' + data.value);
				ul_data.push(content);
				li = '<li>'+content+'<i class="smb-btn smb-btn-del del">删除</i></li>';
				$(ul).append(li);
			});
			$(ul).on('click', 'i', function () {
				var index = $(this).parent().index();
				var ul_data = eval('self.$scope.' + data.value);
				ul_data.splice(index, 1);
				$(this).parent().remove();
				return false;
			});
			return $(html).append(element);
		},
		grid: function (data) {
			var grid = new rui.Grid(data.option);
			// grid.update(eval('this.$scope.' + data.value));
			if (data.grid_init) {
				data.grid_init(grid, this.$scope);
			}
			/*事件*/
			if (data.event) {
				data.event(grid, this.$scope);
			}
			var ft_btn = document.createElement('button');
			ft_btn.className = 'smb-btn';
			ft_btn.textContent = '保存配置';
			$(ft_btn).on('click', grid.onsave);
			// 注意只有RG-BCR810W可用, 若其他型号也有这个ipsec的命名的表格,可能会出错
			if (data.name == 'ipsec') {
				var footer='<div class="header"></div>';
				//var footer = '<div class="header"><button class="smb-btn">导入网段分配信息</button><button class="smb-btn">导出网段分配信息</button></div>';
				var header = '<div class="header"><h4>提示:<p style="color: red">如果有多个服务器的情况，将自动按照运营商线路优先，负载均衡为辅的策略进行分配，也可以手动选择。</p></h4></div>';
				return $([$(header)[0],grid.element, $(footer).append(ft_btn)[0]]);
			} else {
				var hd_btn = document.createElement('button');
				hd_btn.className = 'smb-btn';
				hd_btn.textContent = '添加设备';
				var self = this;
				$(hd_btn).on('click', function () {
					rcms.mask();
					grid.onadd(self.$scope);
				});
				var header = '<div class="header"></div>';
				var footer = '<div class="header"></div>';
				return $([$(header).append(hd_btn)[0], grid.element]);
			}
		},
		xiafa: function (data) {
			var button = document.createElement('button');
			button.className = 'smb-btn';
			button.textContent = '下发';
			$(button).on('click', function () {
				rcms.ajax({
					url: '/apis/devconf/globaltask/',
					type: 'post',
					data: JSON.stringify({op: 'global', model: data.model})
				}).done(function (data) {
					rcms.message('全局配置下发成功');
				});
			});
			return button;
		}
	}
};
