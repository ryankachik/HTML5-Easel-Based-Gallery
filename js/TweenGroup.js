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