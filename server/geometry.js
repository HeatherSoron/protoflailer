function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

Point.prototype.normalize = function() {
	var length = this.length();
	return new Point(this.x/length, this.y/length);
}

Point.prototype.length = function() {
	return Math.sqrt(this.lenSqrd());
}

Point.prototype.lenSqrd = function() {
	return (this.x * this.x) + (this.y * this.y);
}

Point.prototype.isZero = function() {
	return !(this.x || this.y);
}

Point.prototype.scaleBy = function(mult) {
	this.x *= mult;
	this.y *= mult;
	return this;
}

Point.prototype.times = function(mult) {
	return new Point(this.x * mult, this.y * mult);
}

Point.prototype.toRect = function(width, height, centered) {
	var left = this.x;
	var top = this.y;
	if (centered) {
		left -= width / 2.0;
		top -= height / 2.0;
	}
	return new Rectangle(left, top, width, height);
}


Point.prototype.offsetBy = function(other) {
	this.x += other.x;
	this.y += other.y;
	return this;
}

Point.prototype.plus = function(other) {
	return this.clone().offsetBy(other);
}

Point.prototype.minus = function(other) {
	return this.clone().offsetBy(other.times(-1));
}

Point.prototype.clone = function() {
	return new Point(this.x, this.y);
}

Point.prototype.clampTo = function(rect) {
	var offset = new Point();
	if (this.x < rect.left) {
		offset.x = rect.left - this.x;
		this.x = rect.left;
	} else if (this.x > rect.left + rect.width) {
		offset.x = this.x - (rect.left + rect.width);
		this.x = rect.left + rect.width;
	}

	if (this.y < rect.top) {
		offset.y = rect.top - this.y;
		this.y = rect.top;
	} else if (this.y > rect.top + rect.height) {
		offset.y = this.y - (rect.top + rect.height);
		this.y = rect.top + rect.height;
	}
	return offset;
}




function Rectangle(left, top, width, height) {
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	
	Object.defineProperty(this, 'right', {
		get: function() {
			return this.left + this.width;
		}
	});
	
	Object.defineProperty(this, 'bottom', {
		get: function() {
			return this.top + this.height;
		}
	});
}

Rectangle.prototype.intersects = function(other) {
	return (
		this.left < other.right && this.right > other.left
	&&
		this.top < other.bottom && this.bottom > other.top
	);
}

Rectangle.prototype.clone = function() {
	return new Rectangle(this.left, this.top, this.width, this.height);
}

Rectangle.prototype.shrink = function(left, top, width, height) {
	return new Rectangle(this.left + left, this.top + top, this.width - (left + width), this.height - (top + height));
}


module.exports.Point = Point;
module.exports.Rectangle = Rectangle;
