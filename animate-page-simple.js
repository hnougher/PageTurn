/**
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

Page.prototype.animateShow = function (side) {
	this.depth('top');
	this.show(side);
	this.$page.css({left:"0px", top:"0px", width:"100%"}).transform({scaleX:0.1});
	switch (side) {
	case "left":
		this.$page.transform({skewY:"90deg", origin:["right","bottom"]});
		break;
	case "right":
		this.$page.transform({skewY:"-90deg", origin:["left","bottom"]});
		break;
	}
	this.$page.animate({scaleX:1, skewY:"0deg"},
	{duration: 1000, easing: "easeOutExpo", complete: this._doBookUpdate});
};

Page.prototype.animateHide = function (side) {
	var self = this;
	this.depth('bot');
	this.$page.css({left:"0%", width: "100%"}).transform({scaleX:1, skewY:"0deg"});
	switch (side) {
	case "left":
		this.$page.transform({origin:["right","bottom"]});
		this.$page.animate({scaleX:0, skewY:"90deg"},
			{duration: 1000, easing: "easeInExpo",
			complete: function () {
				self.hide();
				self._doBookUpdate();
			}});
		break;
	case "right":
		this.$page.transform({origin:["left","bottom"]});
		this.$page.animate({scaleX:0, skewY:"-90deg"},
			{duration: 1000, easing: "easeInExpo",
			complete: function () {
				self.hide();
				self._doBookUpdate();
			}});
		break;
	}
};