/**
 * @author chu
 * @constructor Util
 * @description 工具类提供的方法是静态的
 *              @example
 *              Util.xx
 * @since version 1.0
 */
// 全局命名空间
// var rui = {};
var Util = {

	LOCAL_LANG_COOKIE : "LOCAL_LANG_COOKIE",//

	isZhUI : function() {
		var local = $.cookie("UI_LOCAL_COOKIE");
		if (!Util.isEmpty(local) && local == "en") {
			return false;
		} else {
			return true;
		}
	},
	/**
	 * 初始化本地化代码
	 */
	initSeaVars : function() {
		if (typeof seajs !== "undefined") {
			var prodName = Util.getCookie("prodName");
			if (!Util.isEmpty(prodName)) {
				seajs.data.vars.prodName = prodName;
			}
			if (!Util.isZh()) {
				seajs.data.vars.locale = "en";
			} else {
				seajs.data.vars.locale = "zh";
			}
		}

	},

	/**
	 * 判断是否是IE
	 *
	 * @return {boolean} .
	 */
	getIsIE : function() {
		var ua = navigator.userAgent.toLowerCase();
		var isOpera = /opera/.test(ua);
		var isie = /msie/.test(ua);
		return !isOpera && isie;
	},
	/**
	 * @return {boolean} 返回组件名对应的组件类.
	 */
	apply : function(o, c, defaults) {
		if (defaults) {
			Util.apply(o, defaults);
		}
		if (o && c && typeof c == 'object') {
			for (var p in c) {
				o[p] = c[p];
			}
		}
		return o;
	},
	/**
	 * 扩展对象属性列表，已存在的属性将不进行覆盖.
	 *
	 * @param {Object}
	 *            o 待扩展的对象
	 * @param {Object}
	 *            c 扩展的属性列表对象
	 * @return {Object} 返回扩展后的对象.
	 */
	applyIf : function(o, c) {
		if (o) {
			for (var p in c) {
				if (!Util.isDefined(o[p])) {
					o[p] = c[p];
				}
			}
		}
		return o;
	},
	/**
	 * 扩展对象属性列表 已存在的属性将 进行覆盖
	 *
	 */
	extend : function() {
		var io = function(o) {
			for (var m in o) {
				this[m] = o[m];
			}
		};
		var oc = Object.prototype.constructor;
		return function(sb, sp, overrides) {
			if (typeof sp == 'object') {
				overrides = sp;
				sp = sb;
				sb = overrides.constructor != oc
						? overrides.constructor
						: function() {
							sp.apply(this, arguments);
						};
			}
			var F = function() {
			}, sbp, spp = sp.prototype;

			F.prototype = spp;
			sbp = sb.prototype = new F();
			sbp.constructor = sb;
			sb.superclass = spp;
			if (spp.constructor == oc) {
				spp.constructor = sp;
			}
			sb.override = function(o) {
				Util.override(sb, o);
			};
			sbp.superclass = sbp.supr = (function() {
				return spp;
			});
			sbp.override = io;
			Util.override(sb, overrides);
			sb.extend = function(o) {
				return Util.extend(sb, o);
			};
			return sb;
		};
	}(),
	/**
	 * 重写类的属性列表.
	 *
	 * @param {Function}
	 *            origclass 待重写的类.
	 * @param {Object}
	 *            overrides 重写的属性列表.
	 */
	override : function(origclass, overrides) {
		if (overrides) {
			var p = origclass.prototype;
			Util.apply(p, overrides);
			if (Util.isIE && overrides.hasOwnProperty('toString')) {
				p.toString = overrides.toString;
			}
		}
	},
	/**
	 * 判断传入的参数是否存在.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否存在的布尔值.
	 */
	isDefined : function(obj) {
		return typeof obj !== 'undefined';
	},
	/**
	 * 判断传入的参数是否为函数.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为函数的布尔值.
	 */
	isFunction : function(obj) {
		return Object.prototype.toString.apply(obj) === '[object Function]';
	},
	/**
	 * 判断传入的参数是否为Object对象.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为Object对象的布尔值.
	 */
	isObject : function(obj) {
		return !!obj
				&& Object.prototype.toString.call(obj) === '[object Object]';
	},
	/**
	 * 判断传入的参数是否为数组对象.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为数组对象的布尔值.
	 */
	isArray : function(obj) {
		return Object.prototype.toString.apply(obj) === '[object Array]';
	},
	/**
	 * 判断传入的参数是否为日期对象.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为日期对象的布尔值.
	 */
	isDate : function(obj) {
		return Object.prototype.toString.apply(obj) === '[object Date]';
	},
	/**
	 * 判断传入的参数是否为JQuery对象.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为JQuery对象的布尔值.
	 */
	isJQuery : function(obj) {
		return obj instanceof jQuery;
	},
	/**
	 * 判断传入的参数是否为Record对象.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为Record对象的布尔值.
	 */
	isRecord : function(obj) {
		return obj instanceof Record;
	},
	/**
	 * 判断传入的参数是否为空(null、undefined、空数组、空串).
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @param {Boolean}
	 *            allowBlank (optional) 是否允许空串，允许时空串不为空.
	 * @return {Boolean} 返回该变量是否存在的布尔值.
	 */
	isEmpty : function(obj, allowBlank) {
		return obj === null || obj === undefined
				|| ((Util.isArray(obj) && !obj.length))
				|| (!allowBlank ? obj === '' : false);
	},
	/**
	 * 判断传入的参数是否为数值.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @param {Boolean}
	 *            isString (optional) 是否验证字符串只包含数字.
	 * @return {Boolean} 返回该变量是否为数值的布尔值.
	 */
	isNumber : function(obj, isString) {
		if (isString) {
			var d = parseInt(obj).toString();
			return d == obj;
		} else {
			return typeof obj === 'number' && isFinite(obj);
		}
	},
	/**
	 * 判断传入的参数是否为布尔值.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为布尔值.
	 */
	isBoolean : function(obj) {
		return typeof obj === 'boolean';
	},
	/**
	 * 判断传入的参数是否为字符串.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为字符串的布尔值.
	 */
	isString : function(obj) {
		return typeof obj === 'string';
	},
	/**
	 * 判断传入对象是否是集合
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为字符串的布尔值.
	 */
	isIterable : function(obj) {
		if (Util.isArray(obj) || obj.callee) {
			return true;
		}
		if (/NodeList|HTMLCollection/.test(toString.call(obj))) {

			return true;
		}
		return ((typeof obj.nextNode != 'undefined' || obj.item) && Util
				.isNumber(obj.length));
	},
	/**
	 * 判断传入的参数是否为原始类型，如：字符串、数值、布尔值.
	 *
	 * @param {Object}
	 *            obj 待验证的变量.
	 * @return {Boolean} 返回该变量是否为原始类型.
	 */
	isPrimitive : function(obj) {
		return Util.isString(obj) || Util.isNumber(obj) || Util.isBoolean(obj);
	},
	/**
	 * 去除一个字符串前后所有空白字符，或者一个数组、json对象所有成员前后的空白字符.
	 *
	 * @param {String/Array/Object}
	 *            obj 待去除空白字符的变量.
	 * @return {String/Array/Object} 返回去除空白字符后的变量.
	 */
	trim : function(obj) {
		if (Util.isString(obj)) {
			return $.trim(obj);
		} else if (Util.isArray(obj)) {
			for (var i = 0; i < obj.length; i++) {
				if (Util.isString(obj[i])) {
					obj[i] = $.trim(obj[i]);
				}
			}
			return obj;
		} else if (Util.isObject(obj)) {
			for (var i in obj) {
				if (Util.isString(obj[i])) {
					obj[i] = $.trim(obj[i]);
				}
			}
			return obj;
		}
	},
	/**
	 * 比较两个时间的大小，专门给AdvForm使用
	 *
	 * @param {String}
	 *            t1 t2 待比较的对象.
	 * @return {int} t1 == t2 0 t1 > t2 1 t1 < t2 -1.
	 */
	compareTime : function(t1, t2) {
		if (t1.d == t2.d && t1.h == t2.h) {
			return 0;
		}

		var d1 = t1.d.split('-'), d2 = t2.d.split('-');
		d1[0] = parseInt(d1[0], 10);
		d1[1] = parseInt(d1[1], 10);
		d1[2] = parseInt(d1[2], 10);
		d2[0] = parseInt(d2[0], 10);
		d2[1] = parseInt(d2[1], 10);
		d2[2] = parseInt(d2[2], 10);
		if (d1[0] > d2[0]
				|| (d1[0] == d2[0] && d1[1] > d2[1])
				|| (d1[0] == d2[0] && d1[1] == d2[1] && d1[2] > d2[2])
				|| (d1[0] == d2[0] && d1[1] == d2[1] && d1[2] == d2[2] && t1.h > t2.h)) {
			return 1;
		}

		return -1;
	},

	/**
	 * IP地址转换成整型
	 *
	 * @param {String}
	 *            str 待验证的用户名字符串.
	 * @return {Long} 返回整型
	 *
	 */
	ipToLong : function(ipstr) {
		var iplong;
		var ipArr = new Array();
		ipArr = ipstr.split(".");
		iplong = parseInt(ipArr[0], 10) * 256 * 256 * 256
				+ parseInt(ipArr[1], 10) * 256 * 256 + parseInt(ipArr[2], 10)
				* 256 + parseInt(ipArr[3], 10);
		return iplong;
	},
	/**
	 * 掩码转反掩码
	 *
	 * @param subnetMask
	 *            子网掩码
	 * @return 反掩码
	 */
	subnetMask2InverseMask : function(subnetMask) {
		if (!subnetMask) {
			return "";
		}
		var ips = subnetMask.split(".");
		return (255 - ips[0]) + "." + (255 - ips[1]) + "." + (255 - ips[2])
				+ "." + (255 - ips[3]);
	},
	/**
	 * 获取格式为"xxx.xxx.xxx.xxx/xx"的IP字符串的掩码字符串。
	 *
	 * @param {String}
	 *            ip IP字符串。
	 * @return {String} 返回掩码字符串。
	 */
	getMask : function(ip) {
		var i = ip.indexOf('/');
		if (i == -1)
			return "255.255.255.255";
		var mask = parseInt($.trim(ip.substring(i + 1)));
		if (mask) {
			var v = 0xffffffff;
			v = v << (32 - mask);
			return Util.longToIP(v);
		} else {
			return "0.0.0.0";
		}
	},
	/**
	 * 获取格式为"xxx.xxx.xxx.xxx/xx 或者xxx.xxx.xxx.xxx xx的数字
	 *
	 * @param {String}
	 *            ipStr IP字符串。xxx.xxx.xxx.xxx/xx 或者xxx.xxx.xxx.xxx xx
	 * @param {String}
	 *            flag 显标志，
	 * @param {String}
	 *            isNeedReverse 是否需要转成反码，
	 * @return {String} ip字符串
	 */
	getIpAndMask : function(ipStr, isNeedReverse, showFlag) {
		if (Util.isEmpty(ipStr)) {
			return "";
		}
		if (ipStr == "any") {
			return ipStr;
		}
		if (!showFlag) {
			showFlag = "/";
		}
		var index = ipStr.indexOf('/');
		if (index == -1) {
			index = ipStr.indexOf(" ");
		}
		var ip = (ipStr.substring(0, index)).trim();
		if (index == -1 && !Util.isEmpty(ip)) {
			return ip + showFlag + "255.255.255.255";
		}
		var mask = ipStr.substring(index + 1);
		if (isNeedReverse) {
			mask = Util.subnetMask2InverseMask(mask);
		}
		return ip + showFlag + mask;
	},
	/**
	 * 整型转换成IP地址
	 *
	 * @param {Long}
	 *            iplong 待转换的整数.
	 * @return {String} 返回IP格式的地址
	 *
	 */
	longToIP : function(iplong) {
		var ips = new Array(4);
		ips[0] = parseInt((iplong >> 24) & 0xff);
		ips[1] = parseInt((iplong >> 16) & 0xff);
		ips[2] = parseInt((iplong >> 8) & 0xff);
		ips[3] = parseInt(iplong & 0xff);
		return ips[0] + "." + ips[1] + "." + ips[2] + "." + ips[3];
	},
	/*
	 * 得到可变子网掩码的掩码地址 @param vlsm 可变子网掩码, 例 192.168.197.0/27 中的27 @return 掩码地址
	 * 255.255.255.224
	 */
	vlsm2SubnetMask : function(vlsm) {
		// 2^32 - 2^(32-vlsm)
		var iplong = (2 << 31) - (2 << (32 - vlsm - 1));
		if (vlsm == 32) {
			iplong -= 1;
		}
		return this.longToIP(iplong);
	},
	/**
	 * 遍历数组.
	 *
	 * @param {Array}
	 *            v 待遍历的数组.
	 * @param {Function}
	 *            fn 遍历所执行的回调函数.
	 * @param {Object}
	 *            scope (optional) 回调函数的域变量，默认为被遍历到的元素.
	 */
	each : function(arr, fn, scope) {
		if (Util.isEmpty(arr, true)) {
			return;
		}
		if (!Util.isIterable(arr) || Util.isPrimitive(arr)) {
			arr = [arr];
		}
		for (var i = 0, len = arr.length; i < len; i++) {
			if (fn.call(scope || arr[i], arr[i], i, arr) === false) {
				return i;
			};
		}
	},
	/**
	 * 生成随机的ID字符串.
	 *
	 * @param {String}
	 *            prefix (optional) 生成ID的前缀字符串.
	 * @return {String} 返回随机生成的ID字符串.
	 */
	id : function(prefix) {
		return (prefix || "") + new Date().getTime()
				+ parseInt(Math.random() * 1000);
	},
	/**
	 * 将字符串转换为首字母大写.
	 *
	 * @param {String}
	 *            str 待转换的字符串.
	 * @return {String} 返回转换后的字符串.
	 */
	capitalize : function(str) {
		return !str ? str : str.charAt(0).toUpperCase()
				+ str.substr(1).toLowerCase();
	},
	/**
	 * 判断是中文还是英文
	 *
	 * @retrun {boolean} 返回true or false
	 */
	isZh : function() {
		var o = window.navigator;
		var lan = o.userLangeage || o.language || o.systemLanguage
				|| o.browserLanguage;
		__isZh = lan == 'zh-cn' || lan == 'zh-CN';
		var localLan = Util.getCookie(Util.LOCAL_LANG_COOKIE);
		if (Util.isEmpty(localLan)) {
			return __isZh;
		}
		return localLan == "en" ? false : true;

	},
	/**
	 * 对一个浮点数的小数位进行截断位数,并且四舍五入.
	 *
	 * @param {Object}
	 *            number 待截断的浮点数，该参数可为任何类型.
	 * @param {Number}
	 *            digit 保留的小数位数.
	 * @return {Number} 返回截断后的数值.
	 */
	fixTo : function(number, digit) {
		var num = parseFloat(number) || 0;
		var d = Math.pow(10, parseInt(digit, 10));
		if (!d) {
			return Math.round(num);
		} else {
			return Math.round(num * d) / d;
		}
		return 0;
	},
	/**
	 * 获取URL中的查询参数
	 *
	 * @param {String}
	 *            URL字符串,如果不指定，则使用当前页面的URL.
	 * @return {Object} URL中的参数对象.
	 */
	getQueryPars : function(url) {
		var searchStr, pars = {};
		if (url) {
			var splitIndex = url.indexOf("?");
			searchStr = splitIndex == -1 ? "" : url.substring(splitIndex);
		} else {
			searchStr = window.location.search;
		}
		if (searchStr == "") {
			return pars;
		} else {
			var str = searchStr.substring(1, searchStr.length), arry = str
					.split("&");
			for (var r = 0; r < arry.length; r++) {
				// 将值对拆开并输出
				var item = arry[r].split("=");
				pars[item[0]] = item[1];
			}
		}
		return pars;
	},
	/**
	 * 杜绝页面中的alert
	 *
	 * @param {String}
	 *            str打印的字符串.
	 */
	print : function(str) {
		alert(str.toString());
	},
	/**
	 * 删除节点，防止内存泄露
	 */
	removeElement : function(ele) {
		var garbage = window._garbageEle;
		if (!garbage) {
			garbage = document.createElement("div");
			window._garbageEle = garbage;
		}
		garbage.appendChild(ele);
		garbage.innerHTML = '';
	},
	/**
	 * 对输入的Mask地址进行校验。
	 *
	 * @param {String}
	 *            mask 待验证的掩码字符串。
	 * @return {Boolean} 掩码是否正确的布尔值。
	 */
	validateMask : function(sMask) {
		/* 有效性校验 */
		var IPPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
		if (!IPPattern.test(sMask))
			return false;

		/* 检查域值 */
		var IPArray = sMask.split(".");
		if (IPArray.length != 4)
			return false;

		/* 网络掩码的第一字节最小为192,第四字节最大为252 */
		if (parseInt(IPArray[0]) < 192 && parseInt(IPArray[0]) != 0)
			return false;

		for (var i = 0; i < 4; i++) {
			/* 每项值必须是以下值才能通过 */
			switch (parseInt(IPArray[i])) {
				case 0 :
					break;
				case 128 :
				case 192 :
				case 224 :
				case 240 :
				case 248 :
				case 252 :
				case 254 :
				case 255 : {
					if (i > 0) {
						if (parseInt(IPArray[i - 1]) != 255) {
							return false;
						}
					}
					break;
				}
				default :
					return false;
			}
		}

		return true;
	},
	/**
	 * 验证网段 与掩码是否匹配
	 */
	validateSubnet : function(subnet_str, mask_str) {
		var subnet = Util.ipToLong(subnet_str);
		var mask = Util.ipToLong(mask_str);
		if ((subnet & (~mask)) == 0) {
			return true;
		}
		return false;
	},
	/**
	 * @description 设置cookie
	 * @param {String}
	 *            key cookie的key值
	 * @param {String}
	 *            value cookie的值
	 * @param {String}
	 *            expiredays cookie的超时时间
	 * @return {void}
	 */
	setCookie : function(key, value, options) {
		Util.cookie(key, value, {
					path : "/"
				});
	},
	/**
	 * @description 通过cookie的健值获取cookie的值
	 * @param {String}
	 *            key cookie的key值
	 * @return {string} get cookie value
	 */
	getCookie : function(key) {
		var value = Util.cookie(key);
		return value;
	},
	cookie : function(key, value, options) {
		// key and value given, set cookie...
		if (arguments.length > 1
				&& (value === null || typeof value !== "object")) {
			if (!options) {
				options = {};
			}
			if (value === null) {
				options.expires = -1;
			}
			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}
			return (document.cookie = [
					encodeURIComponent(key),
					'=',
					options.raw
							? String(value)
							: encodeURIComponent(String(value)),
					options.expires ? '; expires='
							+ options.expires.toUTCString() : '', // use
					options.path ? '; path=' + options.path : '',
					options.domain ? '; domain=' + options.domain : '',
					options.secure ? '; secure' : ''].join(''));
		}

		// key and possibly options given, get cookie...
		options = value || {};
		var result, decode = options.raw ? function(s) {
			return s;
		} : decodeURIComponent;
		return (result = new RegExp('(?:^|; )' + encodeURIComponent(key)
				+ '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	},
	_setMark : function() {
		arguments = Array.prototype.slice.apply(arguments);
		var mark = arguments.shift();
		var arg = arguments.length == 1
				&& (Util.isObject(arguments[0]) || Util.isArray(arguments[0]))
				? arguments[0]
				: arguments;
		$("[mark='" + mark + "']").html(this.constant["language"][mark]
				.format(arg));
	},
	/**
	 * 对传入的页面对象进行初始化，执行常量注册、页面文字国际化等步骤。
	 *
	 * @param {Page}
	 *            page 待转初始化的页面对象。 lanStr : 'zh' 或 'en' 默认的语言
	 */
	initPage : function(page, lanStr) {
		var lan = lanStr || top.SysLan || Util.getLan();
		var constant = page[lan] || page.constant;
		if (constant) {
			if (constant != page.constant && page.constant
					&& page.constant.objs) {
				constant.objs = page.constant.objs;
			}
			for (var i in constant) {
				if (i == "pagetitle") {
					window.document.title = constant[i].format();
					continue;
				}
				for (var j in constant[i]) {
					if (i == "language") {
						$("[mark='" + j + "']").html(constant[i][j].format());
					} else if (i == "title") {
						$("[mark='" + j + "']").attr("title",
								constant[i][j].format());
					} else if (i == "value") {
						$("[mark='" + j + "']").attr("value",
								constant[i][j].format());
					} else if (i == "alt") {
						$("[mark='" + j + "']").attr("alt",
								constant[i][j].format());
					} else if (i == "objs") {
						eval("window._" + j + " = $('#" + page.constant[i][j]
								+ "');");
					} else {
						window[j] = constant[i][j];
					}
				}
			}
		}
		page.setMark = Util._setMark;
		// page.goTo = Util._goTo;
	},
	/**
	 * 获取当前系统语言。
	 *
	 * @return {String} 返回当前系统语言。
	 */
	getLan : function() {
		return Util.isZh() ? 'zh' : 'en';
	},
	/**
	 * 以下这条替换是和底层C编码协商好的，[?%&+]对应转为[{#1}{#2}{#3}{#4}] 下发下去会对应转回[?%&+]
	 *
	 * @param {String}
	 *            str_url 待转换的URL字符串。
	 * @return {String} 返回转换后的URL字符串。
	 */
	transUrl : function(str_url) {
		return str_url.replace(/[?]/g, "{#1}").replace(/[%]/g, "{#2}").replace(
				/[&]/g, "{#3}").replace(/[+]/g, "{#4}");
	},
	jsonToForm : function(formId, jsonObject) {
		var form = document.getElementById(formId);
		for (i = 0, max = form.elements.length; i < max; i++) {
			var e = form.elements[i];
			var eName = e.name;
			var eValue;
			if (eName.indexOf('.') > 0) {
				var dotIndex = eName.indexOf('.');
				var parentName = eName.substring(0, dotIndex);
				var childName = eName.substring(dotIndex + 1);
				// 迭代判断eName，组装成json数据结构
				eValue = Util.iterValueFromJson(jsonObject, parentName,
						childName);
			} else {
				eValue = jsonObject[eName];
			}
			if (eValue && eValue != "undefined" && eValue != "null") {
				if (!eValue) {
					eValue = "";
				}
				switch (e.type) {
					case 'checkbox' :
						var sValue = "," + eValue + ",";
						var sCheckValue = "," + e.value + ",";
						if (sValue.indexOf(sCheckValue) != -1) {
							e.checked = true;
						} else {
							e.checked = false;
						}
						break;
					case 'radio' :
						if (e.value == eValue) {
							e.checked = true;
						} else {
							e.checked = false;
						}
						break;
					case 'hidden' :
					case 'password' :
					case 'textarea' :
					case 'text' :
						e.value = eValue;
						break;
					case 'select-one' :
						e.value = eValue;
						break;
					case 'select-multiple' :
						for (j = 0; j < e.options.length; j++) {
							op = e.options[j];
							// alert("eName : " + eName + "; op value : " +
							// op.value + "; eValue : " + eValue);
							if (op.value == eValue) {
								op.selected = true;
							}
						}
						break;
					case 'button' :
					case 'file' :
					case 'image' :
					case 'reset' :
					case 'submit' :
					default :
				}
			}
		}
	},
	/**
	 * json数组读写有两种方式 1: a.bs[0].id 2: a["bs"][0]["id"] 把表单转换成json数据格式
	 */
	formToJson : function(formId) {
		var form = document.getElementById(formId);
		var jsonObject = {};
		for (var i = 0; i < form.elements.length; i++) {
			var e = form.elements[i];
			if (!$(e).is(':visible')) {
				continue;
			}
			var em = new Array();
			var eName = e.name;
			var eValue = e.value;
			if (!e.value) {
				eValue = "";
			}
			if (e.type == 'select-multiple') {
				for (j = 0; j < e.options.length; j++) {
					op = e.options[j];
					if (op.selected) {
						em[em.length] = op.value;
					}
				}
			}
			switch (e.type) {
				case 'checkbox' :
					if (e.checked) {
						if (Util.isEmpty(jsonObject[eName])) {
							jsonObject[eName] = e.value;
						} else {
							jsonObject[eName] = jsonObject[eName] + ","
									+ e.value;
						}
					} else {
						if ($(e).attr("otherValue")) {
							jsonObject[eName] = $(e).attr("otherValue");
						}
					}
					break;
				case 'radio' :
					if (!e.checked) {
						if ($(e).attr("otherValue")) {
							jsonObject[eName] = $(e).attr("otherValue");
						}
						break;
					}
				case 'hidden' :
				case 'password' :
				case 'select-one' :
				case 'select-multiple' :
				case 'textarea' :
				case 'text' :
					if (e.type == 'select-multiple') {
						eValue = em;
					} else {
						eValue = e.value.replace(new RegExp('(["\\\\])', 'g'),
								'\\$1');
					}
					// 判断是否是对象类型数据
					if (eName.indexOf('.') > 0) {
						dotIndex = eName.indexOf('.');
						parentName = eName.substring(0, dotIndex);
						childName = eName.substring(dotIndex + 1);
						// 迭代判断eName，组装成json数据结构
						Util.iterJsonObject(jsonObject, parentName, childName,
								eValue);
					} else {
						jsonObject[eName] = eValue;
					}
					break;
				case 'button' :
				case 'file' :
				case 'image' :
				case 'reset' :
				case 'submit' :
				default :
			}
		}
		return jsonObject;
	},
	/**
	 * 把表单元素迭代转换成json数据
	 */
	iterJsonObject : function(jsonObject, parentName, childName, eValue) {
		// pArrayIndex用于判断元素是否是数组标示
		pArrayIndex = parentName.indexOf('[');
		// 判断是否集合数据，不是则只是对象属性
		if (pArrayIndex < 0) {
			var child = jsonObject[parentName];
			if (!child) {
				jsonObject[parentName] = {};
			}
			dotIndex = childName.indexOf('.');
			if (dotIndex > 0) {
				Util.iterJsonObject(jsonObject[parentName], childName
								.substring(0, dotIndex), childName
								.substring(dotIndex + 1), eValue);
			} else {
				jsonObject[parentName][childName] = eValue;
			}
		} else {
			pArray = jsonObject[parentName.substring(0, pArrayIndex)];
			// 若不存在js数组，则初始化一个数组类型
			if (!pArray) {
				jsonObject[parentName.substring(0, pArrayIndex)] = new Array();
			}
			// 取得集合下标，并判断对应下标是否存在js对象
			arrayIndex = parentName.substring(pArrayIndex + 1,
					parentName.length - 1);
			var c = jsonObject[parentName.substring(0, pArrayIndex)][arrayIndex];
			if (!c) {
				jsonObject[parentName.substring(0, pArrayIndex)][arrayIndex] = {};
			}
			dotIndex = childName.indexOf('.');
			if (dotIndex > 0) {
				Util.iterJsonObject(jsonObject[parentName.substring(0,
								pArrayIndex)][arrayIndex], childName.substring(
								0, dotIndex),
						childName.substring(dotIndex + 1), eValue);
			} else {
				jsonObject[parentName.substring(0, pArrayIndex)][arrayIndex][childName] = eValue;
			}
		}
	},
	/**
	 * 迭代json数据对象设置到表单域中
	 */
	iterValueFromJson : function(jsonObject, parentName, childName) {
		// pArrayIndex用于判断元素是否是数组标示
		pArrayIndex = parentName.indexOf('[');
		// 判断是否集合数据，不是则只是对象属性
		if (pArrayIndex < 0) {
			dotIndex = childName.indexOf('.');
			if (dotIndex > 0) {
				return Util.iterValueFromJson(jsonObject[parentName], childName
								.substring(0, dotIndex), childName
								.substring(dotIndex + 1));
			} else {
				return jsonObject[parentName][childName];
			}
		} else {
			pArray = jsonObject[parentName.substring(0, pArrayIndex)];
			// 取得集合下标，并判断对应下标是否存在js对象
			arrayIndex = parentName.substring(pArrayIndex + 1,
					parentName.length - 1);
			var c = jsonObject[parentName.substring(0, pArrayIndex)][arrayIndex];
			dotIndex = childName.indexOf('.');
			if (dotIndex > 0) {
				return Util.iterValueFromJson(jsonObject[parentName.substring(
								0, pArrayIndex)][arrayIndex], childName
								.substring(0, dotIndex), childName
								.substring(dotIndex + 1));
			} else {
				return jsonObject[parentName.substring(0, pArrayIndex)][arrayIndex][childName];
			}
		}
	},
	/**
	 * 获取IP的网段地址
	 *
	 * @param {string}
	 *            ip IP地址如192.168.23.5
	 * @param {string}
	 *            mask 子网掩码地址 255.255.255.0
	 * @return {string} 网络标识，如192.168.23.0
	 */
	getNetCode : function(ip, mask) {
		var ipNum = Util.ipToLong(ip);
		var maskNum = Util.ipToLong(mask);
		var netNum = ipNum & maskNum;
		return Util.longToIP(netNum);
	},
	/**
	 * @description 获取ipv6地址的网段地址
	 * @param {string}
	 *            ipv6 ipv6地址，如2001::1
	 * @param {string}
	 *            len 掩码长度，如64,不存在掩码，返回非缩写的地址
	 * @returns {string} 网段标识 2001:0000:0000:0000:0000:0000:0000:0000
	 */
	getIpV6NetCode : function(ipv6, len) {
		if (Util.isEmpty(ipv6)) {
			ipv6 = "0：：0";
		}
		if (Util.isEmpty(len)) {
			len = 0;
		}
		var ipArr = ipv6.split(":");
		var fullIpV6 = [];
		var hadFill = false
		for (var i = 0; i < ipArr.length; i++) { // 将ipv6转为全写模式
			if (ipArr[i] === "" && !hadFill) { // 为空进行补0
				for (var j = 0; j <= (8 - ipArr.length); j++) {
					fullIpV6.push("0000");
				}
				hadFill = true;
			} else {
				if (ipArr[i].length < 4) {
					var _tmp = "";
					for (var k = 0; k < (4 - ipArr[i].length); k++) {
						_tmp += "0";
					}
					_tmp += ipArr[i];
					fullIpV6.push(_tmp);
				} else {
					fullIpV6.push(ipArr[i]);
				}
			}
		}
		if (!len)
			return fullIpV6.join(".");
		len = len - 0;
		var pos = parseInt(len / 16);
		var rem = len % 16;
		var network = fullIpV6.slice(0, pos);
		if (rem !== 0) {
			var cell = fullIpV6[pos];
			cell = parseInt(cell, 16);
			cell = cell & (0xffff << (16 - rem));
			network.push(cell.toString(16));
		}
		for (var i = network.length; i < 8; i++) {
			network.push("0000");
		}
		return network.join(".");
	},
	/**
	 * @description 转义cli命令下发某些参数，来支持特殊字符的下发
	 * @param {stirng}
	 *            param cli的参数
	 * @returns {string} 返回转义后的字符
	 */
	escapeCliParam : function(param) {
		if (param.indexOf(" ") !== -1 || param.charAt(0) === '"') { // 含有空格或第一个字符为"都要进行转义
			param = '"' + param.replace(/"/ig, '\\"') + '"';
		}
		return param;
	},
	// 获取掩码位数,默认输入掩码合法
	getMaskBit : function(mask) {
		var IPArray = mask.split(".");
		var num = 0;
		for (var i = 0; i < 4; i++) {
			/* 每项值必须是以下值才能通过 */
			switch (parseInt(IPArray[i], 10)) {
				case 0 :
					break;
				case 128 :
					num += 1;
					break;
				case 192 :
					num += 2;
					break;
				case 224 :
					num += 3;
					break;
				case 240 :
					num += 4;
					break;
				case 248 :
					num += 5;
					break;
				case 252 :
					num += 6;
					break;
				case 254 :
					num += 7;
					break;
				case 255 :
					num += 8;
					break;
				default :
					return false;
			}
		}

		return num;
	},
	// 根据掩码位数,获取掩码值，默认掩码位数为正确的值
	getBitToMask : function(num) {
		var bitnum = parseInt(num / 8);
		var residue = parseInt(num % 8);
		var maskLow = 0;
		var mask = [0, 0, 0, 0];
		for (var i = 0; i < bitnum; i++) {
			mask[i] = 255;
		};
		switch (residue) {
			case 0 :
				if (mask[3] == 255) {
					maskLow = 255;
				}
				break;
			case 1 :
				maskLow = 128;
				break;
			case 2 :
				maskLow = 192;
				break;
			case 3 :
				maskLow = 224;
				break;
			case 4 :
				maskLow = 240;
				break;
			case 5 :
				maskLow = 248;
				break;
			case 6 :
				maskLow = 252;
				break;
			case 7 :
				maskLow = 254;
				break;
			case 8 :
				maskLow = 255;
				break;
			default :
				return false;
		};
		if(bitnum!=4){
            mask[bitnum] = maskLow;
		}
		return mask.join(".");
	},
	/* 根据目标ip生成掩码 */
	getIpMask : function(destination) {
		var zeroNum = 4;
		var mask;
		for (var i = 3; i >= 0; i--) {
			if (destination.split('.')[i] == 0) {
				zeroNum--;
				continue;
			}
			break;
		}
		switch (zeroNum) {
			case 4 :
				mask = '255.255.255.255';
				break;
			case 3 :
				mask = '255.255.255.0';
				break;
			case 2 :
				mask = '255.255.0.0';
				break;
			case 1 :
				mask = '255.0.0.0';
				break;
			case 0 :
				mask = '0.0.0.0';
				break;
		}
		return mask;
	},
	/*
	 * 转义字符处理 @ str 传入指定的字符串 @ str 返回转义的字符串 lin
	 *
	 */
	encodeHtml : function(str) {
		if (!Util.isString(str)) {
			return str;
		}
		var s = "";
		if (str.length == 0)
			return "";
		s = str.replace(/&/g, "&amp;");
		s = s.replace(/</g, "&lt;");
		s = s.replace(/>/g, "&gt;");
		s = s.replace(/ /g, "&nbsp;");
		s = s.replace(/\'/g, "&#39;");
		s = s.replace(/\"/g, "&quot;");
		s = s.replace(/\n/g, "<br>");
		return s;
	},
	/*
	 * 对于空格配置，只要包含空格，web下发得加""再下发 @ str 传入指定的字符串 @ str 返回双引号的处理过的字符串 lin
	 *
	 */
	getSpaceStr : function(str) {
		if (Util.containSpace) {
			str = '"' + str + '"';
		}
		return str;
	},
	/**
	 *
	 * 网段自动生成网关地址
	 * @param str
	 * @returns {string}
	 */
	getGateway:function(str){
		var ipArr = new Array();
		ipArr = str.split(".");
		var iplong = (ipArr[0] << 24) + (ipArr[1] << 16) + (ipArr[2] << 8) + parseInt(ipArr[3], 10);
		iplong = iplong + 1;
		var ips = new Array(4);
		ips[0] = parseInt((iplong >> 24) & 0xff);
		ips[1] = parseInt((iplong >> 16) & 0xff);
		ips[2] = parseInt((iplong >> 8) & 0xff);
		ips[3] = parseInt(iplong & 0xff);
		return ips[0] + "." + ips[1] + "." + ips[2] + "." + ips[3];
	}
};

Util.applyIf(Array.prototype, {
			/**
			 * 检查一个对象是否存在于数组中.
			 *
			 * @param {Object}
			 *            o 待检查的对象
			 * @param {Number}
			 *            from (Optional) 查询起始位置的索引值
			 * @return {Number} 返回对象在数组中的索引值(如果没有找到则返回-1)
			 */
			indexOf : function(o, from) {
				var len = this.length;
				from = from || 0;
				from += (from < 0) ? len : 0;
				for (; from < len; ++from) {
					if (this[from] === o) {
						return from;
					}
				}
				return -1;
			},
			/**
			 * 从数组中删除指定对象，如果没有在数组中找到该对象则不做任何操作.
			 *
			 * @param {Object}
			 *            o 要找到并将其删除的对象
			 * @return {Array} 返回数组本身
			 */
			remove : function(o) {
				var index = this.indexOf(o);
				if (index != -1) {
					this.splice(index, 1);
				}
				return this;
			},
			/**
			 * 合并两个数组，并保持数组中元素的唯一性
			 *
			 * @param {Array}
			 *            arr 要找到并将其删除的对象
			 * @return {Array} 返回合并后的数组
			 */

			unique : function(arr) {
				if (!Util.isArray(arr)) {
					arr = [];
				}
				for (var i = 0; i < arr.length; i++) {
					if ($.inArray(arr[i], this) == -1) {
						this.push(arr[i]);
					}
				}
				return this;
			},
			/**
			 * 根据传入参数获取数组中元素，碰到第一个为true的参数时返回与其位置对应的数组元素 arguments
			 * 可变参，每个都是boolean值
			 *
			 * @return 返回取得的元素，默认返回最后一个元素
			 */
			get : function() {
				var arg = arguments, l = arg.length < this.length
						? arg.length
						: this.length, res;
				for (var i = 0; i < l; i++) {
					if (!!arg[i]) {
						res = this[i];
						break;
					}
				}
				return res || this[this.length - 1];
			}
		});

/**
 * @class String
 */
Util.applyIf(String, {
			/**
			 * 对字符串中 ' 和 \ 字符进行转译
			 *
			 * @param {String}
			 *            string 待转译的字符串
			 * @return {String} The 转译后的字符串
			 * @static
			 */
			escape : function(string) {
				return string.replace(/('|\\)/g, "\\$1");
			},
			/**
			 * 在字符串的左侧填充指定字符.这对于规范编号和日期字符串特别有用.例程:
			 *
			 * <pre><code>
			 * var s = String.leftPad('123', 5, '0');
			 * 现在包含了这样的字符串 : '00123'
			 * </code></pre>
			 *
			 * @param {String}
			 *            string 原始字符串
			 * @param {Number}
			 *            size 输出字符串的总长度
			 * @param {String}
			 *            char (optional) 用于填充原始字符串的字符(默认为空格" ")
			 * @return {String} 填充后的字符串
			 * @static
			 */
			leftPad : function(val, size, ch) {
				var result = String(val);
				if (!ch) {
					ch = " ";
				}
				while (result.length < size) {
					result = ch + result;
				}
				return result;
			}
		});

Util.applyIf(String.prototype, {
			/**
			 * @param {reallyDo}
			 *            要搜索字符
			 * @param {replaceWith}
			 *            要替换成的字符
			 * @return {ignoreCase} 是否忽略大小写
			 * @static
			 */
			replaceAll : function(reallyDo, replaceWith, ignoreCase) {
				if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
					return this.replace(new RegExp(reallyDo, (ignoreCase
											? "gi"
											: "g")), replaceWith);
				} else {
					return this.replace(reallyDo, replaceWith);
				}
			},
			/**
			 * 去除字符串前后的空白字符.例如:
			 *
			 * <pre><code>
			 * var s = '  foo bar  ';
			 * alert('-' + s + '-'); //提示 &quot;- foo bar -&quot;
			 * alert('-' + s.trim() + '-'); //提示 &quot;-foo bar-&quot;
			 * </code></pre>
			 *
			 * @return {String} 去除空白字符后的字符串
			 */
			trim : function() {
				var re = /^\s+|\s+$/g;
				return function() {
					return this.replace(re, "");
				};
			}(),

			/**
			 * 通过占位符对字符串进行格式化.占位符的键值可以为数值索引，也可以使关键字字符串{0}, {1}, {key} 等.
			 * 占位符可以设置默认值:{key:value},当占位符没有被指定替代时将被替换为默认值value.
			 * 占位符可以带有前缀字符串:{prefix=>key},当占位符被匹配时将被替换为"prefix
			 * value"的字符串，该格式主要用于CLI命令拼接.
			 * 替换占位符的参数列表可以采用可选参数形式，参数匹配关键字为由0开始增长的索引值，也可以是JSON对象形式的键值对.例程:
			 *
			 * <pre><code>
			 * var cls = 'my-class', text = 'Some text', src = '&lt;div class=&quot;{0}&quot;&gt;{1}&lt;/div&gt;';
			 * var s = src.format(cls, text);
			 * // s现在包含的字符串为: '&lt;div class=&quot;my-class&quot;&gt;Some text&lt;/div&gt;'
			 *
			 * var hello1 = &quot;hello {key:world}&quot;, hello2 = &quot;hello {0:world}&quot;;
			 * var r = hello1.format(); // r现在包含的字符串为: 'hello world'
			 * r = hello1.format({
			 * 			key : &quot;Mary&quot;
			 * 		}); // r现在包含的字符串为: 'hello Mary'
			 * r = hello2.format(&quot;Mary&quot;); // r现在包含的字符串为: 'hello Mary'
			 *
			 * // 使用前缀拼接命令
			 * var cmd = &quot;flow-rule {id} session-limit {session:8000} action {action:pass} {in-channel=&gt;in} {out-channel=&gt;out}&quot;;
			 * var t = cmd.format({
			 * 			id : 1,
			 * 			&quot;in&quot; : &quot;inside&quot;,
			 * 			&quot;out&quot; : &quot;outside&quot;
			 * 		});
			 * // t现在包含的字符串为: 'flow-rule 1 session-limit 8000 action pass in-channel inside out-channel outside'
			 * </code></pre>
			 *
			 * @param {String/Object}
			 *            value1 替换索引值为0占位符的字符串，或者是包含占位符替换信息列表的对象.
			 * @param {String}
			 *            value2 Etc...
			 * @return {String} 格式化后的字符串
			 */
			format : function() {
				var params = {}, result = this.toString(), index = -1;
				if (arguments.length) {
					if (Util.isObject(arguments[0])
							|| Util.isArray(arguments[0])) {
						params = arguments[0];
					} else {
						for (var i = 0; i < arguments.length; i++) {
							params[i] = arguments[i];
						}
					}
				}
				for (var p in params) {
					if (typeof params[p] == "string") {
						params[p] = params[p].toString().replace(/{/g, "?-?")
								.replace(/}/g, "?+?");
					}
				}
				while ((index = result.indexOf("{")) != -1) {
					var holder = result.substring(index, result.indexOf("}")
									+ 1);
					var key = holder.substring(1, holder.indexOf(":") != -1
									? holder.indexOf(":")
									: holder.length - 1);
					var prefix = key;
					key = (key.indexOf("=>") != -1) ? key.split("=>")[1] : key;
					prefix = (prefix.indexOf("=>") != -1)
							? prefix.split("=>")[0]
							: "";
					var value = holder.indexOf(":") != -1 ? holder.substring(
							holder.indexOf(":") + 1, holder.length - 1) : "";
					if (key.indexOf("(") == -1) {
						var c = Util.isDefined(params[key])
								&& params[key] !== "";
						if (c) {
							value = params[key];
						}
						// alert(holder + " " + (c ? prefix + " " : "") + value)
						result = result.replace(holder, (c ? prefix + " " : "")
										+ value);
					} else {
						words = key.substring(key.indexOf("[") + 1, key
										.indexOf("]"));
						words = words.split(",");
						var res = "";
						if (key.indexOf("has") != -1) {
							for (var i = 0; i < words.length; i++) {
								if (Util.isDefined(params[words[i]])
										&& params[words[i]] !== "") {
									res = value;
									break;
								}
							}
							result = result.replace(holder, res);
						}
					}
				}

				return result.replace(/\?\+\?/g, "}").replace(/\?\-\?/g, "{");
			},
			/**
			 * 计算字符串长度，英文、半角字符算1位，中文、全角字符算2位
			 *
			 * @return {int} 返回字符串长度
			 */
			lengthW : function() {
				return this.replace(/[^\x00-\xff]/g, '||').length;
			},
			/**
			 * 时间格式字符串转换成日期对象
			 *
			 * @param {}
			 *            @example
			 *            str var str="2014-11-12 22:11:22";
			 * var  date=str.format2Date(); alert(date);
			 *
			 * @return {Date}
			 */
			format2Date : function() {
				var date = eval('new Date('
						+ this.replace(/\d+(?=-[^-]+$)/, function(a) {
									return parseInt(a, 10) - 1;
								}).match(/\d+/g) + ')');
				return date;

			}
		});
/**
 * 给时间提供一个时间format方法
 */
Util.applyIf(Date.prototype, {
			/*
			 * format="yyyy-MM-dd hh:mm:ss"; var date=new Date();
			 * alert(date.format("yyyy-MM-dd hh:mm:ss")
			 */
			format : function(format) {
				var o = {
					"M+" : this.getMonth() + 1,
					"d+" : this.getDate(),
					"h+" : this.getHours(),
					"m+" : this.getMinutes(),
					"s+" : this.getSeconds(),
					"q+" : Math.floor((this.getMonth() + 3) / 3),
					"S" : this.getMilliseconds()
				}
				if (/(y+)/.test(format)) {
					format = format.replace(RegExp.$1,
							(this.getFullYear() + "").substr(4
									- RegExp.$1.length));
				}
				for (var k in o) {
					if (new RegExp("(" + k + ")").test(format)) {
						format = format.replace(RegExp.$1,
								RegExp.$1.length == 1 ? o[k] : ("00" + o[k])
										.substr(("" + o[k]).length));
					}
				}
				return format;
			}
		});
// 校验规则
var ValidateRules = {
	// 验证必填
	isEmpty : function(str) {
		return $.trim(str) == '';
	},
	// 验证最小长度
	minLen : function(str, len) {
		return str.length >= len;
	},
	// 验证最大长度
	maxLen : function(str, len) {
		return str.length <= len;
	},
	// 验证最大字节长度不超过多少
	maxByteLen : function(str, len) {
		return str.lengthW() <= len;
	},
	// 验证长度的区间
	inRangeLen : function(str, minL, maxL) {
		return str.length >= minL && str.length <= maxL;
	},
	// 验证最大值
	max : function(str, val) {
		var number = parseFloat(str);
		return str && !isNaN(str) && number <= val;
	},
	// 验证最大值
	min : function(str, val) {
		var number = parseFloat(str);
		return str && !isNaN(str) && number >= val;
	},
	// 验证值的范围
	inRange : function(str, min, max) {
		var number = parseFloat(str);
		return str && !isNaN(str) && number >= min && number <= max;
	},
	// 验证URL
	isUrl : function(str) {
		var reg = new RegExp("^https?://([\w-]+\.)+[\w-]+(/[\w ./?%&=-]*)?");
		return reg.test(str);
	},
	// 验证整数
	isInteger : function(str) {
		return str == '0' || /^-?[1-9]\d*$/.test(str);
	},
	// 验证正整数
	isPinteger : function(str) {
		return /^[1-9]\d*$/.test(str);
	},
	// 验证数字 0-9的数字
	isNumberStr : function(str) {
		return /^[0-9]*$/.test(str);
	},
	// 浮点数 整数或小数
	isFloat : function(str) {
		return !isNaN(str);
	},
	// 固话 格式010-8745698 或 0591-8784587
	isPhone : function(str) {
		return (/^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$/
				.test(str));
	},
	// 移动电话
	isMobile : function(str) {
		return (/^1[3|4|5|7|8]\d{9}$/.test(str));
	},
	// 验证邮箱
	isEmail : function(str) {
		return /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/.test(str);
	},
	// 全部中文
	isZh : function(str) {
		return /^[\u4e00-\u9fa5]+$/.test(str);
	},
	/**
	 * 验证一个字符串是否含有中文
	 *
	 * @param {String}
	 *            str 待验证的用户名字符串.
	 * @return {Boolean} 返回字符串是否通过验证的布尔值.
	 */
	hasZh : function(str) {
		return /[\u4E00-\u9FA5]/.test(str);
	},
	// 单词：数字，字母 下划线
	isWord : function(str) {
		return /^\w+$/.test(str);
	},
	/*
	 * 判断字符串中是否包含空格 @param {String} str_in 待检查的字符串 @return {Boolean}
	 * 返回true,不包含返回false
	 */
	hasSpace : function(str_in) {
		return str_in.indexOf(" ") != -1;
	},
	/**
	 * 验证一个字符串是否含有中文和全角字符
	 *
	 * @param {String}
	 *            str 待验证的用户名字符串。
	 * @return {Boolean} 返回字符串是否通过验证的布尔值。
	 */
	hasZhEncod : function(str) {
		return /[^\x00-\xff]/.test(str);
	},
	/**
	 * 验证一个字符串是否为合法的用户名格式.考虑到其他字符可以配置，基本的过滤?,其他的过滤条件具体考虑 lin
	 *
	 * @param {String}
	 *            username 待验证的用户名字符串.
	 * @return {Boolean} 返回字符串是否通过验证的布尔值.
	 *
	 */
	validateName : function(username) {
		var reg = /[?]/;
		return !reg.test(username);
	},
	/**
	 * 验证一个字符串是否为合法，所有输入框都要经过此验证
	 *
	 * @param {String}
	 *            str 待验证的用户名字符串.
	 * @return {Boolean} 返回字符串是否通过验证的布尔值.
	 */
	vInput : function(str) {
		return this.validateInput(str);
	},
	/**
	 * 严格验证一个字符串是否为合法.
	 *
	 * @param {String}
	 *            str 待验证的用户名字符串.
	 * @return {Boolean} 返回字符串是否通过验证的布尔值.
	 */
	validateInput : function(str) {
		var reg = /\?/;
		var reg2 = /\S+\s+\S*\\\s*$/;
		return !reg.test(str) && !reg2.test(str);
	},
	/**
	 * 验证一个字符串是否符合有效IP的格式.
	 *
	 * @param {String}
	 *            ip 待验证的字符串.
	 * @return {Bool} 返回字符串是否通过验证的布尔值.
	 */
	isIP : function(ip) {
		if (ValidateRules.isEmpty(ip)) {
			return false;
		}
		var re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/g;
		if (re.test(ip)) {
			if (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256
					&& RegExp.$4 < 256) {
				// CJL 增加每个数值的长度判定
				if (RegExp.$1.length < 4 && RegExp.$2.length < 4
						&& RegExp.$3.length < 4 && RegExp.$4.length < 4)
					return true;
			}
		}
		return false;
	},
	/**
	 * 验证一个字符串是否符合有效的 多IP 的格式.
	 *
	 * @param {String}
	 *            str 待验证的字符串.
	 * @return {Bool} 返回字符串是否通过验证的布尔值.
	 */
	isMuchIP : function(str) {
		if (ValidateRules.isEmpty(str)) {
			return false;
		}
		var ips = str.split(',');
		for (var i = 0, l = ips.length; i < l; i++) {
			if (!ValidateRules.isIP(ips[i])) {
				return false;
			}
		}
		return true;
	},
	/*
	 * 对输入的IP地址进行严格校验,格式为xx.xx.xx.xx @param {String} IPstr 待验证的IP串. @return
	 * {Boolean} 返回true or false
	 */
	isStrictIP : function(IPstr) {
		if (Util.isEmpty(IPstr)) {
			return false;
		}
		var re = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)$/g;
		/* return re.test(ip); */
		if (!re.test(IPstr))
			return false;
		var IPArray = IPstr.split(".");
		if (IPArray[0] == 0 || IPArray[0] == 127 || parseInt(IPArray[0]) >= 224) {
			return false;
		}
		return true;
	},
	/**
	 * 判断是否单播地址
	 *
	 * @param {String}
	 *            IPstr
	 * @return true or false
	 */
	isUnicastIP : function(IPstr) {
		/* 有效性校验 */
		var IPPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
		if (!IPPattern.test(IPstr)) {
			return false;
		}
		/* 检查域值 */
		var IPArray = IPstr.split(".");
		if (IPArray.length != 4) {
			return false;
		}
		var tInt = 0;
		var iInt = 0;
		for (iInt = 0; iInt < 4; iInt++) {
			/* 每个域值范围1-255 */
			tInt = parseInt(IPArray[iInt]);
			if (tInt < 0 || tInt > 255) {
				return false;
			}
			/* 子网或广播ip都不行 */
			if ((tInt == 0 || tInt == 255) && iInt == 3) {
				return false;
			}
			/* 0.0.0.*不可以返回false A B C类的判断 */
			if (iInt == 0 && (tInt < 1 || tInt > 223)) {
				return false;
			}
			/* 127.*.*.*不合法 */
			if (iInt == 0 && tInt == 127) {
				return false;
			}
		}
		return true;
	},
	/**
	 * 验证一个IP是否在一个IP段内
	 *
	 * @param {String}
	 *            ip 待验证的IP.
	 * @param {String}
	 *            startIp 起始IP.
	 * @param {String}
	 *            endIp 结束IP.
	 * @param {Boole}
	 *            include 是否包含起始和结束IP.
	 * @return {Boolean} 在IP段之间则返回true.
	 */
	ipBetween : function(ip, startIp, endIp, include) {
		var vip = Util.ipToLong(ip);
		var sip = Util.ipToLong(startIp);
		var eip = Util.ipToLong(endIp);
		if (include) {
			return (vip >= sip && vip <= eip);
		} else {
			return (vip > sip && vip < eip);
		}
	},
	/**
	 * 验证IP 是否在某个网段内
	 *
	 * @param {String}
	 *            ip IP地址如192.168.23.25
	 * @param {String}
	 *            mask IP所处的掩码，如255.255.255.0
	 * @param {String}
	 *            netCode 网段地址，如192.168.23.0
	 * @return {Boolean}
	 */
	ipInSubnet : function(ip, mask, netCode) {
		var net = Util.getNetCode(ip, mask);
		// 通过掩码计算IP的网段，判断是否一致
		return net == netCode;
	},
	/**
	 * 验证2个IP是否同属一个网段
	 */
	inSameNet : function(ip1, ip2, mask) {
		var net1 = Util.getNetCode(ip1, mask);
		var net2 = Util.getNetCode(ip2, mask);
		return net1 == net2;
	},
	/**
	 * 对输入的Mac地址进行校验.
	 *
	 * @param {String}
	 *            MACstr 待验证的mac字符串.
	 * @return {Boolean} 掩码是否正确的布尔值.
	 */
	isMAC : function(MACstr) {
		var MACPattern = /^[0-9,a-f,A-F]{4}\.[0-9,a-f,A-F]{4}\.[0-9,a-f,A-F]{4}$/;
		if (MACstr == "0000.0000.0000") {
			return false;
		}
		if (!MACPattern.test(MACstr))
			return false;
		var unicastPattern = /^[0-9,a-f,A-F]{1}[1,3,5,7,9,b,d,f]{1}.*$/;
		if (unicastPattern.test(MACstr))
			return false;
		return true;
	},
	/**
	 * 对输入的Mac2地址进行校验.
	 *
	 * @param {String}
	 *            MACstr 待验证的mac字符串.	00:FF:1F:75:34:91或00-FF-1F-75-34
	 * @return {Boolean} 掩码是否正确的布尔值.
	 */
	isMAC2 : function(MACstr) {
		var MACPattern = /^[0-9,a-f,A-F]{2}[:-][0-9,a-f,A-F]{2}[:-][0-9,a-f,A-F]{2}[:-][0-9,a-f,A-F]{2}[:-][0-9,a-f,A-F]{2}[:-][0-9,a-f,A-F]{2}$/;
		if (MACstr == "00:00:00:00:00:00" || MACstr == "00-00-00-00-00-00") {
			return false;
		}
		if (!MACPattern.test(MACstr))
			return false;
		var unicastPattern = /^[0-9,a-f,A-F]{1}[1,3,5,7,9,b,d,f]{1}.*$/;
		if (unicastPattern.test(MACstr))
			return false;
		return true;
	  },
	/**
	 * 校验是否合法的掩码地址.
	 *
	 * @param {String}
	 *            maskCode 待验证的掩码字符串.
	 * @return {Boolean} 掩码是否正确的布尔值.
	 * @auth zhongcj at 20130106
	 */
	isMaskCode : function(maskCode) {
		// 首先判断是否合法的IP
		if (!ValidateRules.isIP(maskCode)) {
			return false;
		}
		// 二进制码要相邻，即形如111...11000...0的形式
		// 将掩码转化成32无符号整型，取反为000...00111...1，然后再加1为00...01000...0，此时为2^n，如果满足就为合法掩码
		var num = Util.ipToLong(maskCode);
		num = ~num + 1;
		// 判断是否为2^n
		return (num & (num - 1)) == 0;
	},
	/**
	 * 校验是否合法的IPV6地址，如2:14:58:a1:23:34:43:9 或缩写 20::33或者20::
	 *
	 * @param {String}
	 *            ip 待验证的ipv6字符串.
	 * @return {Boolean} 掩码是否正确的布尔值. IPV6 格式：
	 *         8段4位16进制数字，中间用:隔开，每段中前面的0可以省略，连续的0可省略为"::"
	 * @auth zhongcj at 20130109
	 */
	isIPV6 : function(ip) {
		if (!/:/.test(ip)) {// 必须包含":"号
			return false;
		}
		if (/::/.test(ip)) {// 包含"::"号
			if (ip.match(/::/g).length > 1) {// "::"只能有一个
				return false;
			}
			return (/^::$|^(::)?([\da-f]{1,4}(:|::)){0,6}[\da-f]{0,4}$/i
					.test(ip));
		} else {// 8组4位十六进制字符串 中间用":"号隔开
			return /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(ip);
		}
	},
	/**
	 * 验证携带掩码的IPV6地址，格式2:14:58:a1:23:34:43:9/64 或缩写 20::33/64
	 */
	isIPV6WithMask : function(ip) {
		if (ip.indexOf("/") == -1) {
			return false;
		}
		var arr = ip.split("/");
		if (arr.length != 2) {
			return false;
		}
		return ValidateRules.isIPV6(arr[0])
				&& ValidateRules.inRange(arr[1], 0, 128);
	},
	/**
	 * 验证字符串是否包含空格
	 *
	 * @return 包含空格返回true
	 */
	containSpace : function(str) {
		return / /.test(str);
	},
    /**
     * 验证字符串不能包含全角字符除中文外？及-
     * @param {type} str
     * @returns {undefined}
     */
    zhSpecialChar : function(str){
        return !/？|—|·|……|。|【|】|：|“|、|》|《/.test(str);
    }
};
// 设备sea的本地化变理
// Util.initSeaVars();
