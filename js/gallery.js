Bitmap.prototype.width = function() {
	return this.scaleX * this.image.width;
}
Bitmap.prototype.height = function() {
	return this.scaleY * this.image.height;
}
Bitmap.prototype.setWidth = function(w) {
	this.scaleX = w/this.image.width;
}
Bitmap.prototype.setHeight = function(h) {
	this.scaleY = h/this.image.height;
}
Utils = {};
Utils.executeCallback = function(scopeObj, fn, args) {
	if(fn && typeof(fn) == "function") {
		fn(scopeObj, args);
	}
}
TweenGroup.stage = {};
function TweenGroup(timeInSeconds, fpsValue) {
	var _objs = [];
	var _this = this;
	
	var _time = timeInSeconds;
	var _fps = fpsValue;
	var _count = _fps * _time;
	
	_this.onMotionChange = null;
	_this.onMotionFinish = null;
	
	_this.add = function(obj, prop, startValue, endValue) {
		var tweenObj = {
			object:obj,
			property:prop,
			begin:startValue,
			end: endValue,
			step:0,
			steps:_count
		}
		var stepValue = Math.abs((tweenObj.end - tweenObj.begin)/_count);
		tweenObj.step = stepValue;
		_objs[_objs.length] = tweenObj;
	}
	_this.tick = function(e) {
		var len = _objs.len;
		var obj;
		var isComplete = false;
		var i = 0;
		for(i=0; i<len; i++) {
			var obj = _objs[i];
			if(obj.end > obj.begin) {
				obj.object[obj.property] += obj.step;
				if(obj.object[obj.property] >= obj.end) {
					isComplete = true;
					break;
				}
			} else {
				obj.object[obj.property] -= obj.step;
				if(obj.object[obj.property] <= obj.end) {
					isComplete = true;
					break;
				}
			}
		}
		if(isComplete) {
			for(i=0; i<len; i++) {
				var obj = _objs[i];
				obj.object[obj.property] = obj.end;
			}
			Utils.executeCallback(_this, _this.onMotionFinish, _event);
			_this.stop();
		} else {
			Utils.executeCallback(_this, _this.onMotionChange, _event);
		}
		if(TweenGroup.stage && typeof(Tween.stage == "function") && typeof(TweenGroup.stage.update) == "function") {
			TweenGroup.stage.update();
		}
	}
	_this.start = function() {
		Ticker.addListener(_this);
		Ticker.setInterval((_times*1000)/_fps);
	}
	_this.stop = function() {
		Ticker.removeListener(_this);
	}
}
function Gallery(imgArr, canvasObj) {
	var _this = this;
	
	var _imgs = imgArr;
	var _canvas = canvasObj;
	var _stage = null;
	var _loaded = 0;
	var _length = 0;
	var _isAnimating = false;
	var _currentImage = null;
	var _displayObjs = [];
	
	_this.xPadding = 3;
	_this.yPadding = 3;
	_this.thumbnailSize = 150;
	_this.maintainAspectRatio = true;
	
	_this.onLoadProgress = null;
	_this.onLoadInit = null;
	_this.onLayoutComplete = null;
	
	_this.init = function() {
		if(typeof(Stage) != "function") throw "Requires EaselJS!";
		
		_stage = new Stage(_canvas);
		_stage.mouseEnabled = true;
		_stage.enableMouseOver();
		TweenGroup.stage = _stage;
		_loaded = 0;
		_length = _imgs.length;
		
		for(var i=0; i<_length; i++) {
			var img = new Image();
			img.galleryId = i;
			img.onload = function(e){
				handleImageLoad(e);
			}
			img.onerror = function(e) {
				fireImageLoad();
			}
			img.src = _imgs[i];
		}
	}
	_this.update = function() {
		return layout();
	}
	var fireImageLoad = function() {
		_loaded++;
		Utils.executeCallback(_this, _this.onLoadProgress, {complete:_loaded, total:_length});
		if(_loaded == _length) {
			handleAllImagesComplete();
			Utils.executeCallback(_this, _this.onLoadInit, {complete:_loaded, total:_length});
		} else {
			_stage.update();
		}	
	}
	var handleImageLoad = function(e) {	
		var image = e.target;
		var bmp = new Bitmap(image);
		bmp.mouseEnabled = true;
		bmp.onClick = handleBitmapClick;
		bmp.onMouseOver = handleBitmapOver;
		bmp.onMouseOut = handleBitmapOut;
		
		sizeImage(bmp, _this.thumbnailSize);
		_displayObjs[image.galleryId] = bmp;
		_stage.addChild(bmp);
		fireImageLoad();
	}
	var handleAllImagesComplete = function() {
		_this.update();
	}
	var handleBitmapClick = function(e) {
		if(_isAnimating || (_currentImage && this != _currentImage)) return;
		
		if(_currentImage && this == _currentImage) {
			closePopUp(this);
		} else {
			popUp(this);
		}
	}
	var closePopUp = function(bmp) {
		_isAnimating = true;
		var tween = new TweenGroup(0.5, 30);
		tween.add(bmp, "x", bmp.x, bmp.oldSize.x);
		tween.add(bmp, "y", bmp.y, bmp.oldSize.y);
		tween.add(bmp, "heightCounter", bmp.height(), bmp.oldSize.height);
		tween.add(bmp, "widthCounter", bmp.width(), bmp.oldSize.width);
		var numComplete = 0;
		tween.onMotionChange = function(e) {
			bmp.setWidth(bmp.widthCounter);
			bmp.setHeight(bmp.heightCounter);
		}
		tween.onMotionFinish = function(e) {
			bmp.setWidth(bmp.bmp.oldSize.width);
			bmp.setHeight(bmp.oldSize.height);
			
			_isAnimating = false;
			_currentImage = null;
			layout();
		}
		tween.start();
	}
	var popUp = function(bmp) {
		_isAnimating = true;
		
		var w = _canvas.width;
		var h = _canvas.height;
		if(_this.maintainAspectRatio) {
			h = (w/bmp.image.width) * bmp.image.height;
		}
		_stage.removeChild(bmp);
		_stage.addChild(bmp);
		
		sizeImage(bmp, _this.thumbnailSize);
		
		bmp.oldSize = new Rectangle(bmp.x, bmp.y, bmp.width(), bmp.height());
		bmp.widthCounter = bmp.width();
		bmp.heightCounter = bmp.height();
		
		var tween = new TweenGroup(0.5, 30);
		tween.add(bmp, "x", bmp.x, 0);
		tween.add(bmp, "y", bmp.y, 0);
		tween.add(bmp, "heightCounter", bmp.heightCounter, h);
		tween.add(bmp, "widthCounter", bmp.widthCounter, w);

		tween.onMotionChange = function(e) {
			bmp.setWidth(bmp.widthCounter);
			bmp.setHeight(bmp.heightCounter);
		}
		tween.onMotionFinish = function(e) {
			bmp.setWidth(w);
			bmp.setHeight(h);
		
			_isAnimating = false;
			_currentImage = bmp;
			Utils.executeCallback(_this, _this.onLayoutComplete, {width:bmp.width(), height:bmp.height()});
		}
	}
	var handleBitmapOver = function(e) {
		if(_isAnimating) return;
	}
	var handleBitmapOut = function(e) {
		if(_isAnimating) return;
	}
	var layout = function() {
		if(_isAnimating) return false;
		var obj;
		var w = _canvas.width;
		var h = _canvas.height;
		var heightToUse = 0;
		var maxX = 0, maxY = 0, curX = 0, curY = 0;
		
		var rowHeight = 0;
		
		for(var i=0; i<_displayObjs.length; i++) {
			obj = _displayObjs[i];
			if(!obj) continue;
			
			heightToUse = obj.height();
			
			if(_currentImage && obj == _currentImage) {
				heightToUse = obj.oldSize.height;
			}
		
			if(curX + _this.thumbnailSize > w) {
				curX = 0;
				curY += (rowHeight + _this.yPadding);
				
				rowHeight = 0;
			}
			
			obj.x = curX;
			obj.y = curY;
			
			rowHeight = (heightToUse > rowHeight) ? heightToUse : rowHeight;
			maxX = (_this.thumbnailSize + obj.x > maxX) ? _this.thumbnailSize + obj.x : maxX;
			maxY = (heightToUse + obj.y > maxY) ? heightToUse + obj.y : maxY;
			curX += _this.thumbnailSize + _this.xPadding;
		}
		if(_currentImage) {
			_currentImage.oldSize.x = _currentImage.x;
			_currentImage.oldSize.y = _currentImage.y;
			_currentImage.x = 0;
			_currentImage.y = 0;
			sizeImage(_currentImage, w);
		}
		Utils.executeCallback(_this, _this.onLayoutComplete, {width:maxX, height:maxY});
		_stage.update();
		return true;
	}
	var sizeImage = function(bmp, size) {
		var w = size;
		var h = size;
		var imgObj = bmp.image;
		if(_this.maintainAspectRatio) {
			h = (w/imgObj.width) * imgObj.height;
		}
		bmp.setWidth(w);
		bmp.setHeight(h);	
	}
}