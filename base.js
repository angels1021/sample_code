var app = new (function(){
    var that = this,
        _prelogQueue = [],
        _logWaiting = true,
        _isMobile = function(){return _isDefined(window.device) && device.platform == "Android" || device.platform == "iOS";},
        _toString = Object.prototype.toString,
        _isString = function(toCheck){
            return typeof toCheck === "string";
        },
        _isNumeric = function(toCheck){
            return !isNaN(toCheck);
        },
        _isNumber = function(toCheck){
            return typeof toCheck === "number";
        },
        _isBoolean = function(toCheck){
            return typeof toCheck === "boolean";
        },
        _isDefined = function(toCheck){
            return (!(typeof toCheck === "undefined") && (toCheck !== null));
        },
        _isFunction = function(toCheck){
            return typeof toCheck === "function";
        },
        _isArray = Array.isArray || function (obj) {
                return _toString.call(obj) === '[object Array]';
            },
        _isObject = function(obj) {
            return typeof obj === 'object' && obj !== null;
        },
        _isPlainObj = function(obj) {
            return typeof obj == 'object' && obj.constructor == Object;
        },
        _each = function (arr, iterator) {
            if(_isArray(arr)){
                if (arr.forEach) {
                    return arr.forEach(iterator);
                }
                for (var i = 0; i < arr.length; i += 1) {
                    iterator(arr[i], i, arr);
                }
            }else if(_isObject(arr)){
                for(var i in arr){
                    iterator(arr[i], i, arr);
                }
            }
        },
        _map = function (arr, iterator) {
            if (arr.map) {
                return arr.map(iterator);
            }
            var results = [];
            _each(arr, function (x, i, a) {
                results.push(iterator(x, i, a));
            });
            return results;
        },
        _keys = function (obj) {
            if (Object.keys) {
                if(typeof obj == "object") {
                    return Object.keys(obj);
                }
            }

            var keys = [];
            if(typeof obj == "object"){
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        keys.push(k);
                    }
                }
            }
            return keys;
        },
        _isEmptyObject = function(obj){
            return (_keys(obj).length === 0);
        },
        _extend = function(isCopy){
            if(_isBoolean(isCopy)){
                if(isCopy === true){
                    Array.prototype.unshift.call(arguments, {});
                }else{
                    Array.prototype.shift.call(arguments);
                }
            }
            var objA = arguments[0];
            if(Object.assign){
                Object.assign.apply(this, arguments);
            }else{
                for(var i = 0;i < arguments.length;i++){
                    _each(arguments[i], function(v, k){
                        objA[k] = v;
                    });
                }
            }
            return objA;
        },
        _splice1 = function (a,i){var l=a.length;if (l){while (i<l){a[i++] = a[i];}--a.length;}},
        _addScaleToImage = function(url){
            var dim = _require("Dim");
            return decodeURIComponent(url).replace(/@[123](?=x\.[a-z]{3,4}$)/i, "@" + dim.scaleMode);
        },
        _stringifyTrace = function(){
            var time = new Date().toLocaleTimeString(),
                stackString = "^ trace log: " + time;
            if(!_isFunction(Error)){return stackString}
            var e = new Error("dummy");
            if(!_isDefined(e.stack)){return stackString}
            var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n');

            stack.splice(0, 2);
            stackString += "\n" + stack.join("\n<<< ");
            return stackString;
        },
        _log = function(title){
            if(_logWaiting){
                _prelogQueue.push(arguments);
            }
            if(!_isDefined(console)){return}
            var name = "log: ";
            if(arguments.length  == 1 && _isObject(arguments[0])){
                name = "Object"
            }else{
                name = Array.prototype.shift.call(arguments);
            }
            if(console.groupCollapsed){
                console.groupCollapsed(name);
                _each(arguments, function(val){
                    console.log(val);
                });
                console.trace();
                console.groupEnd();
            }else if(console.log){
                _each(arguments, function(val){
                    console.log(name, val);
                });
            }
        },
        _registered = {},
        _exports = {},
        _extendClass = function(base, sub) {
            sub.prototype =  Object.create(base.prototype);
            sub.prototype.constructor = sub;
        },
        _require = function(name){
            //_log("_require " +  name);
            if(!(name in _exports) && (!(name in _registered) || !_isFunction(_registered[name].moduleFn))){
                _log("_registered", _registered);
                var ex = new Error("Cannot find module " + name);
                throw ex.code = "MODULE_NOT_FOUND " + name;
            }
            if(name in _exports){
                var toExport = _exports[name].exports;
                delete _registered[name];
                return toExport;
            }else{
                var obj = {exports:{}};
                _registered[name].moduleFn.call(obj.exports, _require, obj, _extendClass);
                _exports[name] = obj;
                return obj.exports;
            }

        },
        _add = function(name, moduleFn){
            //_log("_add " + name);
            var ex ={};
            if(!_isFunction(moduleFn)){
                ex = new Error("Cannot find module function");
                throw ex.code = "MODULE_NOT_PROVIDED";
            }
            if((name in _registered) || (name in _exports)){
                ex = new Error("a module by that name has already been created");
                throw ex.code = "MODULE_NAME_TAKEN";
            }
            _registered[name] = {moduleFn:moduleFn};
            return that;
        },
        _closestDiff = function(size, a, b, aReturn, bReturn){
            aReturn = aReturn || a;
            bReturn = bReturn || b;
            return Math.abs(size - a) < Math.abs(size - b) ? aReturn : bReturn;
        },
        _showPrelog = function(){
            _logWaiting = false;
            if(!_prelogQueue.length){return}
            _each(_prelogQueue, function(val){
                that.log.apply(that, val);
                _prelogQueue.shift();
            });
        },
        _dummyDeferrd = function(){
            var stack =[],
                pushToStack = function(success, err, progress){
                    stack.push([
                        _isFunction(success) ? success : null,
                        _isFunction(err) ? err : null,
                        _isFunction(progress) ? progress : null
                    ]);
                },
                defObj = {
                    state: function(){ return "dummy"},
                    notify: function(){return this;},
                    resolve: function(){return this;},
                    then: pushToStack,
                    done: function(fn){pushToStack(fn, null, null); return this;},
                    fail: function(fn){pushToStack(null, fn, null); return this;},
                    progress: function(fn){pushToStack(null, null,fn); return this;},
                    promise: function(){
                        return {
                            then: defObj.then,
                            done: defObj.done,
                            fail: defObj.fail,
                            progress: defObj.progress,
                            state: defObj.state
                        }
                    },
                    set: function(){
                        var newDef = $.Deferred();
                        _each(stack, function(fnObj){
                            newDef.then.apply(newDef, fnObj);
                        });
                        stack =[];
                        return newDef;
                    }
                };
            return defObj;
        };

    that.add = _add;
    that.require = _require;
    that.isString = _isString;
    that.isNumeric = _isNumeric;
    that.isNumber = _isNumber;
    that.isDefined = _isDefined;
    that.isFunction = _isFunction;
    that.isArray = _isArray;
    that.isObject = _isObject;
    that.isPlainObj = _isPlainObj;
    that.each = _each;
    that.map = _map;
    that.keys = _keys;
    that.isEmptyObject = _isEmptyObject;
    that.extend = _extend;
    that.splice1 = _splice1;
    that.addScaleToImage = _addScaleToImage;
    that.log = _log;
    that.showPrelog = _showPrelog;
    that.noop = function(){};
    that.dummyDeferrd = _dummyDeferrd;

})();