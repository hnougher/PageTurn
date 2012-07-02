var Book = function (book) {
	var self = this;
	this.$book = $(book);
	this.$book.addClass("book");
	this.AllPages = [];
	this.isUpdating = false;
	
	var children = this.$book.children();
	for (var i = 0; i < children.length; i++) {
		var p = new Page(children.eq(i), this);
		var pp = this.getPagePair(p.pageNumber);
		pp.addPage(p);
	}
	
	this.currentPage = this.AllPages[0]; // The page that was last fully shown
	this.goingToPage = this.AllPages[0]; // The page we are actively transitioning to
	this.aimForPage = this.AllPages[0]; // The page that we are trying to get to
	
	this.bookInit();
};
Book.prototype = {
	bookInit: function () {
		this.navigateTo(0);
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
	getPagePair: function (pageNumber) {
		var indexFound = this.findGEPageIndex(pageNumber);
		
		// Already exists
		if (this.isPageIndex(indexFound, pageNumber))
			return this.AllPages[indexFound];
		
		// Make a new pagePair
		var page = new PagePair(pageNumber);
		
		// Fix Prev/Next page sets
		/*if (indexFound > 0) {
			page.prevPage = this.AllPages[indexFound - 1];
			this.AllPages[indexFound - 1].nextPage = page;
		}
		if (indexFound < this.AllPages.length) {
			page.nextPage = this.AllPages[indexFound];
			this.AllPages[indexFound].prevPage = page;
		}*/
		
		// Insert new pagePair
		this.AllPages.splice(indexFound, 0, page);
		return page;
	},
	
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
	
	this.$page = $(page).addClass("page");
	this.layout = this.$page.attr("layout");
	this.pageNumber = parseInt(this.$page.attr("page"));
	this.$page.removeAttr("layout").removeAttr("page");
	
	this.prepairPage();
	
	if (this.pageNumber != 0)
		this.hide(this.layout);
	else
		this.animateShow(this.layout);
		//this.show(this.layout);
	
	this._doBookUpdate = function (e) {
		self.depth(5);
		self.book.doUpdate();
	};
}
Page.prototype = {
	layout: "left", // left, right, both
	pageNumber: 0,
	
	prepairPage: function () {
		this.$fakepage = $("<div class='fakepage'>");
		this.$page.before(this.$fakepage);
		this.$fakepage.append(this.$page);
	},
	
	depth: function (depth) {
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
		this.depth(6);
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
		this.depth(6);
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

$(function () {
	var book = new Book(document.getElementById("book"));
	var $prev = $("<a href='#'>Previous</a>").on("click", function () { book.previousPage(); return false; });
	var $next = $("<a href='#'>Next</a>").on("click", function () { book.nextPage(); return false; });
	$("body").prepend($next).prepend($prev);
});
