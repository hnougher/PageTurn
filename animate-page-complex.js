
var Point = function (X, Y) {
	this._X = X;
	this._Y = Y;
};
Point.prototype = {
	X: function () { return this._X; },
	Y: function () { return this._Y; },
	distTo: function (P) {
		return Math.sqrt(Math.pow(this._X - P.X(), 2) + Math.pow(this._Y - P.Y(), 2));
	},
	lineTo: function (P) {
		var vy = this._Y - P.Y();
		var vx = this._X - P.X();
		var m = (vx == 0 ? vy : vy / vx);
		var l = new Line(m, 0);
		return l.parrallelAt(P);
	},
	_toString: function () {
		return "P[" + this._X + "," + this._Y + "]";
	}
};

Number.MAX_INT = 9007199254740992;
Number.MIN_INT = -9007199254740992;
var Line = function (A, B) {
	this._A = A;
	this._B = B;
};
Line.prototype = {
	A: function () { return this._A; },
	B: function () { return this._B; },
	// X = (Y - B) / A
	X: function (Y) { return (Y - this._B) / this._A; },
	// Y = AX + B
	Y: function (X) { return this._A * X + this._B; },
	
	perpendicularLine: function () {
		if (this._A == 0)
			return new Line(Number.MIN_INT, 0);
		return new Line(-1/this._A, 0);
	},
	perpendicularAtX: function (X) {
		return this.perpendicularLine().parrallelAt(new Point(X, this.Y(X)));
	},
	parrallelAt: function (P) {
		// y - y() = a(x - X)
		// Y = AX - AX1 + Y1
		// B = Y1 - AX1
		var newB = P.Y() - this._A * P.X();
		return new Line(this._A, newB);
	},
	_toString: function () {
		return "L[Y=" + this._A + "X+" + this._B + "]";
	}
};


Book.prototype.bookInit = function () {
	this.navigateTo(0);
	
	// Add event listeners to page for picking up interaction
	var self = this;
	var $window = $(window);
	$window.on("mousemove", function(e){return self.mousemove(e)});
	$window.on("mousedown", function(e){return self.mousedown(e)});
	$window.on("mouseup", function(e){return self.mouseup(e)});
};
(function(){//NS
	var curDragStart = false;
	var animatedHide = null;
	var animatedShow = null;
	var isGoRight = false;
	Book.prototype.mousemove = function (e) {
		if (curDragStart) {
			var pageOffset = animatedHide.$fakepage.offset();
			var bookMouse = new Point(e.clientX - pageOffset.left, e.clientY - pageOffset.top);
			animatedHide.calcTransform(curDragStart, bookMouse, true);
			animatedShow.calcTransform(curDragStart, bookMouse, false);
		}
		
		/*var bookOffset = this.$book.offset();
		var bookSize = new Point(this.$book.width(), this.$book.height());
		var o = new Point(0, 0);
		var tl = new Point(e.clientX - bookOffset.left, e.clientY - bookOffset.top);
		var br = new Point(tl.X() - this.$book.width(), tl.Y() - this.$book.height());
		var tr = new Point(br.X(), tl.Y());
		var bl = new Point(tl.X(), br.Y());
		
		if (tl.distTo(o) < 5 || tr.distTo(o) < 5 || bl.distTo(o) < 5 || br.distTo(o) < 5) {
			//console.log(tl, br, tr.distTo(o), bl.distTo(o));
			this.$book.css("backgroundImage", "url(page_corner2.gif)");
		} else {
			this.$book.css("backgroundImage", "");
		}*/
		return false;
	};
	Book.prototype.mousedown = function (e) {
		isGoRight = (this.$book.offset().left + this.$book.width() / 2 > e.clientX);
		//console.log(isGoRight, this.currentPage.pageNumber, this.AllPages.length);
		
		// Validate page turn
		if ((isGoRight && this.currentPage.pageNumber <= 0) ||
			(!isGoRight && this.currentPage.pageNumber >= this.AllPages.length - 1)) {
			console && console.warn("Page turn is not allowed");
			return;
		}
		
		var prevPP = this.getPagePair(this.currentPage.pageNumber - 1);
		var nextPP = this.getPagePair(this.currentPage.pageNumber + 1);
		
		var underPage = (isGoRight ? prevPP.pages.left : nextPP.pages.right);
		if (underPage) {
			underPage.show(isGoRight ? "left" : "right");
			underPage.depth(5);
		}
		
		animatedShow = (isGoRight ? prevPP.pages.right : nextPP.pages.left);
		animatedShow.show(!isGoRight ? "right" : "left");
		animatedShow.depth(7);
		animatedShow.$page.addClass("showing");
		animatedShow.preDrag(!isGoRight ? "right" : "left");
		
		animatedHide = (isGoRight ? this.currentPage.pages.left : this.currentPage.pages.right);
		animatedHide.depth(6);
		animatedHide.$page.addClass("hiding");
		animatedHide.preDrag(!isGoRight ? "right" : "left");
		
		// Add gradient
		animatedShow.$gradient = animatedShow.getGradElement("white", "transparent");
		animatedShow.$page.append(animatedShow.$gradient);
		//animatedHide.$gradient = animatedHide.getGradElement("black", "transparent");
		//animatedHide.$page.append(animatedHide.$gradient);
		
		var pageOffset = animatedHide.$fakepage.offset();
		curDragStart = new Point((isGoRight ? 0 : animatedHide.$fakepage.width()), e.clientY - pageOffset.top);
		this.$book.addClass("book-turning");
		this.mousemove(e);
		return false;
	};
	Book.prototype.mouseup = function (e) {
		// Are we really turning?
		if (!curDragStart) return; //NO
		
		var prevPP = this.getPagePair(this.currentPage.pageNumber - 1);
		var nextPP = this.getPagePair(this.currentPage.pageNumber + 1);
		
		// Decide what side we are continuing to
		var bookOffset = this.$book.offset();
		if (e.clientX - bookOffset.left > this.$book.width() / 2) {
			// Finishing right
			console.warn("right");
			if (isGoRight) {
				var pageOffset = animatedHide.$fakepage.offset();
				var bookMouse = new Point(e.clientX - pageOffset.left, e.clientY - pageOffset.top);
				
				// Page turned back
				//this.currentPage.pages.left && this.currentPage.pages.left.delayHide("left");
			//this.currentPage.pages.left && this.currentPage.pages.left.finishHide("left", curDragStart, bookMouse);
				this.currentPage.pages.left && this.currentPage.pages.left.finishMovement("right", curDragStart, bookMouse, true);
				this.currentPage.pages.right && this.currentPage.pages.right.delayHide("right");
				this.currentPage = prevPP;
				this.currentPage.pages.left && this.currentPage.pages.left.show("left");
				//this.currentPage.pages.right && this.currentPage.pages.right.show("right");
				/*this.previousPage();*/
				this.currentPage.pages.right && this.currentPage.pages.right.finishMovement("right", curDragStart, bookMouse, false);
			}
			else {
				// Page not changed forward
				nextPP.pages.left && nextPP.pages.left.hide("left");
				nextPP.pages.right && nextPP.pages.right.hide("right");
				this.currentPage.pages.left && this.currentPage.pages.left.show("left");
				this.currentPage.pages.right && this.currentPage.pages.right.show("right");
				
				// Cleanup
				// ############## TEMP #################
				animatedShow.$gradient.remove();
				//animatedHide.$gradient.remove();
				if (isGoRight) {
					animatedHide.postDrag("right");
					animatedShow.postDrag("right");
				}
				else {
					animatedHide.postDrag("left");
					animatedShow.postDrag("left");
				}
				animatedHide.$page.removeClass("hiding");
				animatedShow.$page.removeClass("showing");
				animatedHide.depth(5);
				animatedShow.depth(5);
				// ############## ETEMP #################
			}
		}
		else {
			// Finishing left
			console.warn("left");
			if (isGoRight) {
				// Page not changed back
				prevPP.pages.left && prevPP.pages.left.hide("left");
				prevPP.pages.right && prevPP.pages.right.hide("right");
				this.currentPage.pages.left && this.currentPage.pages.left.show("left");
				this.currentPage.pages.right && this.currentPage.pages.right.show("right");
				
				// Cleanup
				// ############## TEMP #################
				animatedShow.$gradient.remove();
				//animatedHide.$gradient.remove();
				if (isGoRight) {
					animatedHide.postDrag("right");
					animatedShow.postDrag("right");
				}
				else {
					animatedHide.postDrag("left");
					animatedShow.postDrag("left");
				}
				animatedHide.$page.removeClass("hiding");
				animatedShow.$page.removeClass("showing");
				animatedHide.depth(5);
				animatedShow.depth(5);
				// ############## ETEMP #################
			}
			else {
				var pageOffset = animatedHide.$fakepage.offset();
				var bookMouse = new Point(e.clientX - pageOffset.left, e.clientY - pageOffset.top);
				
				// Page turned forward
				this.currentPage.pages.left && this.currentPage.pages.left.delayHide("left");
				//this.currentPage.pages.right && this.currentPage.pages.right.delayHide("right");
			//this.currentPage.pages.right && this.currentPage.pages.right.finishHide("right", curDragStart, bookMouse);
				this.currentPage.pages.right && this.currentPage.pages.right.finishMovement("left", curDragStart, bookMouse, true);
				this.currentPage = nextPP;
				//this.currentPage.pages.left && this.currentPage.pages.left.show("left");
				this.currentPage.pages.right && this.currentPage.pages.right.show("right");
				/*this.nextPage();*/
				/*this.currentPage.pages.left && this.currentPage.pages.left.animateHide("left");
				this.currentPage.pages.right && this.currentPage.pages.right.animateHide("right");
				this.currentPage = nextPP;
				this.currentPage.pages.left && this.currentPage.pages.left.animateShow("left");
				this.currentPage.pages.right && this.currentPage.pages.right.animateShow("right");*/
				this.currentPage.pages.left && this.currentPage.pages.left.finishMovement("left", curDragStart, bookMouse, false);
			}
		}
		
		curDragStart = false;
		animatedHide = null;
		animatedShow = null;
		this.$book.removeClass("book-turning");
		return false;
	};
})()//End-NS

Book.prototype.doUpdate = function () {
	if (this.aimForPage.pageNumber < this.goingToPage.pageNumber) {
		// We are starting
		this.aimForPage.startShow("previous");
		this.goingToPage.startHide("previous");
		this.goingToPage = this.aimForPage;
		// We are continuing
		this.goingToPage.finishShow("previous");
		this.currentPage.finishHide("previous");
		this.currentPage = this.goingToPage;
	}
	else if (this.aimForPage.pageNumber > this.goingToPage.pageNumber) {
		// We are starting
		this.aimForPage.startShow("next");
		this.goingToPage.startHide("next");
		this.goingToPage = this.aimForPage;
		// We are continuing
		this.goingToPage.finishShow("next");
		this.currentPage.finishHide("next");
		this.currentPage = this.goingToPage;
	}
};


Page.prototype.prepairPage = function () {
	// Add extra layers for masking in animation
	this.$fakepage = $("<div class='fakepage'>");
	this.$clippage = $("<div class='clippage'>");
	this.$page.before(this.$fakepage);
	this.$fakepage.append(this.$clippage);
	this.$clippage.append(this.$page);
};

Page.prototype.depth2 = Page.prototype.depth;
Page.prototype.depth = function (depth) {
	if (typeof this.book.pageDepthStack == "undefined")
		this.book.pageDepthStack = [];
	
	/* In this animate style there is 3 depths given: {5,6,7}
	5 = normal page
	6 = page being hiden via mask
	7 = page being shown via mask
	When something is set to 5 we need to remove the page from pageDepthStack.
	Depth 6 pages get placed at bottom of pageDepthStack.
	Depth 7 pages get placed at top of pageDepthStack. */
	switch (depth) {
	case 6:
		this.book.pageDepthStack.unshift(this);
		break;
	case 7:
		this.book.pageDepthStack.push(this);
		break;
	case 5:
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
};

Page.prototype.delayHide = function (side) {
	var self = this;
	window.setTimeout(function(){self.hide()}, 2000);
};

Page.prototype.finishMovement = function (side, startPoint, fromPullPoint, isHiding) {
	var self = this;
	switch (side) {
	case "left":
		var distOffsetX = this.$fakepage.width() - fromPullPoint.X();
		var distToMove = this.$fakepage.width()*2 - distOffsetX;
		var distOffsetY = fromPullPoint.Y() - startPoint.Y();
		console.log(startPoint._toString(), fromPullPoint._toString(), distOffsetX, distOffsetY, self.$fakepage.css("fake"));
		
		this.$fakepage.animate({fake:distToMove},
		{duration: 2000,
		step: function (now, fx) {
			var xPoint = self.$fakepage.width() - distOffsetX - now;
			var yLift = startPoint.Y() + distOffsetY * (1- now / distToMove);
			//console.debug(now, distToMove, (now / distToMove));
			//console.warn("step(%s) => yLift:%s, xPoint:%s, distOffsetX:%s", now, yLift, xPoint, distOffsetX);
			self.calcTransform(startPoint, new Point(xPoint, yLift), isHiding);
		},
		complete: function () {
			self.$fakepage.css({fake:0, left:"0%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
			if (isHiding)
				self.hide(side);
		}});
		break;
	case "right":
		var distOffsetX = fromPullPoint.X();
		var distToMove = this.$fakepage.width()*2 - distOffsetX;
		var distOffsetY = fromPullPoint.Y() - startPoint.Y();
		console.log(startPoint._toString(), fromPullPoint._toString(), distOffsetX, distOffsetY, self.$fakepage.css("fake"));
		
		this.$fakepage.animate({fake:distToMove},
		{duration: 2000,
		step: function (now, fx) {
			var xPoint = distOffsetX + now;
			var yLift = startPoint.Y() + distOffsetY * (1- now / distToMove);
			//console.debug(now, distToMove, (now / distToMove), xPoint, yLift);
			self.calcTransform(startPoint, new Point(xPoint, yLift), isHiding);
		},
		complete: function () {
			self.$fakepage.css({fake:0, left:"50%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
			if (isHiding)
				self.hide(side);
		}});
	}
	this.$fakepage.show();
};

Page.prototype.animateShow = function (side) {
	var self = this;
	this.depth(7);
	this.$page.addClass("showing");
	
	// Add gradient
	this.$gradient = this.getGradElement("white", "transparent");
	this.$page.append(this.$gradient);
	
	this.$fakepage.show();
	switch (side) {
	case "left":
		this.$fakepage.css({left:"50%", width:"50%"}).transform({scaleX:1, skewY:"0deg"});
		this.preDrag("right");
		
		this.$fakepage.animate({fake:this.$fakepage.width()*2},
		{duration: 2000,
		step: function (now, fx) {
			now = self.$fakepage.width() - now;
			var yLift = Math.sin((now + self.$fakepage.width()) / self.$fakepage.width() / 2 * Math.PI) * -40;
			self.calcTransform(new Point(self.$fakepage.width(), 0), new Point(now, yLift), false);
		},
		complete: function () {
			self.$fakepage.css({fake:0, left:"0%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
		}});
		break;
	case "right":
		this.$fakepage.css({fake:0, left:"0%", width:"50%"}).transform({scaleX:1, skewY:"0deg"});
		this.preDrag("left");
		
		this.$fakepage.animate({fake:this.$fakepage.width()*2},
		{duration: 2000,
		step: function (now, fx) {
			var yLift = Math.sin(now / self.$fakepage.width() / 2 * Math.PI) * -40;
			self.calcTransform(new Point(0, 0), new Point(now, yLift), false);
		},
		complete: function () {
			self.$fakepage.css({fake:0, left:"50%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
		}});
		break;
	}
};

Page.prototype.animateHide = function (side) {
	var self = this;
	this.depth(6);
	this.$page.addClass("hiding");
	
	// Add gradient
	this.$gradient = this.getGradElement("black", "transparent");
	this.$page.append(this.$gradient);
	
	this.$fakepage.transform({scaleX:1, skewY:"0deg"});
	switch (side) {
	case "left":
		this.$fakepage.css({left:"0%", width:"50%"});
		this.preDrag(side);
		
		this.$fakepage.animate({fake:this.$fakepage.width()*2},
		{duration: 2000,
		step: function (now, fx) {
			var yLift = Math.sin(now / self.$fakepage.width() / 2 * Math.PI) * -40;
			self.calcTransform(new Point(0, 0), new Point(now, yLift), true);
		},
		complete: function () {
			self.hide();
			self.$fakepage.css({fake:0, left:"50%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
		}});
		break;
	case "right":
		this.$fakepage.css({left:"50%", width:"50%"});
		this.preDrag(side);
		
		this.$fakepage.animate({fake:this.$fakepage.width()*2},
		{duration: 2000,
		step: function (now, fx) {
			now = self.$fakepage.width() - now;
			var yLift = Math.sin((now + self.$fakepage.width()) / self.$fakepage.width() / 2 * Math.PI) * -40;
			self.calcTransform(new Point(self.$fakepage.width(), 0), new Point(now, yLift), true);
		},
		complete: function () {
			self.hide();
			self.$fakepage.css({fake:0, left:"0%", width:"50%"});
			self.$gradient.remove();
			self.postDrag(side);
			self._doBookUpdate();
		}});
		break;
	}
};

Page.prototype.preDrag = function (side) {
	this.$clippage.css({top:"-50%", height:"200%", width:"200%"});
	this.$page.css({top:"25%", height:"50%", width:"50%"});
	switch (side) {
	case "left":
		this.$clippage.css({left:"0%"});
		this.$page.css({left:"0%"});
		break;
	case "right":
		this.$clippage.css({left:"-100%"});
		this.$page.css({left:"50%"});
		break;
	}
};
Page.prototype.postDrag = function (side) {
	this.$clippage.css({top:"0%", left:"0%", height:"100%", width:"100%"})
		.transform({translate:[0,0],rotate:0});
	this.$page.css({top:"0%", left:"0%", height:"100%", width:"100%"})
		.transform({translate:[0,0],rotate:0})
		.removeClass("showing").removeClass("hiding");
};

Page.prototype.calcTransform = function calcTransform(startPoint, pullPoint, isHiding) {
	function restrictFromTo(from, value, to) {
		return Math.min(Math.max(from,value),to);
	}
	function TOA(opposite, adjacent) {
		return Math.atan(opposite / adjacent);
	}
	
	// Work out if we are going left or right
	var isGoRight = (startPoint.X() <= 0);
	
	var boxSize = new Point(this.$fakepage.width(), this.$fakepage.height());
	var layerX = (isGoRight
		? Math.max(pullPoint.X(), 1)
		: Math.min(pullPoint.X(), boxSize.X() - 1));
	var layerY = pullPoint.Y();
	pullPoint = new Point(layerX, layerY);
	
	// Line from startPoint to pullPoint
	var lineToPull = startPoint.lineTo(pullPoint);
	var perpToPull = (isGoRight
		? lineToPull.perpendicularAtX(startPoint.X() + pullPoint.X() / 2)
		: lineToPull.perpendicularAtX(startPoint.X() - (startPoint.X() - pullPoint.X()) / 2));
	
	// Restrict bottom middle corner
	if (isGoRight ? (perpToPull.X(boxSize.Y()) > boxSize.X()) : (perpToPull.X(boxSize.Y()) < 0)) {
		perpToPull = perpToPull.parrallelAt(isGoRight ? boxSize : new Point(0, boxSize.Y()));
	}
	//console.log("1", isHiding, startPoint._toString(), pullPoint._toString(), lineToPull._toString(), perpToPull._toString());
	
	// Calc $clippage
	var r2 = TOA(perpToPull.X(0), perpToPull.Y(0)).toFixed(10),
		ox2 = (isGoRight ? 0 : 100),
		oy2, x2, y2;
	var r2LTZero = (r2 < 0);
	if (isGoRight) {
		if (r2LTZero) {
			oy2 = 75;
			x2 = restrictFromTo(0, perpToPull.X(boxSize.Y()), boxSize.X());
			y2 = restrictFromTo(0, perpToPull.Y(0) - boxSize.Y(), boxSize.Y());
		} else {
			oy2 = 25;
			x2 = restrictFromTo(0, perpToPull.X(0), boxSize.X());
			y2 = 0;
		}
	} else {
		if (r2LTZero) {
			oy2 = 25;
			x2 = restrictFromTo(-boxSize.X(), perpToPull.X(0) - boxSize.X(), 0);
			y2 = 0;
		} else {
			oy2 = 75;
			x2 = restrictFromTo(-boxSize.X(), perpToPull.X(boxSize.Y()) - boxSize.X(), 0);
			y2 = restrictFromTo(0, perpToPull.Y(boxSize.X()) - boxSize.Y(), boxSize.Y());
		}
	}
	//console.log("2", isHiding, x2, y2, ox2, oy2);
	
	// Calc $page
	var ox3 = ox2,
		oy3 = ((isGoRight && !r2LTZero) || (!isGoRight && r2LTZero) ? 0 : 100),
		y3 = -y2,
		r3, x3;
	if (isHiding) {
		r3 = -r2;
		x3 = -x2;
	} else {
		r3 = r2;
		x3 = x2 + (isGoRight ? -boxSize.X() : boxSize.X());
	}
	//console.log("3", isHiding, x3, y3, ox3, oy3);
	
	this.$clippage.transform({origin:[ox2 + "%", oy2 + "%"], translate:[x2 + "px", y2 + "px"], rotate:r2 + "rad"}, {forceMatrix:true});
	this.$page.transform({rotate:r3 + "rad", origin:[ox3 + "%", oy3 + "%"], translate:[x3 + "px", y3 + "px"]}, {forceMatrix:true});
	
	// Calc $gradient if exists
	if (this.$gradient) {
		var h4 = boxSize.Y() * 2,
			w4 = boxSize.X(),
			r4 = -r3,
			ox4 = 0,
			oy4 = ((isGoRight && !r2LTZero) || (!isGoRight && r2LTZero) ? 25 : 75),
			y4 = y2 - 0.25 * h4 + this.$page.scrollTop(),
			sx4, x4, o4;
		if (isGoRight) {
			sx4 = startPoint.distTo(pullPoint) / (boxSize.X() * 2);
			x4 = -x3 + this.$page.scrollLeft();
		}
		else {
			sx4 = -startPoint.distTo(pullPoint) / (boxSize.X() * 2);
			x4 = boxSize.X() - x3 + this.$page.scrollLeft();
		}
		o4 = 1 - Math.abs(sx4);
		
		this.$gradient.css({top:0, left:0, width:w4+"px", height:h4+"px", opacity:o4})
			.transform({origin:[ox4 + "%", oy4 + "%"], translate:[x4 + "px", y4 + "px"], rotate:r4 + "rad", scaleX: sx4}, {forceMatrix:true});
	}
};

// Returns an element which contains a gradient from color to color2.
// Color can be any valid CSS color which has a grad_<color>_<color2>.png in the src folder.
// Though dependinbg on browser capabilities it could be drawn on the fly.
Page.prototype.getGradElement = function (color, color2) {
	return $('<img style="position:absolute;height:1px;width:255px" src="grad_' + color + '_' + color2 + '.png"/>');
};
