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
	
	_this.getTweensByObject = function(obj) {
		var arr = [];
		var len = _objs.length;
		for(var i=0; i<len; i++) {
			if(_objs[i].object == obj) arr.push(_objs[i]);
		}
		return arr;
	}
	_this.getTweenByObject = function(obj) {
		return _this.getTweensByObject[0];
	}
	
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
		if(tweenObj.step > 0) {
			_objs.push(tweenObj);
		}
	}
	_this.tick = function(e) {
		var len = _objs.length;
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
			Utils.executeCallback(_this, _this.onMotionFinish, null);
			_this.stop();
		} else {
			Utils.executeCallback(_this, _this.onMotionChange, null);
		}
		if(TweenGroup.stage && typeof(TweenGroup.stage == "function") && typeof(TweenGroup.stage.update) == "function") {
			TweenGroup.stage.update();
		}
	}
	_this.start = function() {
		Ticker.addListener(_this);
		Ticker.setInterval((_time*1000)/_fps);
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
	var _thumbHolder = null;
	
	_this.xPadding = 3;
	_this.yPadding = 3;
	_this.thumbnailSize = 150;
	_this.maintainAspectRatio = true;
	
	_this.onLoadProgress = null;
	_this.onLoadInit = null;
	_this.onLayoutComplete = null;
	
	_this.init = function() {
		if(typeof(Stage) != "function") throw "Requires EaselJS!";
		_thumbHolder = new Container();
		_stage = new Stage(_canvas);
		_stage.mouseEnabled = true;
		_stage.enableMouseOver();
		_stage.addChild(_thumbHolder);
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
		_thumbHolder.addChild(bmp);
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
		e.preventDefault();
		return false;
	}
	var closePopUp = function(bmp) {
		_isAnimating = true;
		var tween = new TweenGroup(0.5, 30);
		tween.add(bmp, "x", bmp.x, _canvas.width);
		tween.add(_thumbHolder, "x", -_canvas.width, 0);
		tween.onMotionFinish = function(e) {
			_isAnimating = false;
			_stage.removeChild(_currentImage);
			_currentImage = null;
			layout();
		}
		tween.start();
	}
	var popUp = function(bmp) {
		_isAnimating = true;
		
		var obj = bmp.clone();
		obj.onClick = handleBitmapClick;
		obj.x = _canvas.width;
		obj.y = 0;
		
		sizeImage(obj, _canvas.width);
		
		var tween = new TweenGroup(0.5, 30);
		tween.add(_thumbHolder, "x", 0, -_canvas.width);
		tween.add(obj, "x", obj.x, 0);
		tween.onMotionFinish = function(e) {
			_isAnimating = false;
			_currentImage = obj;
			Utils.executeCallback(_this, _this.onLayoutComplete, {width:obj.width(), height:obj.height()});
		}
		_stage.addChild(obj);
		tween.start();
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