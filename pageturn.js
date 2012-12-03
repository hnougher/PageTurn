/**
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*(function ($) {*/

$.fn.PageTurn = function (method) {
	var $elem = this.eq(0);
	switch (method) {
	case "get":
		return getBook($elem);
		break;
	default: // Create new book
		return makeBook($elem);
	}
}

var makeBook = function ($elem) {
	if (typeof $elem.data("PageTurnOBJ") == "undefined") {
		var book = new Book($elem);
		$elem.data("PageTurnOBJ", book).addClass("PageTurn");
		return book;
	}
	return getBook($elem);
}
var getBook = function ($elem) {
	var book = $elem.data("PageTurnOBJ");
	if (typeof book == "undefined")
		throw "Not actually a book object!";
	return book;
}

var Book = function ($book) {
	this.$book = $book;
	this.AllPages = [];
	
	var children = $book.children();
	for (var i = 0; i < children.length; i++) {
		var p = new Page(children.eq(i), this);
		var pp = this.getPagePair(p.pageNumber, true);
		pp.addPage(p);
	}
	
	this.currentPage = this.AllPages[0]; // The page that was last fully shown
	this.goingToPage = this.AllPages[0]; // The page we are actively transitioning to
	this.aimForPage = this.AllPages[0]; // The page that we are trying to get to
	
	this.bookInit();
};
Book.prototype = {
	bookInit: function () {
		var self = this;
		this.navigateToURLHash();
		
		// We need to listen in on the page URI changes to allow hast links to work
		// Requires http://benalman.com/projects/jquery-hashchange-plugin/
		$(window).bind('hashchange', function(e) {
			self.navigateToURLHash();
		});
	},
	
	// Finds the index of the page number in _AllPages or the next item in the list as negative index
	findGEPageIndex: function (pageNumber) {
		// TODO: binary search
		for (var i = 0; i < this.AllPages.length; i++) {
			if (this.AllPages[i].pageNumber >= pageNumber)
				return i;
		}
		return this.AllPages.length;
	},
	isPageIndex: function (index, pageNumber) {
		if (index < 0 || index >= this.AllPages.length)
			return false;
		return (this.AllPages[index].pageNumber == pageNumber);
	},
	getPagePair: function (pageNumber, createIfNotExist) {
		var indexFound = this.findGEPageIndex(pageNumber);
		
		// Already exists
		if (this.isPageIndex(indexFound, pageNumber))
			return this.AllPages[indexFound];
		
		if (!createIfNotExist) {
			// It will die anyway so crash on this console in IE
			console.error("Page index " + pageNumber + " does not exist!");
			throw "Page index " + pageNumber + " does not exist!";
		}
		
		// Insert new pagePair
		var page = new PagePair(pageNumber);
		this.AllPages.splice(indexFound, 0, page);
		return page;
	},
	
	// Looks at the current page URI and navigates to the # section name
	navigateToURLHash: function () {
		var name = document.location.href.match(/#(.+)$/);
		if (name && name.length == 2) {
			if (this.navigateToName(name[1]))
				return;
		}
		this.navigateTo(0);
	},
	// Turns the page to show the first element with the given name
	navigateToName: function (name) {
		var $elem = $("[name=" + name + "]").eq(0);
		if (!$elem.length) return false;
		var $page = $elem.parents(".page");
		if (!$page.length) return false;
		this.navigateTo($page.data("PageOBJ").pageNumber);
		return true;
	},
	// Turns to the given page number
	navigateTo: function (page) {
		// TODO: test page is valid
		if (page < 0 || page >= this.AllPages.length) return;
		this.aimForPage = this.getPagePair(page);
		this.doUpdate();
	},
	
	nextPage: function () {
		this.navigateTo(this.aimForPage.pageNumber + 1);
	},
	previousPage: function () {
		this.navigateTo(this.aimForPage.pageNumber - 1);
	},
	
	doUpdate: function () {
		//console.log("doUpdate()", this.currentPage, this.goingToPage, this.aimForPage);
		if (this.goingToPage.pageNumber < this.currentPage.pageNumber) {
			// We are continuing
			this.goingToPage.finishShow("previous");
			this.currentPage.finishHide("previous");
			this.currentPage = this.goingToPage;
		}
		else if (this.goingToPage.pageNumber > this.currentPage.pageNumber) {
			// We are continuing
			this.goingToPage.finishShow("next");
			this.currentPage.finishHide("next");
			this.currentPage = this.goingToPage;
		}
		
		if (this.aimForPage.pageNumber < this.goingToPage.pageNumber) {
			// We are starting
			this.aimForPage.startShow("previous");
			this.goingToPage.startHide("previous");
			this.goingToPage = this.aimForPage;
		}
		else if (this.aimForPage.pageNumber > this.goingToPage.pageNumber) {
			// We are starting
			this.aimForPage.startShow("next");
			this.goingToPage.startHide("next");
			this.goingToPage = this.aimForPage;
		}
	}
};

var PagePair = function (pageNumber) {
	this.pageNumber = pageNumber;
	this.pages = {left: null, right: null};
	
	//this.currentAction = 0; // 0=none, 1=hiding2prev, 2=showingfromprev, 3=showingfromnext, 4=hiding2next
	//this.state = 0; // 0=next, 1=, 1=page1action, 2=page2action
	
	//this.nextPage = null; // Should be a pagePair Object
	//this.prevPage = null; // Should be a pagePair Object
}
PagePair.prototype = {
	addPage: function (page) {
		switch (page.layout) {
		case "left": this.pages.left = page; break;
		case "right": this.pages.right = page; break;
		default: throw "Not supported page layout";
		}
	},
	
	startShow: function (type) {
		switch (type) {
		case "previous":
			if (this.pages.left)
				this.pages.left.show("left");
			break;
		case "next":
			if (this.pages.right)
				this.pages.right.show("right");
			break;
		}
	},
	finishShow: function (type) {
		switch (type) {
		case "previous":
			if (this.pages.right)
				this.pages.right.animateShow("right");
			break;
		case "next":
			if (this.pages.left)
				this.pages.left.animateShow("left");
			break;
		}
	},
	startHide: function (type) {
		switch (type) {
		case "previous":
			if (this.pages.left)
				this.pages.left.animateHide("left");
			break;
		case "next":
			if (this.pages.right)
				this.pages.right.animateHide("right");
			break;
		}
	},
	finishHide: function (type) {
		switch (type) {
		case "previous":
			if (this.pages.right)
				this.pages.right.delayHide("right");
			break;
		case "next":
			if (this.pages.left)
				this.pages.left.delayHide("left");
			break;
		}
	}
};

var Page = function (page, book) {
	var self = this;
	this.book = book;
	
	this.$page = $(page).addClass("page").data("PageOBJ", this);
	this.layout = this.$page.attr("layout");
	this.pageNumber = parseInt(this.$page.attr("page"));
	this.$page.removeAttr("layout").removeAttr("page");
	
	this.preparePage();
	
	if (this.pageNumber != 0)
		this.hide(this.layout);
	else
		this.animateShow(this.layout);
		//this.show(this.layout);
	
	this._doBookUpdate = function (e) {
		self.depth('norm');
		self.book.doUpdate();
	};
}
Page.prototype = {
	layout: "left", // left, right, both
	pageNumber: 0,
	
	preparePage: function () {
		this.$fakepage = $("<div class='fakepage'>");
		this.$page.before(this.$fakepage);
		this.$fakepage.append(this.$page);
	},
	
	depth: function (type) {
		if (typeof this.book.pageDepthStack == "undefined")
			this.book.pageDepthStack = [];
		
		/* In this animate style there is 3 depths given: {'norm','bot','top'}
		'norm' = normal page
		'bot' = page being hiden via mask
		'top' = page being shown via mask
		When something is set to 'norm' we need to remove the page from pageDepthStack.
		Depth 'bot' pages get placed at bottom of pageDepthStack.
		Depth 'top' pages get placed at top of pageDepthStack. */
		switch (type) {
		case 'bot':
			this.book.pageDepthStack.unshift(this);
			break;
		case 'top':
			this.book.pageDepthStack.push(this);
			break;
		case 'norm':
		default:
			var a = $.inArray(this, this.book.pageDepthStack); /* IE8- does not have indexOf */
			if (a >= 0)
				this.book.pageDepthStack.splice(a, 1);
			this.depth2(5);
		}
		
		// Set each item in stack to depth 6 + index
		for (var i = 0; i < this.book.pageDepthStack.length; i++)
			this.book.pageDepthStack[i].depth2(6 + i);
		
		return this;
	},
	depth2: function (depth) {
		if (depth == undefined)
			return this.$fakepage.css("z-index");
		//console.log("set depth", depth, "page", this.page);
		this.$fakepage.css("z-index", depth);
		return this;
	},
	
	show: function (side) {
		switch (side) {
		case "left": this.$fakepage.css({left:"0%", width:"50%"}); break;
		case "right": this.$fakepage.css({left:"50%", width:"50%"}); break;
		}
		this.$fakepage.show();
	},
	hide: function (side) {
		this.$fakepage.hide();
	},
	delayHide: function (side) {
		var self = this;
		window.setTimeout(function(){self.hide()}, 1000);
	},
	
	animateShow: function (side) {
		this.depth('top');
		this.$fakepage.show();
		switch (side) {
		case "left":
			this.$fakepage.css({left:"50%", width:"0%"});
			this.$fakepage.animate({left:"0%", width:"50%"},
			{duration: 1000, easing: "easeOutExpo", complete: this._doBookUpdate});
			break;
		case "right":
			this.$fakepage.css({left:"50%", width:"0%"});
			this.$fakepage.animate({width:"50%"},
			{duration: 1000, easing: "easeOutExpo", complete: this._doBookUpdate});
			break;
		}
	},
	animateHide: function (side) {
		var self = this;
		this.depth('bot');
		switch (side) {
		case "left":
			this.$fakepage.css({left:"0%", width: "50%"});
			this.$fakepage.animate({left:"50%", width: "0%"},
				{duration: 1000, easing: "easeInExpo",
				complete: function () {
					self.hide();
					self._doBookUpdate();
				}});
			break;
		case "right":
			this.$fakepage.css({left:"50%", width: "50%"});
			this.$fakepage.animate({width: "0%"},
				{duration: 1000, easing: "easeInExpo",
				complete: function () {
					self.hide();
					self._doBookUpdate();
				}});
			break;
		}
	}
};

/*})(jQuery);*/