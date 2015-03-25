//bridge api co communicate with a cordova wrapper for ipad app
﻿poseApp.service("nativeBridge", ["$rootScope"], function ($rootScope) {
    var frame, frameWin, frameLocation;
    if (navIs().iosApp || navIs().fromIosApp) {
        frame = $("#bridgeFrame");
        if (frame.length == 0) {
            frame = $("<iframe>", { height: 0, width: 0, id: "bridgeFrame" });
            $("body").append(frame);
        }
        frameWin = frame[0].contentWindow;
        frameLocation = frameWin.location;
        if (!$rootScope.hasOwnProperty("callbacks")) {
            $rootScope.callbacks = {};
        }
    }
    var desktopInit = function () {
            if (!navIs().iosApp && !navIs().fromIosApp) {
                for (fn in public_nativeBridge) {
                    if (fn == "isIosAppProc") {
                        public_nativeBridge[fn] = function () {
                            return false;
                        }
                    } else {
                        public_nativeBridge[fn] = function () {
                            return public_nativeBridge;
                        }
                    }

                }
            }
        },
        public_nativeBridge = {
            callNative: function (action, query, callback, timeOut, cbScope) {
                    //action: the action ios should take.
                    //query: an object containing the parameters and values to send to ios
                    //action: the name of the the cb function. *optinal in this case the scope will be ignored
                    //scope: the scope in which the cb exists. *optional if there is no callback or the scope is window.
                var url,
                    queryString = "",
                    cbScope = cbScope || window;
                try{
                    if (($.isPlainObject(query) || $.isArray(query)) && !$.isEmptyObject(query)) {
                        $.each(query, function (k, v) {
                            if ($.isPlainObject(v) || $.isArray(v)) {
                                if ((!$.isFunction(v) && !$.isFunction(v.then))) {
                                    v = poseApp.parseObj.jString(v);
                                }
                            }
                            queryString += "&" + k + "=" + v;
                        });
                    }
                    poseApp.debug("called native", action, callback, cbScope, timeOut);
                    if (callback && $.isFunction(cbScope[callback])) {
                        public_nativeBridge.registerNewCallback(callback, query, cbScope, timeOut);
                        queryString = "?cbid=" + callback + queryString;
                    } else {
                        //in no cb remove first & form the query string;
                        if (queryString.length) {
                            queryString = "?" + queryString.slice(1);
                        }
                    }
                    if (queryString == "") {
                        queryString = "?null=null";
                    }
                    if (!navIs().fromIosApp) {
                        url = "https://poseapp://" + action + queryString;
                    } else {
                        url = "poseapp://" + action + queryString;
                    }
                    frameLocation = frameWin.location;
                    frameLocation.replace(url);
                    public_nativeBridge.debug(url);
                } catch (e) {
                    poseApp.debug(e.name, e.message, e.stack);
                }
                return public_nativeBridge;
            },
            runCallback: function (id, dataFromIos, state) {
                //id: id of the callback, state: success or fail, dataFromIos:data sent back from ios 
                if ($rootScope.callbacks.hasOwnProperty(id)) {
                    var cbScope = $rootScope.callbacks[id].cbScope;
                    var args = $rootScope.callbacks[id].args;
                    var timeOut = $rootScope.callbacks[id].timeOut;
                    if (!cbScope || cbScope == "window") {
                        cbScope = window;
                    }
                    try {
                        poseApp.debug("runCallback " + id, dataFromIos, state);
                        clearTimeout(timeOut); timeOut = 0;
                        (cbScope[id]).call(cbScope, dataFromIos, state, args);
                    } catch (exception) {
                        poseApp.debug("runCallback " + exception.name, exception.message, exception.stack);
                    }
                } else {
                    public_nativeBridge.callNative("actionUnavailable", { callback: id, receivedData: dataFromIos, receivedState: state });
                }
                return public_nativeBridge;
            },
            getData: function () {
                var data = {},
                    key, i = 0;

                for (i; i < arguments.length; i++) {
                    key = arguments[i];
                    data[key] = localStorage.getItem(key);
                }
                public_nativeBridge.callNative("getData", data);
                return public_nativeBridge;
            },
            getLang: function () {
                var data = {},
                    key, i = 0;
                
                for (i; i < arguments.length; i++) {
                    key = arguments[i];
                    data[key] = encodeURIComponent($rootScope.lang[key]);
                }
                if (arguments.length == 0) {
                    data = $rootScope.lang;
                }
                public_nativeBridge.callNative("getLang", data);
                return public_nativeBridge;
            },
            showError: function (options) {
                var errDefaults = {
                    name: "iosApp error",
                    caller: "iosApp"
                }
                options = poseApp.parseObj.jObj(options);
                if ($.isPlainObject(options)) {
                    options = $.extend(errDefaults, options);
                    if (options.caller != "iosApp") {
                        $(window).trigger(options.caller + "Fail", options);
                    }
                    poseApp.showError(options);
                } else {
                    poseApp.showError($.extend(errDefaults, { error: options }));
                }
                return public_nativeBridge;
            },
            clearCallback: function (callback) {
                if ($rootScope.callbacks.hasOwnProperty(callback)) {
                    clearTimeout($rootScope.callbacks[callback].timeOut);
                    delete $rootScope.callbacks[callback];
                }
                return public_nativeBridge;
            },
            registerNewCallback: function (callback, query, cbScope, timeOut) {
                timeOut = timeOut || 0;
                var setNativeTimeout = function () {
                    if (timeOut <= 0) {
                        return 0;
                    } else {
                        return setTimeout(function () {
                            public_nativeBridge.runCallback(callback, {
                                name: callback + "timed out",
                                error: "native did not callback with " + callback + ". timed out after " + timeOut + " seconds.",
                                caller: "nativeBridge > " + callback
                            }, "fail");
                            if ($rootScope.callbacks.hasOwnProperty(callback)) {
                                clearTimeout($rootScope.callbacks[callback].timeOut);
                                $rootScope.callbacks[callback].timeOut = 0;
                            }
                        }, (timeOut * 1000));
                    }
                };
                if (callback && $.isFunction(cbScope[callback])) {
                    if (cbScope === window) {
                        cbScope = "window";
                    }
                    //check if callback id exists;
                    //register it only save if id hasnt been registered;
                    if (!$rootScope.callbacks.hasOwnProperty(callback)) {
                        $rootScope.callbacks[callback] = {
                            //callback: the callback name;
                            callback: callback,
                            //args passed to the bridge might be usefull for cb too
                            args: query,
                            //scope is where to find the function ie: crScope.posePrint
                            cbScope: cbScope,
                            //how log to wait for a reply
                            timeOut: setNativeTimeout()
                        }
                    } else {
                        clearTimeout($rootScope.callbacks[callback].timeOut);
                        $rootScope.callbacks[callback].args = query;
                        $rootScope.callbacks[callback].timeOut = setNativeTimeout();
                    }
                }
                return public_nativeBridge;
            },
            debug: function () {
                var first = Array.prototype.shift.call(arguments),
                    cleanUrls = function (stringToCheck) {
                        if (poseApp.isString(stringToCheck) && (stringToCheck.indexOf("http") != -1)) {
                            stringToCheck = "removed http > " + stringToCheck.replace(/http:|https:/g, "");
                        }
                        return stringToCheck;
                    };
                first = "iosApp debug >> " + cleanUrls(first);
                Array.prototype.unshift.call(arguments, first);
                poseApp.debug.apply(poseApp, arguments);
                return public_nativeBridge;
            }
        };
    desktopInit();
    return public_nativeBridge;
});
