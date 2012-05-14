var book = function (book) {
	var self = this;
	this.$book = $(book);
	this.$book.addClass("pageturn");
	this.activePages = [];
	
	/*var children = this.$book.children();
	for (var i = 0; i < children.length; i++) {
		var $child = children.eq(i).addClass("page");
		var $div = $("<div class='fakepage'>").attr("page", $child.attr("page"));
		$child.removeAttr("page");
		$child.before($div);
		$div.append($child);
	}*/
	this.pages = [];
	var children = this.$book.children();
	for (var i = 0; i < children.length; i++)
		this.pages.push(new page(children.eq(i)));
	
	this.$book.on("click", ".fakepage[page=left]", function (e) {
		self.previousPage();
		});
	this.$book.on("click", ".fakepage[page=right]", function (e) {
		self.nextPage();
		});
	
	this.navigateTo(0);
};
book.prototype = {
	// Private Vars
	$book: null,
	currentPage: 0,
	
	// Start on 1+2, Click Next to goto 3+4
	// set depths: 1=x, 2=x+1, 4=x
	// 4 set visible
	// 2 flips up
	// 2 set hidden
	// set depths: 3=x+1
	// 3 set visible
	// 3 flips down
	// 1 is hidden
	// set depths: 3=x, 4=x
	
	navigateTo: function (page) {
		var curZ = this.pages.length;
		for (var i = 0; i < this.pages.length; i++) {
			if (this.pages[i].page < page) {
				this.pages[i].state("prev").depth(++curZ);
			}
			else if (this.pages[i].page > page) {
				this.pages[i].state("next").depth(--curZ);
			}
			else {
				this.pages[i].state("show").depth(++curZ);
			}
		}
		
		this.currentPage = page;
	},
	navigateTo_action1: function (oldPage, newPage) {
		//var curZ = this.pages.length; // This is our base, animated pages will be layered on top
		var curZ = 10; // This is our base, animated pages will be layered on top
		
		
		
		for (var i = 0; i < this.pages.length; i++) {
			if (this.pages[i].page < page) {
				this.pages[i].state("prev").depth(++curZ);
			}
			else if (this.pages[i].page > page) {
				this.pages[i].state("next").depth(--curZ);
			}
			else {
				this.pages[i].state("show").depth(++curZ);
			}
		}
	},
	
	nextPage: function () {
		this.navigateTo(this.currentPage + 1);
	},
	previousPage: function () {
		this.navigateTo(this.currentPage - 1);
	}
};

var pagePair = function (pageNumber) {
	this.pageNumber = pageNumber;
	this.pages = {left: null, right: null};
	
	this.currentAction = 0; // 0=none, 1=hiding2prev, 2=showingfromprev, 3=showingfromnext, 4=hiding2next
	this.state = 0; // 0=next, 1=, 1=page1action, 2=page2action
	
	this.nextPage = null; // Should be a pagePair Object
	this.prevPage = null; // Should be a pagePair Object
}
pagePair.prototype = {
	// Static Var
	_AllPages: [],
	
	// Static Methods
	// Finds the index of the page number in _AllPages or the next item in the list as negative index
	_FindGEPageIndex: function (pageNumber) {
		var pages = pagePair.prototype._AllPages;
		// TODO: binary search
		for (var i = 0; i < pages.length; i++) {
			if (pages[i].pageNumber >= pageNumber)
				return i;
		}
		return pages.length;
	},
	_IsPageIndex: function (index, pageNumber) {
		return (pagePair.prototype._AllPages[index].pageNumber == pageNumber);
	},
	GetPagePair: function (pageNumber) {
		var pages = pagePair.prototype._AllPages;
		var indexFound = pagePair.prototype._FindGEPageIndex(pageNumber);
		
		// Already exists
		if (pagePair.prototype._IsPageIndex(indexFound, pageNumber))
			return pages[indexFound];
		
		// Make a new pagePair
		var page = new pagePair(pageNumber);
		
		// Fix Prev/Next page sets
		if (indexFound > 0) {
			page.prevPage = pages[indexFound - 1];
			pages[indexFound - 1].nextPage = page;
		}
		if (indexFound < pages.length) {
			page.nextPage = pages[indexFound];
			pages[indexFound].prevPage = page;
		}
		
		// Insert new pagePair
		pages.splice(indexFound, 0, page);
		return page;
	},
	
	// Member Methods
	// Action must be 1 to 4 relating to currentAction
	startAction: function (action) {
		switch (this.currentAction) {
		case 1:
			switch (action) {
			case 2:
			case 1: break; // Continue what we are doing
			default: throw "Invalid action given current state";
			}
		case 0: default:
			switch (action) {
			case 1:
				
			default: throw "Invalid action";
			}
		}
	},
	
	onStartTransition: function () { // Before first page starts moving
		var self = this;
		if (this.currentAction == 1) { // hiding2prev
			this.state = 2;
			this.nextpage.currentAction = 3; // showingFromNext
			this.nextpage.state = 2;
			this.nextpage.pages.right.show();
			//this.nextPage.startAction(3); // showingfromnext
			this.pages.right.animateShowPrev(function(){self.onHalfTransition()});
		}
		else if (this.currentAction == 4) { // hiding2next
			this.state = 1;
			this.prevPage.currentAction = 2; // showingFromPrev
			this.prevPage.state = 1;
			this.prevPage.pages.left.show();
			//this.prevPage.startAction(2); // showingfromprev
			this.pages.left.animateShowNext(function(){self.onHalfTransition()});
		}
	},
	onHalfTransition: function () { // as soon as first page finishes transition but before the second one starts
		var self = this;
		if (this.currentAction == 1) { // hiding2prev
			this.state = 1;
			this.pages.right.hide();
			this.nextPage.state = 1;
			this.nextPage.pages.left.show();
			this.nextPage.pages.left.animateNextShow(function(){self.onEndTransition()});
			//this.nextPage.startAction(3); // showingfromnext
			//this.pages.left.animateShowPrev();
		}
		else if (this.currentAction == 4) { // hiding2next
			this.state = 2;
			this.pages.left.hide();
			this.prevPage.state = 2;
			this.prevPage.pages.right.show();
			this.prevPage.pages.right.animatePrevShow(function(){self.onEndTransition()});
			//this.prevPage.startAction(2); // showingfromprev
			//this.pages.right.animateShowNext();
		}
	},
	onEndTransition: function () { // as soon as the second page finishes moving
		this.currentAction = 0;
		this.state = 0;
		this.pages.left.hide();
		this.pages.right.hide();
		this.book.nextAction();
	},
};

var page = function (page) {
	this.$page = $(page).addClass("page");
	this.$fakepage = $("<div class='fakepage'>");
	this.layout = this.$page.attr("layout");
	this.page = parseInt(this.$page.attr("page"));
	this.$page.removeAttr("layout").removeAttr("page").before(this.$fakepage);
	this.$fakepage.append(this.$page);
	
	this.$fakepage.css("left", "50%").css("width", "0%");
}
page.prototype = {
	layout: "left", // left, right, both
	_state: "prev", // prev, show, next
	page: 0,
	
	state: function (state) {
		//console.log("set state", state, "page", this.page);
		switch (state) {
			case "show": this.animateShow(); break;
			case "next": this.animateNext(); break;
			case "prev": this.animatePrev(); break;
			default: return;
		}
		this._state = state;
		return this;
	},
	
	depth: function (depth) {
		if (depth == undefined)
			return this.$fakepage.css("z-index");
		//console.log("set depth", depth, "page", this.page);
		this.$fakepage.css("z-index", depth);
		return this;
	},
	
	// Animate from state of being Prev to Shown
	animateShow: function () {
		if (this.layout == "left") {
			this.$fakepage.animate({
				left: "0%",
				width: "50%"
			}, 1000);
		}
		else if (this.layout == "right") {
			this.$fakepage.animate({
				left: "50%",
				width: "50%"
			}, 1000);
		}
	},
	
	animateNext: function () {
		if (this.layout == "left") {
			this.$fakepage.animate({
				left: "50%",
				width: "0%"
			}, 1000);
		}
		else if (this.layout == "right") {
			this.$fakepage.animate({
				left: "50%",
				width: "50%"
			}, 1000);
		}
	},
	animatePrev: function () {
		if (this.layout == "left") {
			this.$fakepage.animate({
				left: "0%",
				width: "50%"
			}, 1000);
		}
		else if (this.layout == "right") {
			this.$fakepage.animate({
				left: "50%",
				width: "0%"
			}, 1000);
		}
	}
};

$(function () {
	var bookx = new book(document.getElementById("book"));
	var $prev = $("<a href='#'>Previous</a>").on("click", function () { bookx.previousPage(); });
	var $next = $("<a href='#'>Next</a>").on("click", function () { bookx.nextPage(); });
	$("body").prepend($next).prepend($prev);
});
