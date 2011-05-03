Bitmap.prototype.width = function() {
	return this.scaleX * this.image.width;
}
Bitmap.prototype.height = function() {
	return this.scaleY * this.image.height;
}
function Gallery(imgArr, canvasObj) {
	var _this = this;
	
	var _imgs = imgArr;
	var _canvas = canvasObj;
	var _stage = null;
	var _loaded = 0;
	var _length = 0;
	
	var _displayObjs = [];
	
	_this.xPadding = 3;
	_this.yPadding = 3;
	_this.hoverChange = 0.1;
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
		layout();
	}
	var fireImageLoad = function() {
		_loaded++;
		executeCallback(_this.onLoadProgress, {complete:_loaded, total:_length});
		if(_loaded == _length) {
			handleAllImagesComplete();
			executeCallback(_this.onLoadInit, {complete:_loaded, total:_length});
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
		alert("CLICK");
	}
	var handleBitmapOver = function(e) {
		this.scaleX += _this.hoverChange;
		this.scaleY += _this.hoverChange;
		layout();
	}
	var handleBitmapOut = function(e) {
		this.scaleX -= _this.hoverChange;
		this.scaleY -= _this.hoverChange;
		layout();
	}
	var layout = function() {
		var obj;
		var w = _canvas.width;
		var h = _canvas.height;
		var maxX = 0, maxY = 0, curX = 0, curY = 0;
		
		var rowHeight = 0;
		
		for(var i=0; i<_displayObjs.length; i++) {
			obj = _displayObjs[i];
			if(!obj) continue;
			
			if(curX + obj.width() > w) {
				curX = 0;
				curY += (rowHeight + _this.yPadding);
				
				rowHeight = 0;
			}
			
			obj.x = curX;
			obj.y = curY;
			
			rowHeight = (obj.height() > rowHeight) ? obj.height() : rowHeight;
			maxX = (obj.width() + obj.x > maxX) ? obj.width() + obj.x : maxX;
			maxY = (obj.height() + obj.y > maxY) ? obj.height() + obj.y : maxY;
			curX += obj.width() + _this.xPadding;
		}
		executeCallback(_this.onLayoutComplete, {width:maxX, height:maxY});
		_stage.update();
	}
	var sizeImage = function(bmp, size) {
		var w = size;
		var h = size;
		var imgObj = bmp.image;
		if(_this.maintainAspectRatio) {
			h = (w/imgObj.width) * imgObj.height;
		}
		bmp.scaleX = w/imgObj.width;
		bmp.scaleY = h/imgObj.height;
		
		
		console.log("sizeIMage w "+imgObj.width+" h "+imgObj.height);
	}
	var executeCallback = function(fn, args) {
		if(fn && typeof(fn) == "function") {
			fn(_this, args);
		}
	}
	
}