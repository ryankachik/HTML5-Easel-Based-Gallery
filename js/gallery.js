function Gallery(imgArr, canvasObj) {
	var _this = this;
	
	var _imgs = imgArr;
	var _canvas = canvasObj;
	var _stage = null;
	var _loaded = 0;
	var _length = 0;
	
	
	_this.onLoadProgress = null;
	_this.onLoadInit = null;
	
	_this.init = function() {
		if(typeof(Stage) != "object") throw "Requires EaselJS!";
		
		_stage = new Stage(_canvas);
		_stage.mouseEnabled = true;
		
		_loaded = 0;
		_length = _imgs.length;
		
		for(var i=0; i<length; i++) {
			var img = new Image();
			var holder = new Container();
			holder.id = i;
			img.onLoad = handleImageLoad;
			img.src = _imgs[i];
		}
	}
	var handleImageLoad = function(e) {	
		_loaded++;
		executeCallback(_this.onLoadProgress, {complete:_loaded, total:_length});
		if(complete == loaded) {
			imgLoadComplete();
			executeCallback(_this.onLoadInit, {complete:_loaded, total:_length});
		}
			
	}
	var imgLoadComplete = function() {
	
	}
	var executeCallback = function(fn, args) {
		if(fn && typeof(fn) == "function") {
			fn(_this, args);
		}
	}
	
}