
Page.prototype.animateShow = function (side) {
	this.depth(6);
	this.$fakepage.show();
	switch (side) {
	case "left":
		this.$fakepage.css({left:"0%", width:"50%"}).transform({scaleX:0, skewY:"90deg", origin:["bottom","right"]});
		this.$fakepage.animate({scaleX:1, skewY:"0deg"},
		{duration: 1000, easing: "easeOutExpo", complete: this._doBookUpdate});
		break;
	case "right":
		this.$fakepage.css({left:"50%", width:"50%"}).transform({scaleX:0, skewY:"-90deg", origin:["bottom","left"]});
		this.$fakepage.animate({scaleX:1, skewY:"0deg"},
		{duration: 1000, easing: "easeOutExpo", complete: this._doBookUpdate});
		break;
	}
};

Page.prototype.animateHide = function (side) {
	var self = this;
	this.depth(6);
	this.$fakepage.css({width: "50%"}).transform({scaleX:1, skewY:"0deg"});
	switch (side) {
	case "left":
		this.$fakepage.css({left:"0%"}).transform({origin:["bottom","right"]});
		this.$fakepage.animate({scaleX:0, skewY:"90deg"},
			{duration: 1000, easing: "easeInExpo",
			complete: function () {
				self.hide();
				self._doBookUpdate();
			}});
		break;
	case "right":
		this.$fakepage.css({left:"50%"}).transform({origin:["bottom","left"]});
		this.$fakepage.animate({scaleX:0, skewY:"-90deg"},
			{duration: 1000, easing: "easeInExpo",
			complete: function () {
				self.hide();
				self._doBookUpdate();
			}});
		break;
	}
};