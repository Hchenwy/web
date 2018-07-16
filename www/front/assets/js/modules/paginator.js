define(['jquery'], function($) {
	function paginatorMdl (option) {
		this.element = null;
		this.css = 'paginator';
		this.prev = 0;
		this.hasPrev = false;
		this.next = 0;
		this.hasNext = false;
		// 当前页
		this.pageNum = 1;
		this.total = 1;
		this.pageSize = 15;
		this.init(option);
	}

	paginatorMdl.prototype = {
		init: function (option) {
			if (option) {
				$.extend(this, option);
			}
		},
		render: function () {
			if (this.element === null) {
				this.element = document.createElement('div');
				this.element.className = this.css;
			}
			this.prevEl = document.createElement('a');
			this.prevEl.href = '';
			var t = 'Page ' + this.pageNum + ' of ' + this.total;
			this.currentEl = document.createElement('span');
			this.currentEl.textContent = t;
			this.nextEl = document.createElement('a');
			this.nextEl.href = '';
		},
		update: function (option) {
			if (option) {
				$.extend(this, option);
			}
			if (this.hasPrev) {
				this.prevEl.classList.add('ban');
			} else {
				this.prevEl.classList.remove('ban');
			}
			if (this.hasNext) {
				this.nextEl.classList.add('ban');
			} else {
				this.nextEl.classList.remove('ban');
			}
			var t = 'Page ' + this.pageNum + ' of ' + this.total;
			this.currentEl.textContent = t;
		}
	};
	return paginatorMdl;
});
