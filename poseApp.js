var docAllReady = $.Deferred();
var poseApp = new (function setPoseApp() {
    var that_poseApp = this;
    var _navIs = navIs(),
        _modules = {},
        _holdServices = {},
        _cacheFactoryData = {},
        _bindMethods = function (func, toInject) {
            return func.apply(func, toInject);
        },
        _methods = {
            manageData: function (moduleId) {
                var public_manageData = {
                    updateSavedData: function (obj, title, from) {
                        //obj: the object to save or update;
                        //title: key for localstorage,
                        //from: boolean true-> update obj from storage, false-> update storage form obj
                        var curData = obj,
                            id = moduleId ? moduleId + "_" : "",
                            storageKey = id + title,
                            savedData = title ? public_manageData.getKeys(storageKey, "object") : curData,
                            StringifiedObj;
                        if ($.isEmptyObject(public_manageData.getKeys(storageKey, "object"))) {
                            from == false;
                        }
                        if (from === true) {
                            //from storage
                            if (typeof savedData != "object") {
                                savedData = _parseObj.jObj(savedData);
                            }
                            //_debug("from storage", savedData);
                            curData = $.extend(curData, savedData, true);
                            StringifiedObj = _parseObj.jString(savedData);
                            public_manageData.saveKeys(storageKey, StringifiedObj);
                            return savedData;
                        } else {
                            //from data
                            var isEqual = function () {
                                if (_isObjectType(savedData) && _isObjectType(curData)) {
                                    return _isEqualObjects(savedData, curData);
                                } else {
                                    return (savedData == curData);
                                }
                            }
                            if (!isEqual()) {
                                curData = $.extend(savedData, curData);
                                StringifiedObj = _parseObj.jString(curData);
                                public_manageData.saveKeys(storageKey, StringifiedObj);
                                if ($.isPlainObject(from)) {
                                    public_manageData.updateSavedData(from, title, true);
                                }
                            }
                            return curData;
                        }
                    },
                    deleteSavedData: function (title) {
                        var id = moduleId ? moduleId + "_" : "",
                            storageKey = id + title;
                        localStorage.removeItem(storageKey);
                    },
                    getKeys: function (key, type) {
                        //TO DO check split data and return defaults by type
                        var data = localStorage.getItem(key);
                        switch (type) {
                            case "number":
                                data = parseFloat(data);
                                if (isNaN(data)) {
                                    data = 0;
                                }
                                break;
                            case "string":
                                if (data == null) {
                                    data = "";
                                } else {
                                    data = data;
                                }
                                break;
                            case "object":
                                if (data == null) {
                                    data = {};
                                } else {
                                    try {
                                        data = _parseObj.jObj(data);
                                    } catch (e) {
                                        data = data;
                                    }
                                }
                                break;
                            case "array":
                                if (data == null) {
                                    data = [];
                                } else {
                                    try {
                                        data = _parseObj.jObj(data);
                                    } catch (e) {
                                        data = data;
                                    }
                                }
                                break;
                            case "boolean":
                                if (data == null || data == "false" || data == "0" || data == "undefined") {
                                    data = false;
                                } else if (data == "true" || data == "1") {
                                    data = true;
                                }
                            case "data":
                                if (data == null) {
                                    data = Date.parse("now");
                                } else {
                                    try {
                                        data = _parseObj.jObj(data);
                                    } catch (e) {
                                        data = data;
                                    }
                                }
                                break;
                            default: data = data;
                        }
                        return data;
                    },
                    saveKeys: function (key, val) {
                        try {
                            localStorage.setItem(key, val);
                        } catch (e) {
                            _warn("saveKeys " + e.name + " " + key + " wasnt saved", e.message, e.stack);
                        }
                    },
                    getCookie: function (key) {
                        var allCookies = document.cookie,
                            cObj = {},
                            cArray;
                        if (allCookies) {
                            cArray = allCookies.split(";");
                            $.each(cArray, function (k, v) {
                                if (v.length) {
                                    v = decodeURIComponent(v).split("=");
                                    cObj[v[0].trim()] = v[1];
                                }
                            });
                            if (key) {
                                if (cObj.hasOwnProperty(key)) {
                                    return cObj[key];
                                } else {
                                    return null;
                                }
                            } else {
                                return cObj;
                            }
                        } else {
                            return false;
                        }
                    },
                    getCookies: function () {
                        var data = {},
                            key, i = 0;
                        if (arguments.length > 0) {
                            for (i; i < arguments.length; i++) {
                                key = arguments[i];
                                data[key] = public_manageData.getCookie(key);
                            }
                        } else {
                            data = public_manageData.getCookie();
                        }
                        return data;
                    },
                    getData: function () {
                        var data = {},
                            key, i = 0;
                        if (arguments.length > 0) {
                            for (i; i < arguments.length; i++) {
                                key = arguments[i];
                                data[key] = public_manageData.getKeys(key);
                            }
                        } else {
                            $.each(localStorage, function (key, val) {
                                data[key] = val;
                            })
                        }
                        return data;
                    },
                    emailObject: function (dataObj) {
                        var dataString = "";
                        if (($.isPlainObject(dataObj) || $.isArray(dataObj)) && !$.isEmptyObject(dataObj)) {
                            $.each(dataObj, function (k, v) {
                                if ($.isPlainObject(v) || $.isArray(v)) {
                                    if ((!$.isFunction(v) && !$.isFunction(v.then))) {
                                        v = that_poseApp.parseObj.jString(v);
                                    }
                                }
                                dataString += k + ": " + v + " \n ";
                            });
                        }
                        return dataString;
                    }
                }
                return public_manageData;
            },
            getLang: function (manageData, $cacheFactory, $http) {
                var langCache = $cacheFactory("lang"),
                    getLngUrl = function (location) {
                        switch (location) {
                            case _pre.cr:
                                return "/lang/xmltrans.xml";
                                break;
                            case _pre.management:
                                return "/lang/xmltransMS.xml";
                                break;
                            case _pre.receipt:
                                return "/lang/xmltransReceipt.xml";
                                break;
                        }
                    },
                    getLocationLang = function (location) {
                        if (location == _pre.cr || location == _pre.management) {
                            return manageData.getKeys("personalLang");
                        } else {
                            //receipt by country 
                            return "nothing";
                        }
                    }
                return {
                    callLang: function (promise, currentLang, location) {
                        location = location || that_poseApp.location;
                        var url = _isString(promise) ? promise : getLngUrl(location);
                        promise = (!_isUndefined(promise) && $.isPlainObject(promise)) ? promise : {};
                        var def = $.Deferred(),
                            lang = {},
                            findTags = promise.hasOwnProperty("find") ? promise.find : "all",
                            langTag;
                        currentLang = currentLang || getLocationLang(location) || "en";
                        def.promise(promise);
                        if (findTags == "all" && langCache.get(location + "_" + url)) {
                            def.resolveWith(def, [langCache.get(location + "_" + url)]);
                        } else {
                            $http({
                                type: "GET",
                                url: url,
                                cache: true,
                                dataType: "xml"
                            }).success(function (xml) {
                                var langTrans = $(xml).find('languages').find('language[lang="' + currentLang + '"]');
                                var direction = $(langTrans).find('direction').text();
                                langTrans = langTrans.children();
                                lang.direction = direction;
                                if (findTags == "all") {
                                    $.each(langTrans, function (k, v) {
                                        lang[$(v).prop("tagName")] = $(v).text();
                                    });
                                } else {
                                    $.each(langTrans, function (k, v) {
                                        langTag = $(v).prop("tagName");
                                        if ($.inArray(langTag, findTags) != -1) {
                                            lang[langTag] = $(v).text();
                                        }
                                    });
                                }
                                langCache.put(location + "_" + url, lang);
                                def.resolveWith(def, [lang]);
                            }).error(function (errorThrown) {
                                def.rejectWith(def, [{ error: { response: errorThrown.responseText, status: errorThrown.status, statusText: errorThrown.statusText }, caller: "getLang.callLang", showMsg: true, cb: function () { location.href = "/logout.aspx" } }]);
                            });
                        }
                        return promise;
                    }
                }
            },
            messageBox: function (getLang, compile, bindWindowKeyup) {
                var langObj = getLang.callLang(),
                    lang = {},
                _templates = {
                    tmpl: $("<div class='lightboxFlex messageBox center'>" +
                            "<h1 ng-show='{scope.message.title != \"\"}' ng-class='scope.message.isWarn:hdrOrange'>{{message.title}}</h1>" +
                            "<div class='lightboxInner flexGrow flexBoxCenterAll' ng-show='{scope.message.msg != \"\"}'>" +
                                "<p class='messageBoxText' ng-show='{!scope.message.loader}'>{{message.msg}}</p>" +
                                "<p class='messageBoxText loadingContentLarge'  ng-show='{scope.message.loader}'>{{message.msg}}</p>" +
                            "</div>" +
                            "<div class='lightboxInner' ng-show='{scope.message.progressbar}'>" +
                                "<div class='progressContainer'>" +
                                    "<div class='progressBar' style='width:{{message.progressTo}}'></div>" +
                                    "<div class='progressLines flexBoxSpace'></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='lightboxButtonAction' ng-class='scope.message.cancelBtn:flexBoxSpace:flexCenter'  ng-show='{scope.message.btn}'>" +
                                "<div ng-show={scope.message.cancelBtn}>" +
                                    "<input type='button' id='messageBoxCancelBtn' value='{{message.cancelBtnTxt}}' class='btnGrey w160 msgBoxBtn btnH30 grey' />" +
                                "</div>" +
                                "<div>" +
                                    "<input type='button' id='messageBoxBtn' value='{{message.btnTxt}}' class='btnGreen w160 btnH30 msgBoxBtn' ng-class='scope.message.isWarn:btnRed:green' />" +
                                "</div>" +
                            "</div>" +
                        "</div>"),
                    ctx: ""
                },
                _defaults = {
                    title: "{{lang.GeneralErrorTitle}}",
                    msg: "<span class='bold'>" +
                            "<span>{{lang.GeneralError1}}</span><br/>" +
                            "<span>{{lang.GeneralError2}}</span>" +
                            "</span><br/><br />" +
                            "<span><span>{{lang.GeneralError3}}</span><br/>" +
                            "<a href='mailto:support@getpose.com' target='_blank'>support@getpose.com</a>" +
                            "</span>",
                    btnTxt: "{{lang.Done}}",
                    loader: false,
                    btn: true,
                    cb: null,
                    cancelBtn: false,
                    cancelBtnTxt: "{{lang.cancel}}",
                    cancelCb: null,
                    progressbar: false,
                    total: 100,
                    at: 0,
                    progressTo: "0%",
                    force: true,
                    addClass: "",
                    dontClose: false,
                    isWarn: false,
                    onShow: null,
                    ID: ""
                },
                _progressTo = "0%",
                _open = $.Deferred(),
                _opts = $.extend({}, _defaults),
                _messageBox = {
                    isOpen: function () {
                        if (_open.state() == "started" || _open.state() == "resolved") {
                            return true;
                        } else {
                            return false;
                        }
                    },
                    ctx: _templates.ctx,
                    show: function (options) {
                        var showFn = function () {
                            if (_opts.msg == "") { _opts.msg = _defaults.msg };
                            _opts.msg = compile.compileApply(_opts.msg, { lang: lang });
                            _opts.title = compile.compileApply(_opts.title, { lang: lang });
                            _opts.btnTxt = compile.compileApply(_opts.btnTxt, { lang: lang });
                            _opts.cancelBtnTxt = compile.compileApply(_opts.cancelBtnTxt, { lang: lang });
                            _opts.progressTo = ((_opts.at / _opts.total) * 100) + "%";
                            var template = compile.compileApply(_templates.tmpl.clone(), { message: _opts });
                            if (_opts.addClass.length) {
                                template.addClass(_opts.addClass);
                            }

                            $.modal(template, {
                                onShow: function (dialog) {
                                    _templates.ctx = dialog.data;
                                    if ((dialog.container.height() < _templates.ctx.outerHeight()) || (dialog.container.width() < _templates.ctx.outerWidth())) {
                                        dialog.container.height(_templates.ctx.outerHeight())
                                            .width(_templates.ctx.outerWidth()).html(dialog.data);
                                    }
                                    if (_opts.cancelBtn) {
                                        $("#messageBoxCancelBtn", dialog.data).onClick(function (e) {
                                            if ($.isFunction(_opts.cancelCb)) {
                                                _opts.cancelCb.call(this, _templates.ctx, e);
                                            }
                                            _messageBox.close();
                                        });
                                        $("#messageBoxBtn", dialog.data).onClick(function (e) {
                                            if ($.isFunction(_opts.cb)) {
                                                _opts.cb.call(this, _templates.ctx, e);
                                            }
                                        });
                                        if (!_opts.dontClose) {
                                            $("#messageBoxBtn", dialog.data).onClick(_messageBox.close);
                                        }

                                    } else {
                                        if (_opts.dontClose) {
                                            if ($.isFunction(_opts.cb)) {
                                                $("#messageBoxBtn", dialog.data).onClick(function (e) {
                                                    _opts.cb.call(this, _templates.ctx, e);
                                                });
                                            } else {
                                                $("#messageBoxBtn", dialog.data).onClick(_messageBox.close);
                                            }
                                        } else {
                                            $("#messageBoxBtn", dialog.data).onClick(_messageBox.close);
                                        }
                                    }

                                    if (_opts.progressbar) {
                                        $(dialog.data).css({ "min-height": "10px" });
                                    }
                                    $(window).off(".closeEvent");
                                    if ($.isFunction(_opts.onShow)) {
                                        _opts.onShow(_templates.ctx);
                                    }
                                    bindWindowKeyup("messageboxactions").on(function () {
                                        var saveBtn = $("#messageBoxBtn", dialog.data);
                                        if (!saveBtn.is(":disabled")) {
                                            saveBtn.trigger("click");
                                        } else {
                                            return false;
                                        }
                                    }, function () {
                                        var cancelBtn = $("#messageBoxCancelBtn", dialog.data);
                                        if (cancelBtn.length && cancelBtn.is(":visible")) {
                                            cancelBtn.trigger("click");
                                        } else {
                                            _messageBox.close();
                                        }
                                    });
                                },
                                openCb: function () {
                                    _open.resolve();
                                },
                                onClose: function () {
                                    _messageBox.close(options);
                                },
                                focus: false,
                                ID: _opts.ID
                            });
                            _open.notify("started");
                        };
                        if (!_messageBox.isOpen()) {
                            langObj.then(function (langData) {
                                lang = langData;
                                _opts = options ? $.extend({}, _defaults, options) : _defaults;
                                var modalAlreadyOpen = !_isUndefined($.modal.impl.d.data);

                                if (!_opts.force) {
                                    if (modalAlreadyOpen) {
                                        return false;
                                    } else {
                                        $.modal.close().then(function () {
                                            showFn();
                                        });
                                    }
                                }
                                else {
                                    if ($.modal.selfClose) {
                                        return false;
                                    } else {
                                        $.modal.close().then(function () {
                                            //console.log("opening");
                                            showFn();
                                        });
                                    }
                                }
                            }, _noLangErrorBox);
                        } else {
                            _messageBox.close().then(function () {
                                _messageBox.show(options);
                            });
                        }
                        return _messageBox;
                    },
                    update: function (options) {
                        if (_messageBox.isOpen()) {
                            _open.then(function () {
                                _opts = options ? $.extend(_opts, options) : _opts;
                                if (_opts.msg == "") { _opts.msg = _defaults.msg };
                                _opts.msg = compile.compileApply(_opts.msg, { lang: lang });
                                _opts.title = compile.compileApply(_opts.title, { lang: lang });
                                _opts.btnTxt = compile.compileApply(_opts.btnTxt, { lang: lang });
                                _opts.progressTo = ((_opts.at / _opts.total) * 100) + "%";
                                //_debug("messageBox modal update", _opts);
                                if (_isString(_opts.title)) {
                                    $("h1", _templates.ctx).html(_opts.title);
                                    if (_opts.title.length) {
                                        $("h1", _templates.ctx).toShow();
                                    } else {
                                        $("h1", _templates.ctx).hide();
                                    }
                                }
                                if (_isString(_opts.msg) || _isjQuery(_opts.msg)) {
                                    $(".messageBoxText", _templates.ctx).html(_opts.msg);
                                    $(".messageBoxText", _templates.ctx).closest(".lightboxInner").toShow();
                                } else {
                                    if (!_opts.loader) {
                                        $(".messageBoxText", _templates.ctx).closest(".lightboxInner").hide();
                                    }
                                }
                                var lightboxButtonAction = $(".lightboxButtonAction", _templates.ctx),
                                    messageBoxBtn = $("#messageBoxBtn", _templates.ctx),
                                    messageBoxCancelBtn = $("#messageBoxCancelBtn", _templates.ctx);
                                if (_opts.btn) {
                                    lightboxButtonAction.toShow();
                                    if (_opts.btnTxt.length && _isString(_opts.btnTxt)) {
                                        messageBoxBtn.val(_opts.btnTxt);
                                    }
                                    if (_opts.cancelBtn) {
                                        if (_opts.cancelBtnTxt.length && _isString(_opts.cancelBtnTxt)) {
                                            messageBoxCancelBtn.val(_opts.cancelBtnTxt);
                                        }
                                        messageBoxBtn.offClick().onClick(function (e) {
                                            if ($.isFunction(_opts.cb)) {
                                                _opts.cb.call(this, _templates.ctx, e);
                                            }
                                            _messageBox.close();
                                        });
                                        messageBoxCancelBtn.offClick().onClick(function (e) {
                                            if ($.isFunction(_opts.cancelCb)) {
                                                _opts.cancelCb.call(this, _templates.ctx, e);
                                            }
                                            if (!_opts.dontClose) {
                                                _messageBox.close();
                                            }
                                        });
                                        $("> div:first", lightboxButtonAction).toShow()
                                        lightboxButtonAction.removeClass("flexCenter").addClass("flexBoxSpace");
                                    } else {
                                        if (!_opts.dontClose) {
                                            if ($.isFunction(_opts.cb)) {
                                                messageBoxBtn.onClick(function (e) {
                                                    if ($.isFunction(_opts.cb)) {
                                                        _opts.cb.call(this, _templates.ctx, e);
                                                    }
                                                });
                                            }

                                        } else {
                                            messageBoxBtn.offClick().onClick(_messageBox.close);
                                        }
                                        $("> div:first", lightboxButtonAction).hide()
                                        lightboxButtonAction.removeClass("flexBoxSpace").addClass("flexCenter");
                                    }
                                } else {
                                    lightboxButtonAction.hide();
                                }
                                if (_opts.loader) {
                                    $(".messageBoxText:eq(0)", _templates.ctx).hide();
                                    $(".messageBoxText:eq(1)", _templates.ctx).toShow();
                                } else {
                                    $(".messageBoxText:eq(1)", _templates.ctx).hide();
                                    $(".messageBoxText:eq(0)", _templates.ctx).toShow();
                                }
                                if (_opts.progressbar) {
                                    $(".progressBar", _templates.ctx).toShow();
                                    $(".progressBar", _templates.ctx).closest(".lightboxInner").toShow();
                                    if (Number(_opts.at) > 0) {
                                        $(".progressBar", _templates.ctx).css("width", _opts.progressTo);
                                    }
                                } else {
                                    $(".progressBar", _templates.ctx).closest(".lightboxInner").hide();
                                }
                            });
                            return _messageBox;
                        } else {
                            return _messageBox.show(options);
                        }

                    },
                    close: function (options) {
                        //_debug("messageBox modal close", _opts.dontClose, _opts, _open.state());
                        options = $.isPlainObject(options) ? options : {};
                        var messageBoxClose_def = $.Deferred();
                        _open.then(function () {
                            _opts = options ? $.extend(_opts, options) : _opts;
                            var ev = window.event;
                            if (!_opts.cancelBtn && $.isFunction(_opts.cb) && !_opts.dontClose) {
                                _opts.cb.call($("#messageBoxBtn", _templates.ctx).get(0), _templates.ctx, $.Event(ev));
                            }
                            _opts = $.extend({}, _defaults);
                            bindWindowKeyup("messageboxactions").off();
                            $.modal.impl.o.onClose = null;
                            $.modal.close().then(function () {
                                _open = $.Deferred();
                                messageBoxClose_def.resolve();
                            });
                        });
                        return messageBoxClose_def.promise();
                    },
                    error: function (options) {
                        var errDefaults = {
                            showMsg: false,
                            error: "no data available",
                            caller: "unknown caller",
                            throwErr: false,
                            name: "Error",
                            ID: "error"
                        },
                        errDefaults = $.extend({}, errDefaults, _defaults),
                        errorLog = function (name, msg, data) {
                            this.name = name;
                            this.message = msg;
                            this.data = data;
                            this.stack = console.trace;
                        },
                        options = options ? $.extend({}, errDefaults, options, {
                            ID: "error",
                            progressbar: false,
                            loader: false
                        }) : errDefaults,
                        showError = function () {
                            _warn(options.name, options.msg, "Error data: ", options.error, "caller: ", options.caller, _getStackTrace());
                            if (options.showMsg) {
                                _messageBox.show(options);
                            }
                        };

                        if (options.throwErr) {
                            options.showMsg = true;
                            showError();
                            throw new errorLog(options.name, options.msg, options.error);
                        } else {
                            showError();
                        }
                        return _messageBox;
                    },
                    progressBar: function (options) {
                        var progressDefaults = {
                            btn: false,
                            loader: false,
                            progressbar: true,
                            title: "",
                            msg: "{{lang.transLoaderPayment}}"
                        },
                            progressOpts = $.extend({}, _defaults, _opts, progressDefaults, options);
                        if (_open.state() == "pending" || _open.state() == "resolved") {
                            return _messageBox.update(progressOpts);
                        } else {
                            return _messageBox.show(progressOpts);
                        }
                    }
                };
                return _messageBox;
            }
        },
        _registered = {
            $http: {
                type: "service",
                services: [],
                func: function () {
                    return function (opts) {
                        var http_def = $.Deferred(),
                            defaults = {},
                            callbacks = {
                                success: $.Callbacks("unique"),
                                error: $.Callbacks("unique"),
                                always: $.Callbacks("unique")
                            },
                            checkSuccesss = function (Data, textStatus, jqXhr, fromError) {
                                var redirectLink = "account/registrationDetails";
                                if (_isObjectType(Data)) {
                                    if (Data.hasOwnProperty("status")) {
                                        if (Data.status.toUpperCase() == "LOGOUT") {
                                            localStorage.removeItem("mgtLastPage");
                                            top.location.href = "/logout.aspx";
                                            return false;
                                        } else if (Data.status.toUpperCase() == "REDIRECT") {
                                            window.location.href = data.msg;
                                            return false;
                                        } else if (Data.status.toUpperCase() == "HASH") {
                                            if (poseApp.location == _pre.management) {
                                                if (Data.msg.toUpperCase() == "EXPIRED") {
                                                    $("title").data("testover", "1");
                                                    removeHeaderPartsAfterTest(); //global function on management only
                                                    redirectLink = "account/activationpage";
                                                }
                                                else if (Data.msg.toUpperCase() == "DIDNTPAY") {
                                                    redirectLink = "account/registrationDetails";
                                                }
                                                top.location.hash = redirectLink;
                                                return false;
                                            } else {
                                                //TODO should cr fail?
                                                http_def.resolveWith(register, arguments);
                                                return callbacks.success.fire.apply(callbacks.success, arguments);
                                            }
                                        } else if (Data.status.toUpperCase() == "FAIL") {
                                            Array.prototype.push.call(arguments, { httpOpt: opts });
                                            http_def.rejectWith(register, arguments);
                                            return callbacks.error.fire({ status: "FAIL", msg: "", jqXhr: jqXhr, httpOpt: opts });
                                        } else {
                                            http_def.resolveWith(register, arguments);
                                            return callbacks.success.fire.apply(callbacks.success, arguments);
                                        }
                                    } else {
                                        http_def.resolveWith(register, arguments);
                                        return callbacks.success.fire.apply(callbacks.success, arguments);
                                    }
                                } else {
                                    var dataForTest = String(Data),
                                        rejectArgs = {};
                                    if (dataForTest.toUpperCase() == "LOGOUT") {
                                        localStorage.removeItem("mgtLastPage");
                                        top.location.href = "/logout.aspx";
                                        return false;
                                    } else if (dataForTest.indexOf("REDIRECT") >= 0) {
                                        redirectLink = dataForTest.replace("REDIRECT=", "");
                                        window.location.href = redirectLink;
                                        return false;
                                    } else if (dataForTest.indexOf("HASH=") == 0) {
                                        redirectLink = dataForTest.replace("HASH=", "");
                                        if (poseApp.location == _pre.management) {
                                            if (redirectLink.toUpperCase() == "EXPIRED") {
                                                $("title").data("testover", "1");
                                                removeHeaderPartsAfterTest(); //global function on management only
                                                redirectLink = "account/activationpage";
                                            }
                                            else if (redirectLink.toUpperCase() == "DIDNTPAY") {
                                                redirectLink = "account/registrationDetails";
                                            }
                                            top.location.hash = redirectLink;
                                            return false;
                                        } else {
                                            //TODO should cr fail?
                                            http_def.resolveWith(register, arguments);
                                            return callbacks.success.fire.apply(callbacks.success, arguments);
                                        }
                                        return false;
                                    } else if (dataForTest.indexOf("FAIL=") >= 0) {
                                        var failText = dataForTest.replace("FAIL=", "");
                                        rejectArgs = { status: "FAIL", msg: failText, jqXhr: jqXhr, httpOpt: opts };
                                        http_def.rejectWith(register, [rejectArgs]);
                                        return callbacks.error.fire(rejectArgs);
                                    } else if (dataForTest.indexOf("FAIL") >= 0 || dataForTest == null) {
                                        rejectArgs = { status: "FAIL", msg: "", jqXhr: jqXhr, httpOpt: opts };
                                        http_def.rejectWith(register, [rejectArgs]);
                                        return callbacks.error.fire(rejectArgs);
                                    } else {
                                        if (fromError !== true) {
                                            http_def.resolveWith(register, arguments);
                                            return callbacks.success.fire.apply(callbacks.success, arguments);
                                        } else {
                                            Array.prototype.push.call(arguments, { httpOpt: opts });
                                            http_def.rejectWith(register, arguments);
                                            callbacks.error.fire({ status: "FAIL - expected object", Data: Data, msg: "", jqXhr: jqXhr, httpOpt: opts });
                                        }
                                    }
                                }
                            },
                            register = {
                                success: function (fn) { //succes after login and fail check
                                    if ($.isFunction(fn)) {
                                        callbacks.success.add(fn);
                                    }
                                    return register;
                                },
                                error: function (fn) { // get an error for the request
                                    if ($.isFunction(fn)) {
                                        callbacks.error.add(fn);
                                    }
                                    return register;
                                },
                                always: function (fn) { //will run on any response
                                    if ($.isFunction(fn)) {
                                        callbacks.always.add(fn);
                                    }
                                    return register;
                                },
                                then: function (fnSuccess, fnError) {
                                    register.success(fnSuccess);
                                    register.error(fnError);
                                    return register;
                                }
                            },
                            registerCopy = $.extend(true, {}, register);
                        http_def.promise(register);
                        for (registerFn in registerCopy) {
                            register[registerFn] = registerCopy[registerFn];
                        }
                        delete register.pipe;
                        register.done = register.success;
                        register.fail = register.error;
                        if (opts.hasOwnProperty("strSQL")) {
                            if (poseApp.location == _pre.cr) {
                                // webSQL
                                defaults = {
                                    strSQL: "",
                                    holders: []
                                };
                                opts = $.extend(defaults, opts);
                                PoseDB.transaction(
                                function (transaction) {
                                    transaction.executeSql(opts.strSQL, opts.holders,
                                        function successSQLhttp(tx, results) {
                                            var gotResults = [];
                                            for (var i = 0; i < results.rows.length; i++) {
                                                gotResults.push(results.rows.item(i));
                                            }
                                            Array.prototype.unshift.call(arguments, gotResults);
                                            http_def.resolveWith(register, arguments);
                                            callbacks.success.fire.apply(callbacks.success, arguments);
                                            callbacks.always.fire.apply(callbacks.always, arguments);
                                        }, function errorSQLhttp() {
                                            Array.prototype.push.call(arguments, { httpOpt: opts });
                                            http_def.rejectWith(register, arguments);
                                            callbacks.error.fire.apply(callbacks.error, arguments);
                                            callbacks.always.fire.apply(callbacks.always, arguments);
                                        }
                                    );
                                });
                            } else {
                                poseApp.showError({ name: "$http wrong format request managementSys", error: opts, caller: "$http" });
                            }
                        } else if (opts.hasOwnProperty("url")) {
                            defaults = {
                                type: "GET",
                                url: "",
                                dataType: "json"
                            };
                            opts = $.extend(defaults, opts, {
                                success: checkSuccesss,
                                error: function errorURLhttp() {
                                    var jqXHR = arguments[0];
                                    if (opts.dataType == "json" && !_isObjectType(jqXHR.responseText)) {
                                        checkSuccesss(jqXHR.responseText, jqXHR.statusText, jqXHR, true);
                                    } else {
                                        Array.prototype.shift.call(arguments);
                                        jqXHR = $.extend({ msg: "", httpOpt: opts }, jqXHR);
                                        _debug("ajax error", jqXHR);
                                        Array.prototype.unshift.call(arguments, jqXHR);
                                        http_def.rejectWith(register, arguments);
                                        callbacks.error.fire.apply(callbacks.error, arguments);
                                    }
                                },
                                complete: callbacks.always.fire
                            });
                            $.ajax(opts);
                        } else {
                            poseApp.showError({ name: "$http wrong format request", error: opts, caller: "$http" });
                        }
                        return register;
                    };
                }
            },
            manageData: {
                type: "service",
                services: ["moduleId"],
                func: _methods.manageData
            },
            $cacheFactory: {
                type: "service",
                services: ["manageData", "moduleId"],
                func: function (manageData, moduleId) {
                    var data = _cacheFactoryData,
                        createEntry = function (id, opts) {
                            var self = this,
                                eData = {},
                                defaults = {
                                    save: false
                                },
                                selfInfo = {
                                    id: id
                                },
                                saveData = function () {
                                    if (defaults.save) {
                                        manageData.updateSavedData(eData, id, false);
                                    }
                                };
                            if (opts) {
                                defaults = $.extend(defaults, opts);
                                selfInfo.options = defaults;
                                if (defaults.save) {
                                    var savedKey = manageData.getKeys(moduleId + "_" + id, "object");
                                    if ($.isPlainObject(savedKey) && !$.isEmptyObject(savedKey)) {
                                        eData = savedKey;
                                    }
                                }
                            }
                            var self_public = {
                                get: function (eKey) {
                                    if (eData.hasOwnProperty(eKey)) {
                                        return eData[eKey];
                                    } else {
                                        return undefined;
                                    }
                                },
                                put: function (eKey, eVal) {
                                    eData[eKey] = eVal;
                                    saveData();
                                    return eVal;
                                },
                                remove: function (eKey) {
                                    delete eData[eKey];
                                    saveData();
                                    return true;
                                },
                                removeAll: function () {
                                    eData = {};
                                    saveData();
                                    return true;
                                },
                                destroy: function () {
                                    delete data[id];
                                    if (defaults.save) {
                                        manageData.deleteSavedData(id);
                                    }
                                    return true;
                                },
                                info: function () {
                                    selfInfo.size = _objLength(eData);
                                    return selfInfo;
                                },
                                //this one is a helper function for me it's not a part of angular's $cachFactory
                                all: function () {
                                    return $.extend({}, eData);
                                }
                            }
                            return self_public;
                        };
                    return function (key, opts) {
                        if (key) {
                            if (!data.hasOwnProperty(key)) {
                                return data[key] = createEntry(key, opts);
                            } else {
                                //_debug(key, data[key]);
                                return data[key];
                            }
                        } else {
                            _warn("cache key wasn't defined " + key + " is not a valid key name");
                        }
                    }
                }
            },
            $templateCache: {
                type: "service",
                services: ["$cacheFactory"],
                func: function ($cacheFactory) {
                    return $cacheFactory('templateCache');
                }
            },
            settingsCache: { //not in use maybe change posesettings to this later
                type: "service",
                services: ["$cacheFactory"],
                func: function ($cacheFactory) {
                    var settingsCache = $cacheFactory("settings", { save: true }),
                        putObject = function (obj) {
                            if ($.isPlainObject(obj)) {
                                $.each(obj, settingsCache.put);
                            }
                        }
                    return {
                        put: settingsCache.put,
                        putObject: putObject,
                        get: settingsCache.get,
                        all: settingsCache.all,
                        info: settingsCache.info
                    };
                }
            },
            compile: {
                type: "factory",
                services: ["$rootScope", "$templateCache", "$http"],
                func: function ($rootScope, $templateCache, $http) {
                    var public_compile = {
                        compileString: function (string, data) {
                            var pattern = /\{(\d+)\}/g;
                            string = string.replace(pattern, function (match, key) {
                                return data[key];
                            });
                            return string;
                        },
                        compileApply: function (html, test) {
                            var testName = false;
                            if (typeof test != "object") {
                                arguments = Array.prototype.slice.call(arguments, 1);
                                testName = test;
                            }

                            if (testName) {
                                console.groupCollapsed(testName);
                                console.profile(testName);
                                console.time(testName + " time");
                            }
                            var args = Array.prototype.slice.call(arguments, 1),
                                dataRef = (args.length < 1) ? $rootScope : args[0],
                                scopeChild, i, collection,
                                regexData = /^data\-(.+)$/;
                            var isNotReservedDataName = function (dataNameCheck) {
                                var reserved = $.merge(["model", "myOldVal", "collection"], _directives.registered.list);
                                return ($.inArray(dataNameCheck, reserved) == -1)
                            };
                            var isHTML = function (toTest) {
                                var testElem = $("<div>");
                                if (_isjQuery(toTest)) {
                                    return true;
                                } else {
                                    testElem.html(toTest);
                                    if (testElem.children().length) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }
                            };
                            var replaceObj = function (string, obj) {
                                var pattern = new RegExp("\{\{(" + obj + ".*?)\}\}", "g");
                                var replaceW, asString, asObj;
                                if (_isString(string)) {
                                    asString = string.replace(pattern, function (pMatch, key) {
                                        key = key.split(".");
                                        replaceW = dataRef;
                                        for (i = 0; i < key.length; i++) {
                                            replaceW = replaceW[key[i]];
                                        };
                                        if (_isjQuery(replaceW) || _isObjectType(replaceW)) {
                                            asObj = replaceW;
                                            return "jqueryObj";
                                        } else {
                                            return replaceW;
                                        }
                                    });
                                    if (asString != "jqueryObj") {
                                        return asString
                                    } else {
                                        return asObj;
                                    }
                                } else {
                                    return string;
                                }
                            };

                            var collectAndReplace = function (htmlObj) {
                                if (testName) {
                                    console.count("collectAndReplace " + testName);
                                    console.time(testName + " collectAndReplace");
                                    console.group("collectAndReplace " + testName);
                                    console.time("collection time");
                                    console.log("length", $("*", htmlObj).add(htmlObj).length);
                                }
                                //if (htmlObj.data().hasOwnProperty("collection")) {
                                //    collection = htmlObj.data("collection");
                                //} else {
                                collection = $("*", htmlObj).add(htmlObj).filter(function () {
                                    var check = false, elem = $(this), cloneElem;
                                    if (testName) {
                                        console.count("collection " + testName);
                                        console.log(elem);
                                        console.time(testName + " collection");
                                    }
                                    var checkAttr = false, modelData, textCheck = false;
                                    var regex;// = new RegExp("\{\{(.*?)\}\}", "g");
                                    try {
                                        if (!_isUndefined(elem.data())) {
                                            if (!elem.data().hasOwnProperty("model")) {
                                                elem.data("model", {});
                                            }
                                            modelData = elem.data("model");
                                            if (!_isUndefined(modelData.text)) {
                                                textCheck = true;
                                            }
                                            for (scopeChild in dataRef) {
                                                regex = new RegExp("\{\{(" + scopeChild + ".*?)\}\}", "g");
                                                $.each(this.attributes, function (k, v) {
                                                    if (modelData[v.nodeName] == v.value) {
                                                        checkAttr = true;
                                                    }
                                                    if (v.value.match(regex)) {
                                                        modelData[v.nodeName] = v.value;
                                                        if (!checkAttr) {
                                                            checkAttr = true;
                                                        }
                                                    }
                                                });
                                                if (!textCheck && elem.text().match(regex)) {
                                                    textCheck = true;
                                                }
                                                if (elem.text().match(regex)) {
                                                    check = elem.text().match(regex);
                                                    if (check && elem.children().length) {
                                                        cloneElem = elem.clone();
                                                        cloneElem.children(":not('text')").remove();
                                                        check = cloneElem.text().match(regex);
                                                    }
                                                    if (check) {
                                                        modelData.text = elem.text();
                                                    }
                                                }
                                            }
                                            elem.data("model", modelData);
                                        }

                                    } catch (e) {
                                        console.debug(e.message, elem, elem.data(), e.stack);
                                    }
                                    if (testName) {
                                        console.timeEnd(testName + " collection");
                                    }
                                    return (textCheck || checkAttr);
                                });
                                htmlObj.data("collection", collection);
                                //}
                                if (testName) {
                                    console.timeEnd("collection time");
                                    console.groupEnd("collectAndReplace " + testName);
                                    console.time(testName + " each");
                                }
                                $.each((collection.get().reverse()), function (key, val) {
                                    var elem = $(val),
                                        regex,
                                        toReplace,
                                        model = elem.data("model");
                                    $.each(model, function (k, v) {
                                        for (scopeChild in dataRef) {
                                            regex = new RegExp("\{\{(" + scopeChild + ".*?)\}\}", "g");
                                            if (k == "text" && v.match(regex)) {
                                                toReplace = replaceObj(v, scopeChild);
                                                if (_isjQuery(toReplace)) {
                                                    elem.html(collectAndReplace(toReplace));
                                                } else {
                                                    elem.html(toReplace).data("myOldVal", toReplace);
                                                }
                                                //console.debug("key", scopeChild, model, k, replaceObj(v, scopeChild));
                                            } else {
                                                if (v.match(regex)) {
                                                    if (regexData.test(k)) {
                                                        toReplace = k.replace("data-", "");
                                                        if (isNotReservedDataName(toReplace)) {
                                                            elem.data(toReplace, replaceObj(v, scopeChild)).removeAttr(k);
                                                        }
                                                    } else {
                                                        elem.attr(k, replaceObj(v, scopeChild));
                                                    }
                                                }
                                            }
                                        }
                                    });
                                });
                                if (testName) {
                                    console.timeEnd(testName + " each");
                                }
                                $("img[template-src]", html).each(function () {
                                    var elem = $(this),
                                        imgSrc = elem.attr("template-src");
                                    elem.attr("src", imgSrc).removeAttr("template-src");
                                });
                                if (testName) {
                                    console.timeEnd(testName + " collectAndReplace");
                                }
                                return htmlObj;
                            };
                            if (!isHTML(html)) {
                                for (scopeChild in dataRef) {
                                    html = replaceObj(html, scopeChild);
                                }
                                return html;
                            } else {
                                html = _isjQuery(html) ? html : $("<div>").html(html).contents();
                            }
                            for (i = 0; i < (args.length) ; i++) {
                                if (typeof args[i] == "object" && typeof args[i + 1] == "object") {
                                    var extWith = dataRef != args[i] ? args[i] : args[i + 1]
                                    dataRef = $.extend(dataRef, extWith);
                                }
                            }
                            html = public_compile.applyDirectives(html, dataRef, testName);
                            html = collectAndReplace(html);
                            if (testName) {
                                console.profileEnd(testName);
                                console.timeEnd(testName + " time");
                                console.groupEnd(testName);
                            }
                            return html;
                        },
                        applyDirectives: function (html, scope, testName) {
                            if (testName) {
                                console.count("applyDirectives" + testName);
                                console.time(testName + " applyDirectives");
                            }
                            var htmlWrapped = $("<div>").append(html),
                                directives = _directives.registered.list,
                                dirDataName = "", foundElem;
                            $.each(directives, function (kDir, vDir) {
                                dirDataName = vDir.dataName;
                                foundElem = [];
                                if (vDir.restrict.indexOf("A") != -1) {
                                    foundElem = $("[" + dirDataName + "]", htmlWrapped);
                                    $.each(foundElem, function (k, v) {
                                        v = vDir.applyDir(v, scope);
                                    });
                                }
                                if (vDir.restrict.indexOf("E") != -1) {
                                    foundElem = $(dirDataName, htmlWrapped);
                                    $.each(foundElem, function (k, v) {
                                        v = vDir.applyDir(v, scope);
                                    });
                                }
                                if (vDir.restrict.indexOf("C") != -1) {
                                    foundElem = $("." + dirDataName, htmlWrapped);
                                    $.each(foundElem, function (k, v) {
                                        v = vDir.applyDir(v, scope);
                                    });
                                }
                            });
                            if (testName) {
                                console.timeEnd(testName + " applyDirectives");
                            }
                            return htmlWrapped.contents();
                        },
                        loadTemplate: function (url, promise) {
                            var def = $.Deferred(),
                                savedHtml = $templateCache.get(url);
                            if (savedHtml) {
                                def.resolveWith(def, [savedHtml]);
                            } else {
                                if (promise) {
                                    def.promise(promise);
                                }
                                $http({
                                    type: "GET",
                                    url: url,
                                    cache: true,
                                    dataType: "html"
                                }).success(function (html) {
                                    var html = $.parseHTML(html);
                                    $templateCache.put(url, html);
                                    def.resolveWith(def, [html]);
                                }).error(function (errorThrown) {
                                    def.rejectWith(def, [{ error: { response: errorThrown.responseText, status: errorThrown.status, statusText: errorThrown.statusText, fullError: errorThrown } }]);
                                });
                            }
                            return def;
                        },
                        loadCss: function (url) {
                            var css_def = $.Deferred();
                            if (RegExp("\.css$").test(url)) {
                                url = url + that_poseApp.versionSuffix;
                                var savedCss = $templateCache.get("minified_" + url);
                                if (savedCss) {
                                    css_def.resolve(savedCss);
                                } else {
                                    $http({
                                        url: url,
                                        cache: true,
                                        dataType: "html"
                                    }).success(function (cssData) {
                                        cssData = cssData.replace(/(?:\/\*(?:[\S\s]*?)\*\/)|[\t\r\n\v\f]|\s(?=[\s:;}{])/mg, "").replace("{ ", "{").replace("\: ", ":").replace("; ", ";").replace("} ", "}");
                                        $templateCache.put("minified_" + url, "<style>" + cssData + "</style>");
                                        css_def.resolve("<style scoped='scoped'>" + cssData + "</style>");
                                        //_debug("minifiyCss", cssData);
                                    }).error(function (errData) {
                                        css_def.rejectWith(css_def, [{ name: "failed to get css", error: errData, showMsg: true, caller: "compile > loadCss" }]);
                                    });
                                }
                            } else {
                                css_def.rejectWith(css_def, [{ name: "this is not a css file", error: errData, showMsg: true, caller: "compile > loadCss" }]);
                            }
                            return css_def.promise();
                        }
                    }
                    return public_compile
                }
            },
            getLang: {
                type: "service",
                services: ["manageData", "$cacheFactory", "$http"],
                func: _methods.getLang
            },
            rootLang: {
                type: "factory",
                services: ["$rootScope"],
                func: function ($rootScope) {
                    return $rootScope.lang;
                }
            },
            messageBox: {
                type: "factory",
                services: ["getLang", "compile", "bindWindowKeyup"],
                func: _methods.messageBox
            },
            nameSpacesCache: {
                type: "service",
                services: ["$cacheFactory"],
                func: function ($cacheFactory) {
                    return $cacheFactory("usedNameSpaces");
                }
            },
            bindWindowKeyup: {
                type: "service",
                services: ["nameSpacesCache"],
                func: function (nameSpacesCache) {
                    var _addToUsedList = function (nameToCheck) {
                        if (!nameSpacesCache.get(nameToCheck)) {
                            nameSpacesCache.put(nameToCheck, nameToCheck);
                        }
                    },
                        _removeFromUsedList = function (nameToCheck) {
                            if (nameSpacesCache.get(nameToCheck)) {
                                nameSpacesCache.remove(nameToCheck);
                            }
                        },
                        scrollTimeOut,
                        scrollInterval;
                    return function bindWindowAction(nameSpace) {
                        return {
                            on: function (enterCb, cancelCb, elseCb) {
                                enterCb = enterCb || null;
                                cancelCb = cancelCb || null;
                                elseCb = elseCb || null;
                                if (nameSpace && _isString(nameSpace)) {
                                    _addToUsedList(nameSpace);
                                    $(window).on("keypress." + nameSpace, function onWindowActionPress(e) {
                                        var keyCode = e.keyCode || e.which,
                                            $targret = $(e.target);
                                        if ((keyCode === 13) && !$targret.is("textarea") && !$targret.is("[contenteditable]")) {
                                            if ($.isFunction(enterCb)) {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                enterCb(e);
                                            } else {
                                                return keyCode;
                                            }
                                        }
                                    }).on("keyup." + nameSpace, function onWindowActionUp(e) {
                                        var keyCode = e.keyCode || e.which;
                                        if (keyCode === 27) {
                                            if ($.isFunction(cancelCb)) {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                cancelCb(e);
                                            } else {
                                                return keyCode;
                                            }
                                        } else {
                                            if ($.isFunction(elseCb)) {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                elseCb(e, keyCode);
                                            } else {
                                                return keyCode;
                                            }
                                        }
                                    });
                                } else {
                                    that_poseApp.showError({ name: "nameSpace is not defined - unable to register", msg: "", error: nameSpace, caller: "bindWindow > on", throwErr: true });
                                }
                                return this;
                            },
                            onScroll: function (fn) {
                                if (nameSpace && _isString(nameSpace)) {
                                    if ($.isFunction(fn)) {
                                        if (navIs().IOS) {
                                            var prevY = 0,
                                                clinetY = 0,
                                                prentY = 0,
                                                touches;
                                            $(window).on("touchmove." + nameSpace, function (e) {
                                                clearTimeout(scrollTimeOut);
                                                clearInterval(scrollInterval);
                                                touches = e.originalEvent.touches[0];
                                                if (touches.clientY != clinetY) {
                                                    scrollInterval = setInterval(function checkTouchScroll() {
                                                        fn.call(window, e);
                                                    }, 10);
                                                }
                                                prevY = window.scrollY;
                                                clinetY = touches.clientY;
                                                scrollTimeOut = setTimeout(function () { clearInterval(scrollInterval); }, 3000);
                                            });
                                        } else {
                                            $(window).on("scroll." + nameSpace, fn);
                                        }
                                        return this;
                                    }
                                } else {
                                    that_poseApp.showError({ name: "nameSpace is not defined - unable to register", msg: "", error: nameSpace, caller: "bindWindow > on", throwErr: true });
                                }
                            },
                            off: function () {
                                clearInterval(scrollInterval);
                                clearTimeout(scrollTimeOut);
                                $(window).off("." + nameSpace);
                                _removeFromUsedList(nameSpace);
                                return this;
                            },
                            getList: function () {
                                _debug("usedNameSpaces", nameSpacesCache.all());
                                return this;
                            }
                        }
                    }
                }
            },
            loader: {
                type: "factory",
                services: [],
                func: function () {
                    return function (parent, loader) {
                        if ($("#mainCashLoader").length == 0) {
                            $("body").append($("<div>", { id: "mainCashLoader", class: "loaderSpinner", style: "display:none;" }));
                        }
                        var dimentions = function (elem, out) {
                            var dim = {
                                height: 0,
                                width: 0
                            }
                            try {
                                if (out) {
                                    dim.height = $(elem).outerHeight();
                                    dim.width = $(elem).outerWidth();
                                } else {
                                    dim.height = $(elem).height();
                                    dim.width = $(elem).width();
                                }
                                if (dim.height == null) {
                                    dim.height = 0
                                    dim.width = 0
                                }
                                return dim;
                            } catch (e) {
                                return dim;
                            }
                        },
                            loader = ((_isUndefined(loader)) || (dimentions(loader, 1).height == 0)) ? $("#mainCashLoader") : loader,
                            loaderW = dimentions(loader, 1).width,
                            loaderH = dimentions(loader, 1).height,
                            parent = ((_isUndefined(parent)) || (dimentions(parent).height <= loaderH || dimentions(parent).width <= loaderW)) ? window : parent,
                            parLeft, parTop, parHeight, parWidth, newTop, listenerActive = false,
                            reposition = function () {
                                parHeight = dimentions(parent).height,
                                parWidth = dimentions(parent).width,
                                parLeft = (parent == window) ? 0 : $(parent).offset().left,
                                parTop = (parent == window) ? 0 : $(parent).offset().top,
                                newLeft = parseInt(((parWidth - loaderW) / 2) + parLeft),
                                newTop = parseInt(((parHeight - loaderH) / 2) + parTop);
                            },
                        public_loader = {
                            show: function (parentShow, loaderShow) {
                                loader = ((_isUndefined(loaderShow)) || (dimentions(loaderShow, 1).height == 0)) ? $("#mainCashLoader") : loaderShow;
                                parent = ((_isUndefined(parentShow)) || (dimentions(parentShow).height <= dimentions(loader).height || dimentions(parentShow).width <= dimentions(loader).width)) ? window : parentShow;
                                reposition();
                                $(loader).css({ "top": newTop + "px", "left": newLeft + "px" }).toShow();
                                if (!listenerActive && !_navIs.IOS) {
                                    $(window).off(".crLoader").on("resize.crLoader orientationchange.crLoader", function () {
                                        public_loader.show(parent, loader);
                                    });
                                    listenerActive = true;
                                }
                            },
                            hide: function () {
                                $(loader).hide();
                                $(window).off(".crLoader");
                                listenerActive = false;
                            },
                        }
                        return public_loader;
                    }
                }
            }
        },
        _directives = {
            ngRepeat: {
                name: "ngRepeat",
                services: ["compile"],
                func: function (compile) {
                    return {
                        restrict: "A",
                        priority: "9999",
                        link: function (elem, attr, scope) {
                            var dataFn = attr.ngRepeat.split(" in "),
                                child = dataFn[0],
                                innerScope = "",
                                tmplClone,
                                eachObj,
                                limit = attr.limit,
                                templ = elem.contents();
                            elem.empty();
                            try {
                                innerScope = _$eval("{scope." + [dataFn[1]] + "}", scope);
                                if ($.isArray(innerScope)) {
                                    if (limit) {
                                        limit = _$eval(limit, scope);
                                        if (!$.isNumeric(limit) || limit >= innerScope.length) {
                                            limit = innerScope.length;
                                        }
                                    } else {
                                        limit = innerScope.length;
                                    }
                                    //_debug("innerScope", innerScope);
                                    $.each(innerScope, function (k, v) {
                                        if (k < limit) {
                                            eachObj = {};
                                            eachObj[child] = v;
                                            eachObj[child].$$key = k;
                                            try {
                                                tmplClone = compile.compileApply(templ.clone(true), eachObj, scope);
                                                elem.append(tmplClone);
                                            } catch (e) {
                                                _warn(e.name, e.message, e.stack);
                                            }
                                        }
                                    });
                                }
                            } catch (e) {
                                //_warn("ngRepeat " + e.name, e.message, e.stack, scope);
                            }
                            elem.removeAttr("limit");
                            return elem;
                        }
                    }
                }
            },
            ngRemove: {
                name: "ngRemove",
                services: [],
                func: function () {
                    var public_ngRemove = {
                        restrict: "A",
                        priority: "9998",
                        link: function (elem, attr, scope) {
                            var stringToCheck = attr.ngRemove,
                                standIn;
                            try {
                                stringToCheck = _$eval(stringToCheck);
                                if (stringToCheck || stringToCheck == "true" || stringToCheck == "1") {
                                    standIn = $("<!--" + elem.prop("tagName").toLowerCase() + "-removed-->");
                                    elem.replaceWith(standIn);
                                }
                            } catch (e) {
                                _warn("ngRemove " + e.name, e.message, e.stack, scope);
                            }
                            return elem;
                        }
                    }
                    return public_ngRemove;
                }
            },
            ngShow: {
                name: "ngShow",
                services: [],
                func: function () {
                    var that_ngShow = {
                        restrict: "A",
                        link: function (elem, attr, scope) {
                            var stringToCheck = attr.ngShow;
                            try {
                                stringToCheck = _$eval(stringToCheck);
                                if (!stringToCheck || stringToCheck == "" || stringToCheck == "false" || stringToCheck == "0") {
                                    elem.hide();
                                } else {
                                    elem.toShow();
                                }
                            } catch (e) {
                                _warn("ngShow " + e.name, e.message, e.stack, scope);
                            }
                            return elem;
                        }
                    }
                    return that_ngShow;
                }
            },
            ngDisabled: {
                name: "ngDisabled",
                services: [],
                func: function () {
                    var public_ngDisabled = {
                        restrict: "A",
                        link: function (elem, attr, scope) {
                            var stringToCheck = attr.ngDisabled;
                            try {
                                stringToCheck = _$eval(stringToCheck);
                                if (!stringToCheck || stringToCheck == "" || stringToCheck == "false" || stringToCheck == "0") {
                                    elem.prop("disabled", false);
                                } else {
                                    elem.prop("disabled", true);
                                }
                            } catch (e) {
                                _warn("ngDisabled " + e.name, e.message, e.stack, scope);
                            }
                            return elem;
                        }
                    }
                    return public_ngDisabled;
                }
            },
            ngReadonly: {
                name: "ngReadonly",
                services: [],
                func: function () {
                    var public_ngReadonly = {
                        restrict: "A",
                        link: function (elem, attr, scope) {
                            var stringToCheck = attr.ngReadonly;
                            try {
                                stringToCheck = _$eval(stringToCheck);
                                if (!stringToCheck || stringToCheck == "" || stringToCheck == "false" || stringToCheck == "0") {
                                    elem.prop("readonly", false);
                                    if (elem.is("input[type='text']")) {
                                        elem.prop("disabled", false);
                                    }
                                } else {
                                    elem.prop("readonly", true);
                                    if (elem.is("input[type='text']")) {
                                        elem.prop("disabled", true);
                                    }
                                }
                            } catch (e) {
                                _warn("ngReadonly " + e.name, e.message, e.stack, scope, stringToCheck);
                            }
                            return elem;
                        }
                    }
                    return public_ngReadonly;
                }
            },
            ngClick: {
                name: "ngClick",
                services: [],
                func: function () {
                    var public_ngClick = {
                        restrict: "A",
                        link: function (elem, attr, scope) {
                            var fnObj = _parseObj.evalFn(scope, attr.ngClick);
                            try {
                                if ($.isFunction(fnObj.fn)) {
                                    elem.onClick(function (e) {
                                        fnObj = _parseObj.evalFn(scope, attr.ngClick);
                                        fnObj.params.push(this);
                                        fnObj.params.push(e);
                                        fnObj.fn.apply(this, fnObj.params);
                                    });
                                }
                            } catch (e) {
                                _warn("ngClick " + e.name, e.message, e.stack, scope);
                            }
                            return elem;
                        }
                    }
                    return public_ngClick;
                }
            },
            ngClass: {
                restrict: "A",
                link: function (elem, attr, scope) {
                    var dataFn = attr.ngClass.trim().split(":"),
                        condition = dataFn[0],
                        onTrue = dataFn[1],
                        onFalse = dataFn[2],
                        testCondition = _$eval("{" + condition + "}", scope);
                    templ = elem.contents();
                    if (testCondition) {
                        elem.addClass(onTrue);
                    } else {
                        if (!_isUndefined(onFalse) && onFalse.length) {
                            elem.addClass(onFalse);
                        }
                    }
                    return elem;
                }
            },
            registered: {
                list: [],
                nameList: []
            }
        },
        /**
         * _extendMethods
         * @description
            the request function for all injectables.
            when a module requests any injectable (service/factory/constant) component poseApp searches for the injectable instance
            in that module's archive. if an instance was found it will return it.
            if the injectable has been registered but never run (factory/new service) it will return a new Instance
            and if it's a singletone type it will save the instance.
            if the requested injecteble was not found in either registery it will return a warning;

            every injectable, controllers and directives use this function for dependancy injection
         * @param methodeName{string} 
                the injectable name ie "$http"
         * @param serviceHolder{object}
                the services holder object for the requesting module
         * @param moduleRoot{object}
                the rootScope for the module
         * @param moduleId{string}
                the name of the module to retrieve the injectable from.
         * @returns
         *
         **/
        _extendMethods = function (methodeName, serviceHolder, moduleRoot, moduleId) {
            var toInject = [];
            moduleRoot = moduleRoot || {};
            moduleId = moduleId || "ps";
            serviceHolder = serviceHolder || _holdServices;
            if (_registered.hasOwnProperty(methodeName)) {
                if (_registered[methodeName].hasOwnProperty("func")) {
                    if ($.isFunction(_registered[methodeName].func)) {
                        if (_registered[methodeName].type == "service" || _registered[methodeName].type == "factory") {
                            if (_registered[methodeName].services && _registered[methodeName].services.length) {
                                $.each(_registered[methodeName].services, function (k, v) {
                                    toInject.push(_extendMethods(v, serviceHolder, moduleRoot, moduleId));
                                });
                            }
                            if (_registered[methodeName].type == "service") {
                                if (serviceHolder.hasOwnProperty(methodeName)) {
                                    return serviceHolder[methodeName];
                                } else {
                                    serviceHolder[methodeName] = _bindMethods(_registered[methodeName].func, toInject);
                                    return serviceHolder[methodeName];
                                }
                            } else {
                                return _bindMethods(_registered[methodeName].func, toInject);
                            }
                        } else {
                            console.warn("poseApp unable to load service: " + methodeName + " is not a service");
                        }
                    } else {
                        console.warn("poseApp unable to register service: " + methodeName + " is not a function");
                    }
                } else {
                    if (_registered[methodeName].type == "const") {
                        if (_registered[methodeName].hasOwnProperty("val")) {
                            return _registered[methodeName].val;
                        }
                    } else {
                        console.warn("poseModule unable to register service: " + methodeName + " is not defined");
                    }
                }
            } else {
                if (methodeName == "$rootScope") {
                    return moduleRoot;
                } else if (methodeName == "moduleId") {
                    return moduleId;
                } else {
                    console.warn("poseModule unable to register service: " + methodeName + " is not defined");
                }
            }
        },
        /**
         * _registerConst
         * @description
         * register new contant to the poseApp "ps" module
         *
         * @param key{string} nkey to use for this constant
         * @param val{*} value to assign to this key
         *
         **/
        _registerConst = function (key, val) {
            if (!_registered.hasOwnProperty(key)) {
                _registered[key] = {
                    type: "const",
                    val: val
                };
            }
        },
        /**
         * _buildModule
         * @description
         * used in the public poseApp.module to createa new module if the named module doesn't already exist 
         * constructs the module object.
         *
         * @param id{string} nkey to use for this constant
         * @param injectable1, injectable2...{strings} controllers and injectables to invoke and save to the module.
         *
         **/
        _buildModule = function (id) {
            var args = Array.prototype.slice.call(arguments, 1),
                runFn = $.noop;
            //private injectable instances
            methods = {},
            //public injectable instances 
            servHolder = {},
            //rootScope holding all module saved data.
            moduleData = {
                root: {
                    settings: {},
                    lang: {},
                    callbacks: {}
                },
            },
            initDone = $.Deferred(),
            //create instances and sort registered directives by priority 
            addDirectives = function () {
                var registered = _directives;
                var dashName, toInject;
                var getDirectivesByPriority = function () {
                    var directivesArr = $.map(_directives.registered, function (v, k) {
                        if ($.isPlainObject(v)) {
                            return v;
                        }
                    });
                    return directivesArr.sort(function (a, b) {
                        var prA = a.priority,
                            prB = b.priority,
                            prDiff = (prB - prA);
                        if (prDiff == 0) {
                            prA = $.inArray(a.dataName, _directives.registered.nameList);
                            prB = $.inArray(b.dataName, _directives.registered.nameList);
                            return (prA - prB);
                        } else {
                            return prDiff;
                        };
                    });
                };
                $.each(registered, function (i, n) {
                    toInject = [];
                    if ($.isFunction(_directives[i].func)) {
                        if (!_directives.registered.hasOwnProperty(i)) {
                            if (n.services && n.services.length) {
                                $.each(n.services, function (k, v) {
                                    toInject.push(extendMethods(v));
                                });
                            }
                            dashName = i.split(/(?=[A-Z])/).join("-").toLowerCase();
                            _directives.registered[dashName] = new buildDirective(n, toInject);
                            _directives.registered.nameList.push(dashName);
                            _directives.registered.list = getDirectivesByPriority();
                        }
                    }
                });
            },
            //decorate directive and bind link functions to directive application.
            genDirectiveFunctions = function () {
                var that_directive = this;
                this.applyDir = function (effectedElem, scope) {
                    //var dirhtml = $(html);
                    var attr = {}, newElem;
                    $.each(effectedElem.attributes, function (i, n) {
                        attr[n.name] = n.value;
                    });
                    if (that_directive.restrict.indexOf("A") != -1) {
                        attr[that_directive.registeredName] = _$eval(attr[that_directive.dataName], scope);
                    }
                    //_debug("genDirectiveFunctions", that_directive, attr);
                    newElem = that_directive.link($(effectedElem), attr, scope);
                    newElem.removeAttr(that_directive.dataName);
                    return newElem;
                }
            },
            //set up directive registered object according to settings and defaults.
            buildDirective = function (dirObj, toInject) {
                var dir = (dirObj.func).apply(dirObj.func, toInject);
                if (!dir.hasOwnProperty("restrict")) {
                    dir.restrict = "A";
                }
                if (!dir.hasOwnProperty("link")) {
                    dir.link = function (elem, attr, scope) { return elem };
                }
                if (!dir.hasOwnProperty("priority") || isNaN(dir.priority)) {
                    dir.priority = 1;
                }
                dir.registeredName = dirObj.name;
                genDirectiveFunctions.call(dir, "");
                dir.dataName = dirObj.name.split(/(?=[A-Z])/).join("-").toLowerCase();
                return dir;
            },
            //save injectable instances to either private or public archive using the global _extendMethods function.
            extendMethods = function (methodeName, internal) {
                if (_registered.hasOwnProperty(methodeName)) {
                    if (internal) {
                        if (!methods.hasOwnProperty(methodeName)) {
                            return _extendMethods(methodeName, methods, moduleData.root, id);
                        }
                        return methods[methodeName];
                    } else {
                        return _extendMethods(methodeName, servHolder, moduleData.root, id);
                    }
                }
                else {
                    if (methodeName == "$rootScope") {
                        return moduleData.root;
                    } else if (methodeName == "moduleId") {
                        return id;
                    } else {
                        console.warn("poseModule unable to register service: " + methodeName + " is not defined");
                    }
                }
            },
            //setup the "rootLang" object according to user options.
            getStartUpLang = function () {
                var curLang = methods.manageData.getKeys("personalLang") || "";
                if (!moduleData.root.hasOwnProperty("lang")) {
                    moduleData.root.lang = {};
                }
                if (!moduleData.root.settings.hasOwnProperty("curLang")) {
                    moduleData.root.settings.curLang = "";
                    methods.manageData.updateSavedData(moduleData.root.settings, "settings");
                }
                if ((moduleData.root.settings.curLang != curLang) || $.isEmptyObject(moduleData.root.lang)) {
                    //set lang has changed update lang object
                    moduleData.root.lang = {};
                    methods.getLang.callLang(moduleData.root.lang, curLang, that_poseApp.location);
                }

                $.when(moduleData.root.lang).done(function (data) {
                    moduleData.root.lang = data;
                    moduleData.root.settings.curLang = curLang;
                    methods.manageData.updateSavedData(moduleData.root.settings, "settings");
                    _debug("lang from scope", moduleData.root.lang);
                }).fail(that_poseApp.showError);
            },
            //public module functions
            public_poseModule = {
                data: moduleData,
                //expects and array of injectables, controllers to run and save to the module archive
                extend: function (req) {
                    if (typeof req == "object") {
                        $.when(moduleData.root.lang, initDone).done(function () {
                            $.each(req, function (i, n) {
                                if (_registered.hasOwnProperty(n)) {
                                    if ($.isFunction(_registered[n].func)) {
                                        if (_registered[n].type == "controller") {
                                            var toInject = [];
                                            if (!moduleData.hasOwnProperty(n)) {
                                                moduleData[n] = {};
                                                if (_registered[n].services && _registered[n].services.length) {
                                                    $.each(_registered[n].services, function (k, v) {
                                                        toInject.push(extendMethods(v));
                                                    });
                                                }
                                                toInject.unshift(moduleData[n]);
                                                return _bindMethods(_registered[n].func, toInject);
                                            } else {
                                                return moduleData[n];
                                                //console.warn("poseModule unable to load controller: " + n + " is already registered");
                                            }
                                        } else {
                                            extendMethods(n);
                                        }
                                    } else {
                                        console.warn("poseModule unable to load service: " + n + " is not a function");
                                    }
                                } else {
                                    console.warn("poseModule unable to load reuested item: " + n + " was not registered");
                                }
                            });
                        }).fail(that_poseApp.showError);
                    } else {
                        console.warn("poseModule unable to load service: " + req + " is not an object")
                    }
                    return public_poseModule;
                },
                //publish injectables
                publish: function (methodeName) {
                    return extendMethods(methodeName);
                },
                //publish controllers
                publishCtrl: function (ctrlName) {
                    if (moduleData.hasOwnProperty(ctrlName)) {
                        return moduleData[ctrlName];
                    } else {
                        public_poseModule.extend(ctrlName);
                        return moduleData[ctrlName];
                    }
                },
                //register a contant to the module. contants can not be overwritten
                constant: function (key, val) {
                    _registerConst(key, val);
                    return public_poseModule;
                },
                //function to run on bootstrap
                run: function (fn) {
                    if ($.isFunction(fn)) {
                        runFn = fn;
                    }
                    return public_poseModule;
                }
            },
            _modules[id].init = function () {
                $.when(moduleData.root.lang).then(function () {
                    runFn();
                    //update data if there is something in storage
                    methods.manageData.updateSavedData(moduleData.root.settings, "settings", true);
                    addDirectives();
                    initDone.resolve();
                    //include all extentions and methods
                    if (args.length) { public_poseModule.extend(args); };
                    return public_poseModule;
                }, that_poseApp.showError);
            }
            //add methods to the scope
            extendMethods("manageData", true);
            extendMethods("getLang", true);
            getStartUpLang();
            return public_poseModule;
        },
        //ninja message to run if needed before rootLang is ready
        _noLangErrorBox = function (errObj) {
            var errDefaults = {
                error: "unknown error",
                caller: "unknown caller",
                cb: null,
                showMsg: false,
                msg: ""
            };
            errObj = $.extend(errDefaults, errObj);
            _warn("initial Error", "caller: " + errObj.caller, "data", errObj.error);
            if (errObj.showMsg) {
                $.modal("<div class='lightboxFlex' style='width:400px;height:250px;'>" +
                            "<h1>Oops</h1>" +
                            "<div class='lightboxInner'>" +
                                "<p><span class='bold'>Something went wrong,<br>the ninjas are working on it.</span>" +
                                    "<br/><br/>For more info please contact support at:<br/>" +
                                    "<a href='support@getpose.com'>support@getpose.com</a>." +
                                "</p>" +
                            "</div>" +
                            "<div class='lightboxButtonAction'>" +
                                "<input type='button' value='OK' class='center green btn smallGreen' />" +
                            "</div>" +
                        "</div>", {
                            onShow: function (dialog) {
                                $("input", dialog.data).fastClick(function () {
                                    $.modal.close();
                                });
                            },
                            onClose: function () {
                                if ($.isFunction(errObj.cb)) {
                                    errObj.cb();
                                }
                                $.modal.close();
                            }
                        });
                //alert("Something went wrong,the ninjas are working on it.For more info please contact support at:support@getpose.com");
            }
        },
        /**
         * _regExt
         * @description
         * register new constructor to the poseApp "ps" module
         * this i used in the poseApp.service, poseApp.controller etc functions.
         *
         * @param type{string} controller, service, factory, directive, constant
         * @param name{string} extention name
         * @param req{array} services and factories to inject
         * @param contructor{function} constructor function
         *
         **/
        _regExt = function (type, name, req, contructor) {
            if (!_registered.hasOwnProperty(name)) {
                var extention = {
                    func: contructor,
                    services: req,
                    type: type
                }
                _registered[name] = extention;
            } else {
                console.warn("poseApp " + type + " " + name + "already exists");
            }
            return that_poseApp;
        },
        /**
         * _module
         * @description
         * used to register or get modules.
         * modules are a collection of services, controllers, and directives instances 
         * as well as constants saved to the specific mudule.
         * service instances are saved upon injection.
         * controllers are saved upon bootstarp or by extending the mudule after bootstrap
         *
         * @param name{string} controller, service, factory, directive, constant
         *
         **/
        _module = function (name) {
            if (!_modules.hasOwnProperty(name)) {
                _modules[name] = {};
                _modules[name].public = _buildModule.apply(this, arguments);
            }
            return _modules[name].public;
        },
        /**
         * _debug
         * @description
         * used as a clearable grouped console log.
         * logging will only occure if _debugMode is set to true or a #debug is found in the location url.
         * _debug will also log the stack leading to the call.
         *
         * @param msg{string} title for the log group
         * @param a, b...... {*} paramters can be as many as javascript will allow and will each add a new line to the group
         *
         **/
        _debug = function (msg) {
            if (that_poseApp.debugMode || (location.hash == "#debug")) {
                var log,
                    cleanUrls = function (stringToCheck) {
                        if (_isString(stringToCheck) && stringToCheck.substring(0, 4) == "http") {
                            stringToCheck = "removed http > " + stringToCheck.replace(/http:|https:/g, "");
                        }
                        return stringToCheck;
                    };
                if ($.isFunction(console.debug)) {
                    log = "debug";
                } else {
                    log = "log";
                }
                console.groupCollapsed(cleanUrls(msg));
                Array.prototype.shift.call(arguments);
                for (var i = 0 ; i < arguments.length ; i++) {
                    console[log](cleanUrls(arguments[i]));
                }
                console.trace();
                console.groupEnd();
            }
            return that_poseApp;
        },
        /**
         * _getStackTrace
         * @description
         * used to get the error object stack traces for inclusion in _showError and emailing
         **** will not work in safari.
         *
         **/
        _getStackTrace = function () {
            var obj = {};
            if (Error.captureStackTrace) {
                Error.captureStackTrace(obj, _getStackTrace);
            } else if (Error.stacktrace) {
                Error.stacktrace(obj, _getStackTrace);
            } else {
                obj.stack = "captureStackTrace_unavailable"
            }
            return obj.stack;
        },
        /**
         * _sendErrorMail
         * @description
         * used to track error and send to developers
         *
         * @param mailSubject{string} title for the email
         * @param mailBody{string} body for the email
         * @param tryAgain{boolean} internal will set if sending failed once
         *                          and will try to escape the message again and resend in case a charchter broke the function
         *
         **/
        _sendErrorMail = function (mailSubject, mailBody, tryAgain) {
            tryAgain = tryAgain || false;
            var manageDatService = _extendMethods("manageData"),
                $httpService = _extendMethods("$http"),
                allLocalStorage = manageDatService.emailObject(manageDatService.getData()),
                dataString = "";

            mailBody += " trace: " + escape(_getStackTrace());
            if (tryAgain) {
                dataString = "mailSubject=" + escape(mailSubject) + "&mailBody=" + escape(escape(mailBody)) + "&localStorage=" + escape(escape(allLocalStorage));
            } else {
                dataString = "mailSubject=" + escape(mailSubject) + "&mailBody=" + escape(mailBody) + "&localStorage=" + escape(allLocalStorage);
            }
            $httpService({
                async: true,
                data: dataString,
                cache: false,
                timeout: 10000,
                type: "POST",
                dataType: "html",
                url: "/Offline/extra/sendErrorEmail.aspx"
            }).success(function (data, status, req) {
                _warn("Error email sent");
            }).error(function (errData) {
                //total update failed
                if (!tryAgain && (errData.status == 500)) {
                    _warn("Failed to send error email trying again.", errData.status);
                    _sendErrorMail(mailSubject, mailBody, true);
                } else {
                    _warn("Failed to send error email.", errData.status);
                }
            });
            return that_poseApp;
        },
        /**
         * _warn
         * @description
         * used log grouped warnings
         *
         * @param msg{string} title for the log group
         * @param a, b...... {*} paramters can be as many as javascript will allow and will each add a new line to the group
         *
         **/
        _warn = function (msg) {
            console.groupCollapsed(msg);
            for (var i = 0 ; i < arguments.length ; i++) {
                console.warn(arguments[i]);
            }
            console.trace();
            console.groupEnd();
            return that_poseApp;
        },
        _parseObj = {
            /**
             * _parseObj.evalFn
             * @description
             * evaluate function from string according to specified scope.used in services or directives.
             *
             * @param scope{object} scope to look for the function in
             * @param stringToCheck{string/fn} 
             *              if string:
             *                 the function is seperated from parameters and evaluated against the scope;
             *              if function
             *                 the function is returned without any parameters
             *
             * @returns {object}
             * fn{function}: the evaluated function,
             * params{array}: evaluated parameters passed to the function
             **/
            evalFn: function (scope, stringToCheck) {
                if (stringToCheck && _isString(stringToCheck)) {
                    var indexParams = stringToCheck.indexOf("("),
                    fn = null,
                    params = [],
                    pattern = new RegExp("[()]", "g");

                    try {
                        if (indexParams >= 0) {
                            fn = eval(stringToCheck.substring(0, indexParams));
                            params = stringToCheck.substr(indexParams);
                            params = params.replace(pattern, "");
                            if (params.length) {
                                params = params.split(",");
                                $.each(params, function (k, v) {
                                    params[k] = eval(v);
                                });
                            } else {
                                params = [];
                            }
                        } else {
                            fn = eval(stringToCheck);
                        }
                        return {
                            fn: fn,
                            params: params
                        }
                    } catch (e) {
                        _warn("evalFn " + e.name, e.message, e.stack, scope);
                        return {
                            fn: null,
                            params: []
                        }
                    }
                } else if ($.isFunction(stringToCheck)) {
                    return {
                        fn: stringToCheck,
                        params: []
                    }
                } else {
                    return {
                        fn: null,
                        params: []
                    }
                }
            },
            jString: function (dataObj) {
                //JSON.Stringify
                try {
                    if (_isObjectType(dataObj)) {
                        return JSON.stringify(dataObj);
                    } else {
                        _debug("not an object");
                        return dataObj;
                    }
                } catch (e) {
                    _warn("parseObj.jsonStr error: " + e.name, e.message, e.stack, dataObj);
                    return dataObj;
                }
            },
            jObj: function (dataObj) {
                //JSON.parse
                try {
                    if (typeof dataObj == "string") {
                        return JSON.parse(dataObj);
                    } else {
                        return dataObj;
                    }
                } catch (e) {
                    _warn("parseObj.jsonObj error: " + e.name, e.message, e.stack, dataObj);
                    return dataObj;
                }
            }
        },
        /**
        * _$eval
        * @description
        * evaluate any string according to the scope specified.
        *
        * @param stringToCheck{string} string to evaluate.
        * @param scope{object} scope to evaluate against.
        *
        * @returns {*}
        * single curly brackets that include the word "scope." will be evaluated against the scope by regular window.eval
        * double curly brackets will be avaluated using the compiler
        * anything else will be returned as it is.
        **/
        _$eval = function (stringToCheck, scope) {
            if (RegExp("({{.+}})").test(stringToCheck)) {
                stringToCheck = _extendMethods("compile").compileApply(stringToCheck, scope);
            } else if (RegExp("^({(.+|)scope\\..+})$").test(stringToCheck)) {
                stringToCheck = eval(stringToCheck);
            }
            return stringToCheck;
        },
        /**
        * _addaDeviceTypeClass
        * @description
        * add a class to the element according to recognized devices and features according the the navIs() function.
        ***relise on the navIS function provided in "browserDetection.js"
        *
        * @param bodyElem{jQuery object} the elemnet to attach classes to.
        *
        **/
        _addaDeviceTypeClass = function (bodyElem) {
            if (bodyElem && _isjQuery(bodyElem)) {
                $.each(_navIs, function (k, v) {
                    if (v) {
                        bodyElem.addClass("is_" + k);
                    }
                });
                if (!_navIs.touch) {
                    bodyElem.addClass("no-touch");
                }
            }
            return bodyElem;
        },
        _inHouseSwipe = ["Tranzila"],
        _isInHouseSwipe = function (procToCheck) {
            return (_inHouseSwipe.indexOf(procToCheck) != -1) ? 1 : 0;
        },
        /**
        * _isEqualObjects
        * @description
        * compares two object or arrays to see if they are equal.
        * used mostley to check for changes in settingd and form edits. products, customers etc...
        * knows to ignore the "$$key" key that is added by repeaters
        *
        * @param obj1{object} object to compare to.
        * @param obj2{object} object to compare to.
        * @param debug{boolean} log found changes. defaults to false.
        *
        **/
        _isEqualObjects = function (obj1, obj2, debug) {
            debug = debug || 0;
            if (_isObjectType(obj1) && _isObjectType(obj2)) {
                var obj1Length = _objLength(obj1),
                    obj2Length = _objLength(obj2),
                    objA = obj1,
                    objB = obj2,
                    isEqual = false;

                if (obj1Length < obj2Length) {
                    objA = obj2,
                    objB = obj1;
                }
                if (obj1Length == 0 && obj2Length == 0) {
                    return true;
                } else {
                    $.each(objA, function (k, v) {
                        if (k != "$$key") {
                            if (v == objB[k]) {
                                isEqual = true;
                            } else {
                                if (_isObjectType(v) && _isObjectType(objB[k])) {
                                    isEqual = _isEqualObjects(v, objB[k]);
                                    if (!isEqual) {
                                        return false;
                                    }
                                } else {
                                    if (debug) {
                                        _debug("noEqual", k, v, objB[k], objB);
                                    }
                                    isEqual = false;
                                    return false;
                                }

                            }
                        }
                    });
                    return isEqual;
                }
            } else {
                return (obj1 === obj2);
            }
        },
        /**
        * _isObjectInArray
        * @description
        * acts as a "indexOf" for objects in arrays.
        *
        * @param obj{object} object to search for.
        * @param findIn{array} array to search in. 
        *
        * @returns {number}
        *           if found the index position of the object
        *           if not found reurns -1
        **/
        _isObjectInArray = function (obj, findIn) {
            var arrayPosition = -1;
            if ($.isPlainObject(obj) && $.isArray(findIn)) {
                $.each(findIn, function (arrK, arrV) {
                    if ($.isPlainObject(arrV)) {
                        if (_isEqualObjects(arrV, obj)) {
                            arrayPosition = arrK;
                            return false;
                        }
                    }
                });
                return arrayPosition;
            } else {
                return arrayPosition;
            }
        },
        /**
        * _isObjectInArray
        * @description
        * acts as a "indexOf" for arrays in arrays.
        *
        * @param obj{array} array to search for.
        * @param findIn{array} array to search in. 
        *
        * @returns {number}
        *           if found the index position of the array
        *           if not found reurns -1
        **/
        _isArrayInArray = function (arr, findIn) {
            var stringAr = arr.join("_"), stringFindIn, arrayPosition, i, val;
            if (findIn.length) {
                for (i = 0; i < findIn.length; i++) {
                    val = findIn[i];
                    stringFindIn = val.join("_");
                    if (stringFindIn != stringAr) {
                        arrayPosition = -1;
                        continue;
                    } else {
                        arrayPosition = i;
                        return arrayPosition;
                    }
                }
            } else {
                arrayPosition = -1;
            }
            return arrayPosition;
        },
        /**
        * _mergeArrays
        * @description
        * merge multiple arrays to one. used instead of jQuery's $.merge since theh latter doesn't check inside objects and arrays.
        *
        * @param copy{boolean} create a new array to extend the first array given.
        ** if copy is an array the "copy" will be false and the array itsel is extended.
        * @param array1, array1.. multiple are arrays are possibble and will be extended by order  
        *
        **/
        _mergeArrays = function (copy) {
            var combinedArrays = [],
                mergeTwoArr = function (arr1, arr2) {
                    var newArray = [];
                    if ($.isArray(arr1) && $.isArray(arr2)) {
                        if (arr1.length) {
                            newArray = arr1;
                            $.each(arr2, function (k, v) {
                                if (_isObjectType(v)) {
                                    if ($.isPlainObject(v)) {

                                        if (_isObjectInArray(v, newArray) == -1) {
                                            newArray.push(v);
                                        }
                                    } else if ($.isArray(v)) {
                                        if (_isArrayInArray(v, newArray) == -1) {
                                            newArray.push(v);
                                        }
                                    }
                                } else if (!_isUndefined(v)) {
                                    if ($.inArray(v, newArray) == -1) {
                                        newArray.push(v);
                                    }
                                }
                            });
                        } else {
                            newArray = newArray.concat(arr2);
                        }
                        return newArray;
                    } else {
                        return $.isArray(arr1) ? arr1 : $.isArray(arr2) ? arr2 : [];
                    }
                };
            if (copy === true) {
                Array.prototype.shift.call(arguments);
                Array.prototype.unshift.call(arguments, combinedArrays);
            }
            combinedArrays = arguments[0];
            for (var i = 0; i < arguments.length - 1; i++) {
                combinedArrays = mergeTwoArr(combinedArrays, arguments[(i + 1)]);
            }
            return combinedArrays;
        },
        /**
        * _extendExistingOnly
        * @description
        * merge two objects but ignore new keys that don't exit in the original object.
        *
        * @param objTarget{object} orginal object to extent.
        * @param objSrc{object} object to extent from.  
        *
        **/
        _extendExistingOnly = function (objTarget, objSrc) {
            if (_isObjectType(objTarget) && _isObjectType(objSrc)) {
                var updatedObj = {};
                $.each(objTarget, function (k, v) {
                    if (objSrc.hasOwnProperty(k)) {
                        if (_isObjectType(v) && _isObjectType(objSrc[k])) {
                            updatedObj[k] = _extendExistingOnly(v, objSrc[k]);
                        } else {
                            updatedObj[k] = objSrc[k];
                        }
                    }
                });
                return $.extend(true, {}, updatedObj);
            } else {
                return objSrc;
            }
        },
        _isUndefined = function (toCheck) {
            return (typeof toCheck === "undefined" || toCheck === null);
        },
        _isArray = function (toCheck) {
            return toCheck instanceof Array;
        },
        _isObject = function (toCheck) {
            return (toCheck instanceof Object && !$.isArray(toCheck));
        },
        _isObjectType = function (toCheck) {
            return toCheck instanceof Object;
        },
        _isDate = function (toCheck) {
            if (toCheck instanceof Date) {
                return (!isNaN(toCheck.getTime()));
            } else {
                return false;
            }
        },
        _isBoolean = function (toCheck) {
            return (typeof toCheck === "boolean");
        },
        _isParsedObject = function (toCheck) {
            if (typeof toCheck === "string" && ((toCheck.indexOf("{") != -1) || (toCheck.indexOf("[") != -1))) {
                try {
                    JSON.parse(toCheck);
                    return true;
                } catch (e) {
                    return false;
                }
            } else {
                return false;
            }
        },
        _isString = function (toCheck) {
            return (typeof toCheck == "string");
        },
        _objLength = function (obj) {
            return $.map(obj, function (v, k) { return k; }).length;
        },
        _isjQuery = function (elem) {
            if (_isObject(elem) && $.isFunction(elem.find)) {
                return true;
            } else {
                return false;
            }
        },
        _pre = {
            offline: "offline",
            online: "online",
            receipt: "receipt",
            cart: "cart",
            invoice: "invoice",
            giftReceipt: "gift",
            ccSlip: "ccslip",
            modal: "modal",
            iframe: "iframe",
            printers: "printers",
            scanners: "scanners",
            drawers: "drawers",
            percent: "p",
            amount: "a",
            total: "total",
            all: "all",
            cr: "cr",
            management: "management",
            refund: "refund",
            charge: "charge",
            pro: "pro",
            lite: "lite",
            next: "next",
            prev: "prev",
            error: "error",
            main: "main",
            partners: ["North American Bancard"],
            allowedWithPartner: ["external", "payPal"]
        },
        //future feature. run all modal throughone function and it will catch any error or if modals over modals are needed.
        _modal = function (html, options) {
            try {
                if ($(html).modal) {
                    $(html).modal(options);
                } else {
                    $.modal(html, options);
                }
            } catch (e) {
                that_poseApp.showError({
                    error: e.name,
                    msg: e.message,
                    caller: e.stack
                });
                //TODO add our backup modal
            }
        };
    (function modalSetUp() {
        //save th original modal.close function
        var orgClose = $.modal.close;
        var orgBind = $.modal.impl.bindEvents;
        var fullWrap = $("<div>", { id: "modalFullWrap", style: "position:fixed;top:0;left:0;z-index: 1002;" });
        //setup defaults for all modals
        var poseDefaults = {
            appendTo: "body",
            autoResize: false,
            modal: true,
            close: false,
            openCb: null,
            pop: true,
            holdPop: false,
            selfClose: false,
            ID: ""
        }
        $.extend($.modal.defaults, poseDefaults);
        $.modal.stillClosing = false;
        $.modal.frame = function (frameString, size, modalOpts) {
            //size [height, width];
            modalOpts = modalOpts || {};
            var onShowFn = null;
            if (modalOpts.hasOwnProperty("onShow")) {
                onShowFn = modalOpts.onShow;
            }
            $.modal("<div class='modalFrame' style='height:" + size[0] + "px;width:" + size[1] + "px;overflow:hidden;'></div>", $.extend(modalOpts, {
                onShow: function (dialog) {
                    $(".modalFrame", dialog.data).html(frameString);
                    if ($.isFunction(onShowFn)) {
                        onShowFn(dialog);
                    }
                }
            }));
        }
        $.modal.pop = function () {
            $.modal.impl.d.container.addClass("popBox");
            if (typeof hideCrLoader != "undefined") {
                hideCrLoader(); //TODO remove once all hideCrLoader become poseApp.loader.hide();
            };
            if (typeof hideLoader != "undefined") {
                hideLoader();//TODO remove once all hideLoader become poseApp.loader.hide();
            };
            that_poseApp.loader.hide();
        }

        $.modal.unpop = function () {
            $.modal.impl.d.container.removeClass("popBox");
        }
        //in ios the focus event and fixed positioning cause issues so remove them;
        if (_navIs.IOS) {
            $.modal.defaults.fixed = false;
            fullWrap.css("position", "absolute");
        }
        //dont apply resize, esc and tab events if mobile
        if (_navIs.desktop) {
            //make sure binding doesnt happen id modal data is empty
            $.modal.impl.bindEvents = function () {
                if ($.modal.impl.d.container) {
                    orgBind.apply($.modal.impl, []);
                }
            }
        } else {
            $.modal.impl.bindEvents = $.noop;
        }

        //add modal wrapper that will always be full screen to avoid fixed position issues
        $.modal.defaults.onOpen = function (dialog) {
            //get the specific modal options
            var cuurScroll = $(document).scrollTop();
            var modalOpts = $.modal.impl.o;
            var resizeFullWrap = function () {
                $("#modalFullWrap").height($(window).outerHeight());
                $("#modalFullWrap").width($(window).outerWidth());
            }
            $.modal.selfClose = modalOpts.selfClose;
            $.modal.ID = modalOpts.ID;
            fullWrap.height($(window).outerHeight());
            fullWrap.width($(window).outerWidth());
            if (_navIs.desktop) {
                $(window).on("resize.simplemodal orientationchange.simplemodal", resizeFullWrap);
            }
            dialog.container.wrap(fullWrap);
            //disable all actions under the modal
            //_debug("binding window");
            $(window).on("click.simplemodal touchstart.simplemodal touchend.simplemodal keyup.simplemodal keypress.simplemodal touchmove.simplemodal scroll.simplemodal", function (e) {
                var eTarget = $(e.target);
                //_debug("modal click " + e.type + " " + eTarget.closest(dialog.container).length, eTarget);
                if (eTarget.closest(dialog.container).length == 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.type == "scroll" || e.type == "touchmove") {
                        $(document).scrollTop(cuurScroll);
                    }
                    return false;
                }
            });
            //run any onopen callback
            if ($.isFunction(modalOpts.openCb)) {
                modalOpts.openCb(dialog);
            }
            if (modalOpts.pop) {
                dialog.container.addClass("popBoxSet");
            }
            dialog.overlay.show();
            dialog.container.show();
            dialog.data.show();
            if (!modalOpts.holdPop) {
                $.modal.pop();
            }

        }
        //add closing our full screen wrapper to the modal close event
        $.modal.close = function () {
            if (!$.modal.stillClosing) {
                $.modal.closeState = $.Deferred();
                $.modal.stillClosing = true;
                if (!$.modal.impl.d.data) {
                    $.modal.stillClosing = false;
                    $.modal.closeState.resolve();
                } else {
                    if (!$.modal.impl.occb && $.isFunction($.modal.impl.o.onClose)) {
                        $.modal.stillClosing = false;
                        orgClose();
                    } else {
                        $.modal.unpop();
                        $.modal.selfClose = false;
                        $.modal.ID = "";
                        orgClose();
                        setTimeout(function () {
                            $(window).off(".simplemodal");
                            //_debug("remove binding window");
                            $("#modalFullWrap").add("#simplemodal-overlay").remove();
                            setTimeout(function () {
                                $.modal.stillClosing = false;
                                $.modal.closeState.resolve();
                            }, 200);
                        }, 400);
                    }
                }
                return $.modal.closeState.promise();
            } else {
                return $.modal.closeState;
            }
        }
    })();

    this.regExt = _regExt,
    this.module = _module,
    this.controller = function (name, req, contructor) {
        return _regExt("controller", name, req, contructor);
    },
    this.service = function (name, req, contructor) {
        return _regExt("service", name, req, contructor);
    },
    this.factory = function (name, req, contructor) {
        return _regExt("factory", name, req, contructor);
    }
    this.directive = function (name, req, contructor) {
        _directives[name] = {
            name: name,
            services: req,
            func: contructor
        }
        return that_poseApp;
    },
    this.debug = _debug,
    this.sendErrorMail = _sendErrorMail,
    this.warn = _warn,
    this.parseObj = _parseObj,
    this.mergeArrays = _mergeArrays,
    this.isObjectInArray = _isObjectInArray,
    this.isArrayInArray = _isArrayInArray,
    this.isEqualObjects = _isEqualObjects,
    this.extendExistingOnly = _extendExistingOnly,
    this.isUndefined = _isUndefined,
    this.isArray = _isArray,
    this.isObject = _isObject,
    this.isObjectType = _isObjectType,
    this.isDate = _isDate,
    this.isBoolean = _isBoolean,
    this.isParsedObject = _isParsedObject,
    this.isString = _isString,
    this.objLength = _objLength,
    this.isjQuery = _isjQuery,
    this.$eval = _$eval,
    this.pre = _pre,
    this.addProdInAction = $.Deferred().resolve();
    this.debugMode = (((location.host == "127.0.0.1") || (location.host == "10.0.0.202") || (location.host.indexOf("posestaging") > -1)) || (location.hash == "#debug"));
    this.testMode = false; //used to test changes that are not fully ready for production but require production server.
    this.showError = _noLangErrorBox,
    this.location = _pre.cr,
    this.getLang = _extendMethods("getLang").callLang,
    this.messageBox = function () { return _extendMethods("messageBox"); };
    this.navIs = _navIs;
    this.loader = (_extendMethods("loader"))();
    this.modal = _modal,
    this.addaDeviceTypeClass = _addaDeviceTypeClass;
    this.isInHouseSwipe = _isInHouseSwipe;
    this.bootStrap = function (htmlDocument, modules) {
        //if I got this far lang is fine and I can update the showError fn
        docAllReady.then(function () {
            htmlDocument = htmlDocument || document.body;
            that_poseApp.showError = that_poseApp.messageBox().error;
            that_poseApp.versionSuffix = "?v=" + $("title", htmlDocument).data("version");
            if ($.isArray(modules)) {
                $.each(modules, function (k, name) {
                    if (_modules.hasOwnProperty(name)) {
                        _modules[name].init();
                    }
                });
            }
        });
        _addaDeviceTypeClass($("body", htmlDocument));
        return that_poseApp;
    }
    this.getStackTrace = _getStackTrace;
})();