;(function() {
	if(!window.rui)
		window.rui = {};
})();
/**
 * @author lulinfeng QQ:811191000 2015-11-30
 * @constructor Switch开关, Tab
 * @description 标签页自动生成控件
 **/

rui.Switch = function (value, option) {
	// {value: 'enable', option: ['enable', 'disable']}
	// 为了兼容angular, 增加$scope 参数
	this.element = null;
	// value 真实值 可能是 true/false 也可能是 enable/disable, 1/0等
	this.value = value;
	this.option = option;
	// 开关逻辑状态
	this.state = value == option[0];
	this.css = 'rcms-sw';
	this.label_text = ['开', '关'];
	this.init();
};
rui.Switch.prototype = {
	init: function () {
		this.element = document.createElement('div');
		this.element.className = this.css;
		this.container = document.createElement('div');
		this.container.className = 'rcms-sw-container';
		this.on = document.createElement('span');
		this.on.className = 'rcms-sw-on';
		this.on.textContent = this.label_text[0];
		this.label = document.createElement('span');
		this.label.className = 'rcms-sw-label';
		this.off = document.createElement('span');
		this.off.className = 'rcms-sw-off';
		this.off.textContent = this.label_text[1];
		$(this.container).append(this.on, this.label, this.off);
		$(this.element).append(this.container);
		var self = this;
		$(this.element).on('click', function () {
			if (self.state == true) {
				self.state = false;
				$(self.element).trigger('close');
				self.container.style.marginLeft = '-38px';
			} else {
				self.state = true;
				$(self.element).trigger('open');
				self.container.style.marginLeft = '0px';
			}
		});
		this.update();
	},
	update: function () {
		if (this.state == true) {
			this.container.style.marginLeft = '0px';
			$(this.element).trigger('open');
		} else {
			this.container.style.marginLeft = '-38px';
			$(this.element).trigger('close');
		}
	}
};

/*EG350 接口类*/
var Interface = function (data, $scope) {
	this.element = null;
	this.css = '';
	this.$scope = $scope;
	// 接口实际配置项, 为数组包含的接口json对象: [{iterface_name: 'Gi0/6', ...}, {iterface_name: 'Gi0/7'}]
	this.value = eval('$scope.' + data.value);
	// 接口的模型数据
	this.data = data;
	// 将数组的接口值,用接口名称转换成json值,以方便赋值
	this._data = {};
	// 将子项用接口名称保存起来, 方便dom操作
	this._dom = {};
	this._init();
	// this.data:
	// {cname: '外网口', type: 'interface_panel', value: 'object.wan', help_text: '',
	// 	option: [
	// 		{type: 'select'},
	// 		[{attrs: {name: 'pppoename', placeholder: '帐号'}, type: 'input'}, {attrs: {name: 'pppoepwd', placeholder: '密码'}, type: 'input'}],
	// 		[{attrs: {name: 'ipaddr', placeholder: 'IP地址'}, type: 'input'}, {attrs: {name: 'netmask', placeholder: '子网掩码'}, type: 'input'}, {attrs: {name: 'gateway', placeholder: '下一跳地址'}, type: 'input'}],
	// 		{attrs: {name: 'upband', placeholder: '上行带宽(默认10)'}, type: 'input'},
	// 		{attrs: {name: 'downband', placeholder: '下行带宽(默认10)'}, type: 'input'},
	// 		// 开启线路NAT（如果设备在内网做纯路由可关闭）
	// 		{attrs: {name: 'open_nat', placeholder: ''}, type: 'input'},
	// 		// 地址池是指分配给内网用户的公用IP地址配置的范围，起始/结束IP地址为空则直接使用接口IP
	// 		// {name: 'net_pool', type: 'grid'}
	// 	]
	// }
};
Interface.prototype = {
	_init: function () {
		this.element = document.createElement('div');
		var tip = document.createElement('div');
		tip.className = 'interface-tip';
		$(tip).text(this.data.help_text);
		var headbar = document.createElement('div');
		headbar.className = 'interface-headbar';
		this.checkbar = document.createElement('div');
		this.checkbar.className = 'interface-bar';
		$(headbar).append('<span>'+this.data.cname+':</span>', this.checkbar);
		this.interface_body = document.createElement('div');
		$(this.element).append(tip, headbar, this.interface_body);
	},
	_render: function () {
		/*根据实际配置项(不定项),生成接口配置dom*/
		var i;
		var option = this.data.option;
		for (i=0; i<this.value.length; i++) {
			var name = this.value[i].interface_name;
			this._data[name] = this.value[i];
			this._createbar(name);
			this._createBody(option, name);
			// 调用数据模型中的初始化
			this._extraEvent(this.value[i]);
		}
	},
	update: function (data) {
		if (data) {
			this.value = eval('this.$scope.' + data.value);
			this.data = data;
		}
		$(this.checkbar).empty();
		$(this.interface_body).empty();
		this._render();
	},
	_createbar: function (name) {
		var label = document.createElement('label');
		label.className = 'interface-bar-item';
		var input = document.createElement('input');
		input.type = 'checkbox';
		$(label).append(input, name);
		var self = this;
		$(input).on('click', function () {
			var child = self._dom[name];
			if (this.checked) {
				$(child).show();
				self._data[name].checked = true;
			} else {
				$(child).hide();
				self._data[name].checked = false;
			}
		});
		this.checkbar.appendChild(label);
		// 初始化,粗略判断,只要数据个数大于1就好,即1个的时候就是只有接口名称
		input.checked = Object.keys(this._data[name]).length > 1;
		this._data[name].checked = input.checked;
	},
	_createBody: function (option, name) {
		var el = document.createElement('div');
		el.style.display = this._data[name].checked ? 'static' : 'none';
		var label = '<div class="interface-label">#'+ name + '</div>';
		$(el).append(label);
		this._dom[name] = el;
		var i;
		for (i=0; i<option.length; i++) {
			/*生成子项*/
			var row = document.createElement('div');
			row.className = 'interface-row';
			var item = option[i];
			if (Object.prototype.toString.apply(item) == '[object Array]') {
				var j;
				for (j=0; j<item.length; j++) {
					// create more than element
					var child_item = item[j];
					this[child_item.type](child_item, row, name);
				}
			} else {
				// 生成对应type的dom, 添加到行dom
				this[item.type](item, row, name);
			}
			el.appendChild(row);
		}
		this.interface_body.appendChild(el);
	},
	_extraEvent: function (value) {
		var panel = this._dom[value.interface_name];
		if (this.data.extra_init) {
			this.data.extra_init(panel, value);
		}
	},
	/*具体类型的子项*/
	iterface_mode: function (item, row, itf_name) {
		var select = document.createElement('select');
		$(select).append('<option value="pppoe">PPPoE (ADSL)</option><option value="dynamic">动态IP (DHCP)</option><option value="static">静态IP</option>');
		select.value = this._data[itf_name][item.name] || 'pppoe';
		this._data[itf_name][item.name] = select.value;
		var self = this;
		$(select).on('change', function () {
			var mode = this.value;
			self._data[itf_name][item.name] = mode;
			var panel = self._dom[itf_name];
			if (mode == 'pppoe') {
				$(panel).find('input[name=pppoename]').parent().show();
				$(panel).find('input[name=ipaddr]').parent().hide();
			} else if (mode == 'static') {
				$(panel).find('input[name=pppoename]').parent().hide();
				$(panel).find('input[name=ipaddr]').parent().show();
			} else {
				$(panel).find('input[name=pppoename]').parent().hide();
				$(panel).find('input[name=ipaddr]').parent().hide();
			}
		});
		row.appendChild(select);
	},
	interface_input: function (item, row, itf_name) {
		var input = document.createElement('input');
		input.name = item.name;
		input.value = this._data[itf_name][item.name] || '';
		this._data[itf_name][item.name] = input.value;
		for (i in item.attrs) {
			input.setAttribute(i, item.attrs[i]);
		}
		var self = this;
		$(input).on('change', function () {
			self._data[itf_name][item.name] = this.value;
		});
		if (item.help_text) {
			$(row).append(input, $('<span class="help-text">'+item.help_text+'</span>'));
			return;
		}
		if (item.label_text) {
			var label = document.createElement('label');
			$(label).append(input, '<span class="label-text">'+item.label_text+'</span>');
			row.appendChild(label);
			return;
		}
		row.appendChild(input);
	},
	interface_nat: function (item, row, itf_name) {
		var value = this._data[itf_name].open_nat || item.option[1];
		var sw = new rui.Switch(value, item.option);
		// 创建子项
		var nat_pool = document.createElement('div');
		nat_pool.style.display = sw.state ? 'block' : 'none';
		var new_nat_btn = document.createElement('div');
		new_nat_btn.className = 'smb-btn';
		new_nat_btn.textContent = '新增NAT';
		var gridOption = {
			gridData: this._data[itf_name].nat_pool || [],
			isPage: true,
			isMulti: false,
			isNeedInit: false,
			isIntervalColor: true,
			columns: [
				{name: 'start_ip', caption: '起始IP地址'},
				{name: 'end_ip', caption: '结束IP地址'},
				{name: '', caption: '操作', width: 120, formater: function (rowIndex, value, rowData) {
						return '<span class="smb-btn edit">编辑</span><span class="smb-btn delete">删除</span>';
					}
				}
			]
		};
		var grid = new rui.Grid(gridOption);
		$(nat_pool).append(new_nat_btn, grid.element);
		this._data[itf_name].nat_pool = grid.gridData;
		var html = '<div class="mag15"><div class="col-md-3 float_right">' + item.cname + '</div></div>';
		$(row).append($(html).append(sw.element, '<span>'+item.help_text+'</span>'), nat_pool);
		var self = this;
		$(sw.element).on('open', function () {
			$(nat_pool).show();
			self._data[itf_name].open_nat = item.option[0];
		});
		$(sw.element).on('close', function () {
			$(nat_pool).hide();
			self._data[itf_name].open_nat = item.option[1];
		});
		/*新增NAT事件*/
		$(new_nat_btn).on('click', function () {
			var add_nat_panel = $('<div class="add-rule" style="display:block"></div>');
			var add_form = document.createElement('form');
			$(add_form).html('<label><span class="rule-label">起始IP地址</span><input type="text" name="start_ip"></label><label><span class="rule-label">结束IP地址</span><input type="text" name="end_ip"></label>');
			var confirm_btn = $('<button class="oper-btn">确定</button>');
			var cancel_btn = $('<button class="oper-btn">取消</button>');
			$(add_nat_panel).append('<p class="rule-header">添加NAT</p>', add_form, $('<div class="add-rule-footer"></div>').append(confirm_btn, cancel_btn));
			$(add_nat_panel).appendTo('body');
			rcms.mask();
			$(confirm_btn).on('click', function () {
				grid.addRow($(add_form).serializeObject());
				rcms.mask('clear');
				$(add_nat_panel).remove();
			});
			$(cancel_btn).on('click', function () {
				rcms.mask('clear');
				$(add_nat_panel).remove();
			});
		});
	},
	interface_dhcp: function (item, row, itf_name) {
		var gridOption = {
			gridData: this._data[itf_name].dhcp_pool || [],
			isPage: true,
			isMulti: false,
			isNeedInit: false,
			isIntervalColor: true,
			columns: [
				{caption: '客户端地址子网', name: 'ipseg'},
				{caption: '掩码', name: 'ipmask'},
				{caption: '网关', name: 'gateway'},
				{caption: 'DNS服务器', name: 'dns'},
				{caption: '地址租期', name: 'internal_ip'},
				{caption: '操作', width: 120, formater: function (rowIndex, value, rowData) {
					return '<span class="smb-btn edit">编辑</span><span class="smb-btn delete">删除</span>';
					}
				}
			]
		};
		var value = this._data[itf_name].open_dhcp || false;
		var sw = new rui.Switch(value, item.option);
		// 创建子项
		var dhcp_list = document.createElement('div');
		dhcp_list.style.display = sw.state ? 'block' : 'none';
		var new_dhcp_btn = document.createElement('div');
		new_dhcp_btn.className = 'smb-btn';
		new_dhcp_btn.textContent = '新增DHCP';

		var grid = new rui.Grid(gridOption);
		$(dhcp_list).append(new_dhcp_btn, grid.element);
		this._data[itf_name].dhcp_pool = grid.gridData;
		var html = '<div class="mag15"><div class="col-md-3 float_right">' + item.cname + '</div></div>';
		$(row).append($(html).append(sw.element), dhcp_list);
		var self = this;
		$(sw.element).on('open', function () {
			$(dhcp_list).show();
			self._data[itf_name].open_dhcp = item.option[0];
		});
		$(sw.element).on('close', function () {
			$(dhcp_list).hide();
			self._data[itf_name].open_dhcp = item.option[0];
		});
		/*新增dhcp事件*/
		$(new_dhcp_btn).on('click', function () {
			var add_nat_panel = $('<div class="add-rule" style="display:block"></div>');
			var add_form = document.createElement('form');
			$(add_form).html('<label><span class="rule-label">客户端地址子网</span><input type="text" name="ipseg"></label><label><span class="rule-label">掩码</span><input type="text" name="ipmask"></label><label><span class="rule-label">网关</span><input type="text" name="gateway"></label><label><span class="rule-label">DNS服务器</span><input type="text" name="dns"></label><label><span class="rule-label">地址租期</span><input type="text" name="internal_ip"></label>');
			var confirm_btn = $('<button class="oper-btn">确定</button>');
			var cancel_btn = $('<button class="oper-btn">取消</button>');
			$(add_nat_panel).append('<p class="rule-header">添加DHCP</p>', add_form, $('<div class="add-rule-footer"></div>').append(confirm_btn, cancel_btn));
			$(add_nat_panel).appendTo('body');
			rcms.mask();
			$(confirm_btn).on('click', function () {
				grid.addRow($(add_form).serializeObject());
				rcms.mask('clear');
				$(add_nat_panel).remove();
			});
			$(cancel_btn).on('click', function () {
				rcms.mask('clear');
				$(add_nat_panel).remove();
			});
		});
	},
	interface_templet: function (item, row, itf_name) {
		/*一个流控方案的下拉选择框, 外加介绍文字*/
		var select = document.createElement('select');
		for (i in item.option) {
			select.appendChild(new Option(item.option[i], i));
		}
		row.appendChild(select);
		if (this._data[itf_name].templet) {
			select.value = this._data[itf_name].templet;
		}
		this._data[itf_name].templet = select.value;
		var self = this;
		$(select).on('change', function () {
			self._data[itf_name].templet = this.value;
		});
	}
};

/* tabs */
rui.Tab = function(option) {
	this.element = null;
	this.cls = 'tabbable tabbable-custom tabbable-full-width';
	this.data = null;
	this.init(option);
};
rui.Tab.prototype = {
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
		this.body.className = 'tab-content template_Tab_Content';
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
			if (item.type == 'check_input'||item.type == 'check_input_left') {
				is_checked = eval('this.$scope.' + item.value);
			}
			var item_dom = this.tabFormat[item.type].call(this, item, !!is_checked);
			$(parent).append(item_dom);
			/* 开关控件有child的话(switch和checkbox), 任何有子项的都这么做,只是定义子项根有所取舍 */
			if (item.child && item.child.length>0) {
				var children;
				if (item.type == 'switch') {
					children = document.createElement('div');
					children.id = (item.value+'_'+item.name).replace(/\./g, '_');
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
		'switch': function (data) {
			var v;
			try {
				v = eval('this.$scope.' + data.value);
			} catch (e) {
				v = undefined;
			}
			var sw = new rui.Switch(v, data.option);
			sw.element.id = (data.value+'_'+data.name+'_btn').replace(/\./g, '_');
			/*事件放到这里, Swithch控件不关心angular*/
			var self = this;
			$(sw.element).on('open', function () {
				if (!!data.value) {
					eval('self.$scope.' + data.value + '="'+data.option[0]+'"');
				}
				if (!!data.child) {
					$('#' + (data.value+'_'+data.name).replace(/\./g, '_')).show();
				}
			});
			$(sw.element).on('close', function () {
				if (!!data.value) {
					eval('self.$scope.' + data.value + '="'+data.option[1]+'"');
				}
				if (!!data.child) {
					$('#' + (data.value+'_'+data.name).replace(/\./g, '_')).hide();
				}
			});
			var html = '<div class="mag15"><div class="col-md-3 float_right">' + data.cname + '</div></div>';
			var wrap_sw = document.createElement('div');
			wrap_sw.className = 'col-md-9';
			wrap_sw.appendChild(sw.element);
			if (data.help_text) {
				wrap_sw.appendChild($('<span class="help-text" style="color: burlywood">'+data.help_text+'</span>')[0]);
			}
			return $(html).append(wrap_sw);
		},
		// multiple or normal
		select: function (data) {
			var sel_wrap = document.createElement('dev');
			sel_wrap.className = 'col-md-9';
			var select = document.createElement('select');
			select.setAttribute('ng-model', data.value);
			var i;
			for (i in data.option) {
				if (data.option.hasOwnProperty(i)) {
					select.add(new Option(data.option[i], i));
				}
			}
			sel_wrap.appendChild(select);

			var elm = document.createElement('div');
			elm.className = 'mag15';

			var label = '<div class="col-md-3 float_right">' + data.cname + '</div>';
			elm.appendChild($(label)[0]);
			elm.appendChild(sel_wrap);

			// $(select).on('change', function (e) {});

			return elm;
		},
		input: function (data) {
			var html = '<div class="mag15"><div class="col-md-3 float_right">'+data.cname+
					'</div></div>';
			var div = document.createElement('div');
			div.className = 'col-md-9';
			var input = document.createElement('input');
			input.id = (data.value+'_'+data.name).replace(/\./g, '_');
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
			if (data.help_text) {
				element.appendChild($('<span class="help-text">'+data.help_text+'</span>')[0]);
			}
			element.appendChild(err_tip);

			var ul = document.createElement('ul');
			ul.className = 'array-input';
			var data_list = eval('this.$scope.' + data.value);
			var i, li;
			for (i=0; i<data_list.length; i++) {
				li = '<li>'+data_list[i]+'<i class="smb-btn smb-btn-del del" style="background: red">删除</i></li>';
				$(ul).append(li);
			}
			element.appendChild(ul);
			/*event*/
			var self = this;
			$(add_button).on('click', function () {
				var content = input.value;
				if(content==''){
					return false;
				}
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
				li = '<li>'+content+'<i class="smb-btn smb-btn-del del" style="background: red">删除</i></li>';
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
		radio: function (data) {
			var html = '<div class="col-md-3 float_right">' + data.cname + '</div>';
			var elm = document.createElement('div');
			elm.className = 'mag15';
			var i;
			$(elm).append(html);
			for (i in data.option) {
				if (data.option.hasOwnProperty(i)) {
					html = '<label class="auth-mode"><input type="radio" ng-model="'+data.value+'" value="'+i+'" />'+data.option[i]+'</label>';
					$(elm).append(html);
				}
			}
			return elm;
		},
		check_input_left: function (data) {
			var is_checked = eval('this.$scope.' + data.value);
			this.$scope.leftid_sw = !!is_checked;
			var html = '<div class="mag15">'+
				'<div class="col-md-3 float_right">近端身份ID</div>'+
				'<div class="col-md-9">'+
				'<label><input type="checkbox" ng-model="leftid_sw">勾选开启</label>'+
				'<div id="leftid" style="margin-left:10px;opacity:1;display:inline-block;"><input type="text" ng-model="object.vpn.leftid">'+
				'<span style="margin:0 5px;">身份类型</span><select ng-model="object.vpn.leftid_type"><option value="domain">域名</option>'+
				'<option value="ip">IP</option><option value="email">Email</option></select></div>'+
				'</div>'+
				'</div>';
			return html;
		},
		check_input: function (data) {
			var is_checked = eval('this.$scope.' + data.value);
			this.$scope.rightid_sw = !!is_checked;
			var html = '<div class="mag15">'+
				'<div class="col-md-3 float_right">远端身份ID</div>'+
				'<div class="col-md-9">'+
					'<label><input type="checkbox" ng-model="rightid_sw">勾选开启</label>'+
					'<div id="rightid" style="margin-left:10px;opacity:1;display:inline-block;"><input type="text" ng-model="object.vpn.rightid">'+
					'<span style="margin:0 5px;">身份类型</span><select ng-model="object.vpn.rightid_type"><option value="domain">域名</option>'+
					'<option value="ip">IP</option><option value="email">Email</option></select></div>'+
				'</div>'+
				'</div>';
			return html;
		},
		timeArr_input: function (data) {
			//var is_checked = eval('this.$scope.' + data.value);
			//this.$scope.rightid_sw = !!is_checked;
			var html = '<div class="mag15">'+
				'<div class="col-md-3 float_right">集体逃生</div>'+
				'<div class="col-md-9">'+
				'<div id="wxerr_rangetime"><input type="text" ng-model="object.net_auth.wxerr_rangetime">'+
				'<span style="margin:0 5px;">秒内连续</span><input type="text" ng-model="object.net_auth.wxerr_count">个用户认证超时，进入集体逃生</div>'+
				'</div>'+
				'</div>';
			return html;
		},
		select_multiple: function (data) {
			var html = '<div class="mag15">'+
				'<div class="col-md-3 float_right">'+data.cname+'</div>'+
				'<div class="col-md-9">'+
					'<input type="text">'+
					'<button type="button" class="btn btn-primary">添加</button>'+
				'</div>'+
				'</div>'+
				'<div class=" mag15">'+
				'<div class="col-md-3 float_right">'+data.cname+'列表</div>'+
				'<div class="col-md-9">'+
					'<select multiple="multiple" class="rzsele swrz_dis" ng-model="'+data.value+'">'+
						'<option ng-repeat="w in whitelist">{{w}}</option>'+
					'</select>'+
					'<button type="button" class="btn btn-primary">删除</button>'+
				'</div>'+
				'</div>';
			return html;
		},
		button: function (data) {
			var button = document.createElement('div');
			button.className = 'btn btn-primary';
			button.style.marginBottom = '5px';
			button.textContent = data.cname;
			if (data.event) {
				data.event(button);
			}
			return button;
		},
		vpn_button: function (data) {
			var html = '<div class="col-md-3 float_right">'+data.cname+'</div>';
			var elm = document.createElement('div');
			elm.className = 'mag15';
			var i;
			$(elm).append(html);
			var button = document.createElement('div');
			button.className = 'btn btn-primary';
			button.style.marginBottom = '5px';
			button.style.marginLeft='12px';
			button.textContent = "查看及配置VPN网段规划";
			$(elm).append(button);
			if (data.event) {
				data.event(button,this.$scope);
			}
			return elm;
		},
		grid: function (data) {
			var grid = new rui.Grid(data.option);
			grid.update(eval('this.$scope.' + data.value));
			// init grid event
			// grid.resize = function () {
			// 	var maxWidth = $(this.element).parents('.tab-content').width() - 2;
			// 	if (maxWidth <= 0) {
			// 		return false;
			// 	}
			// 	this.headTable.style.width = maxWidth + 'px';
			// 	this.bodyTable.style.width = maxWidth + 'px';
			// };
			/*事件*/
			if (data.event) {
				data.event(grid, this.$scope);
			}
			return grid.element;
		},
		interface_panel: function (data) {
			var panel = new Interface(data, this.$scope);
			panel.update();
			return panel.element;
		}
	}
};
