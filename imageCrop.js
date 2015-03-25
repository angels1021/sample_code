poseApp.service("imageCrop", ["compile", "rootLang", "$http", "imageSizeCache"], function (compile, rootLang, $http, imageSizeCache) {
    var _templates = {
        templ: compile.loadTemplate("/poseApp/templates/pieces.html"),
        cropBox: "",
        cropOverlay: $("<div>", { id: "cropOverlay" }),
        cropContainer: $("<div>", { id: "simplemodal-container", style: "position:fixed;left:0;top:0;" }),
        canvasHidden: $("<canvas>"),
        ctx: ""
    },
    _imageCropper_def = $.Deferred(),
    _defultSettings = {
        fileInput: "",
        width: 250,
        height: 250,
        full: 1,
        prefix: "",
        docWin: window,
        imgInx: [0]
    },
    _cropInfo = {},
    _coords = {},
    _sizeWarningVisible = false,
    _newImages = [],
    _dimentions = {},
    _resetCropper = function () {
        _imageCropper_def = $.Deferred();
        _newImages = [];
        _coords = {};
        _dimentions = {
            maxHeight: 550,
            maxWidth: 550,
            winHeight: window.outerHeight,
            winWidth: window.outerWidth,
            wPadding: parseInt(_cropInfo.width + 60),
            topPadding: 60,
            previewResize: 1
        }
    },
    _init = (function () {
        var def_Init = $.Deferred();
        _templates.templ.then(function (tmplData) {
            _templates.cropBox = $(".cropperTemplate", tmplData).clone(true);
            def_Init.resolve();
        }, def_Init.reject);
        return def_Init.promise();
    })(),
    _cancelCrop = function () {
        $(_cropInfo.fileInput).val("");
        _modal.close();
        _imageCropper_def.reject({ type: "cancel", data: {} });
    },
    _modal = {},
    _setCroperModal = function () {
        var modalActions = {},
            docWin = $(_cropInfo.docWin),
            docBody = (_cropInfo.docWin.hasOwnProperty("document")) ? $(_cropInfo.docWin.document.body) : $(_cropInfo.docWin);
        if (_cropInfo.full == 1) {
            modalActions = {
                open: function (html, modalOpts) {
                    $.modal(html, modalOpts);
                },
                close: function () {
                    modalActions.isOpen = false;
                    $.modal.close();
                },
                update: $.modal.update,
                data: function () { return $.modal.impl.d.data },
                isOpen: false
            }
        } else {
            modalActions = {
                dialog: {
                    o: {
                        onShow: null,
                        onClose: null
                    },
                    data: ""
                },
                open: function (html, modalOpts) {
                    if (modalActions.data() == "") {
                        var defaultOpts = modalActions.dialog.o,
                        dialog = modalActions.dialog = {
                            data: html,
                            container: _templates.cropContainer.clone(),
                            overlay: _templates.cropOverlay.clone(),
                            o: $.extend(defaultOpts, modalOpts)
                        },
                        cropperWrap;

                        dialog.data.addClass("simplemodal-data");
                        $(".cropperHeader", dialog.data).hide();
                        dialog.container.html(dialog.data).addClass("popBoxSet");
                        dialog.overlay.append(dialog.container);
                        docBody.append(dialog.overlay);
                        cropperWrap = $(".cropperWrap", dialog.data);
                        dialog.container.width(cropperWrap.outerWidth()).height(cropperWrap.outerHeight());
                        modalActions.update();
                        if ($.isFunction(dialog.o.onShow)) {
                            dialog.o.onShow(dialog);
                            docWin.on("resize.cropmodal", modalActions.update);
                        }
                        dialog.overlay.show();
                        dialog.container.addClass("popBox");
                    }
                },
                close: function () {
                    if (modalActions.data() != "") {
                        var dialog = modalActions.dialog;
                        dialog.data.removeClass("popBox");
                        docWin.off(".cropmodal");
                        modalActions.dialog.data = "";
                        dialog.overlay.remove();
                        modalActions.isOpen = false;
                        if ($.isFunction(dialog.o.onClose)) {
                            dialog.o.onClose();
                        }
                        dialog = {
                            o: {
                                onShow: null,
                                onClose: null
                            },
                            data: ""
                        };
                    }
                },
                update: function () {
                    var dialog = modalActions.dialog,
                        bodyW = docBody.outerWidth(),
                        bodyW = docBody.outerHeight(),
                        topMarg = (docWin.outerHeight() - dialog.container.outerHeight()) / 2,
                        leftMarg = (docWin.outerWidth() - dialog.container.outerWidth()) / 2;
                    dialog.container.css({ top: topMarg, left: leftMarg });
                },
                data: function () { return modalActions.dialog.data},
                isOpen: false
            }
        }
        return modalActions;
    },
    _prepCropWindow = function () {
        var currIndex = _templates.img.data("index"),
            nextIndex = $.isNumeric(currIndex) ? (Number(currIndex) + 1) : 1,
            maxLength = _files.length < _cropInfo.max ? _files.length : _cropInfo.max,
            imgCropSubmit = $(".imgCropSubmit", _templates.ctx);
        $(".imgCropCancel", _templates.ctx, _templates.ctx).offClick().onClick(_cancelCrop);
        if (nextIndex < maxLength) {
            imgCropSubmit.val(rootLang.next);
        }
        imgCropSubmit.onClick(function (e) {
            if (_checkTooSmallByCords()) {
                if ($(".cropImageSizeWarning", _templates.ctx).hasClass("showBox")) {
                    _uploadImage.call(this);
                } else {
                    _showSizeWarning(_uploadImage);
                };
            } else {
                _uploadImage();
            };
        });
        poseApp.loader.hide();
    },
    _openThisImageCropWin = function (dimObj) {
        _templates.ctx = compile.compileApply(_templates.cropBox.clone(true), { lang: rootLang, cropInfo: _cropInfo, hideSizeWarning: _hideSizeWarning });
        $(".cropperWrap", _templates.ctx).width(dimObj.objectWidth).height(dimObj.objectHeight);
        var canvas = $(".canvasToCrop", _templates.ctx).get(0),
            ctx = canvas.getContext("2d");
        //poseApp.debug("dimObj", dimObj, $.extend({}, dimObj));
        canvas.width = dimObj.targetWidth;
        canvas.height = dimObj.targetHeight;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, dimObj.targetWidth, dimObj.targetHeight);
        ctx.drawImage(dimObj.targetimg, 0, 0, parseInt(canvas.width) + 0.5, parseInt(canvas.height) + 0.5);
        
        var dataWidth = dimObj.objectWidth,
            dataHeight = dimObj.objectHeight + ((_cropInfo.full ==1) ? 48: 0);
        if (_modal.isOpen) {
            var oldData = _modal.data(),
                updateTimeout,
                updateModalPosition = function () {
                    clearTimeout(updateTimeout);
                    _modal.update();
                    $(_cropInfo.docWin).off("webkitTransitionEnd.cropperUpdateSize");
                };
            $(".cropperWrap", oldData).replaceWith($(".cropperWrap", _templates.ctx));
            _templates.ctx = oldData;
            _cropperError().hide();
            _templates.ctx.width(dataWidth).height(dataHeight);
            $("#simplemodal-container").css({ height: "auto", width: "auto", "-webkit-transition": "all ease-out 0.3s" });
            updateTimeout = setTimeout(updateModalPosition, 500);
            $(_cropInfo.docWin).on("webkitTransitionEnd.cropperUpdateSize", function (e) {
                if (e.handleObj.namespace == "cropperUpdateSize") {
                    updateModalPosition();
                }
            });
            _prepCropWindow();
        } else {
            _modal.open(_templates.ctx, {
                onShow: function (dialog) {
                    dialog.data.width(dataWidth).height(dataHeight).addClass("morphModal");
                    _templates.ctx = dialog.data;
                    _modal.isOpen = true;
                    _prepCropWindow();
                },
                onClose: function () {
                    _cancelCrop();
                    _modal.close();
                },
                ID: "cropWindow",
            });
        }
        $(".canvasToCrop", _templates.ctx).Jcrop({
            aspectRatio: dimObj.ratio,
            onChange: _updateCords,
            onSelect: _updateCords,
            boxWidth: parseInt(dimObj.targetWidth),
            boxHeight: parseInt(dimObj.targetHeight),
            setSelect: [0, 0, parseInt(dimObj.targetWidth - 10), parseInt(dimObj.targetHeight - 10)],
        });
        _sizeWarningVisible = _checkTooSmallByCords();
    },
    _imageOnload = function (loadEvent) {
        var targetimg = loadEvent.target,
            minHeight = (_cropInfo.prevHeight + 80) > 200 ? (_cropInfo.prevHeight + 80) : 200,
            resizeRatio = 1,
            perc = 1,
            newHeight = _dimentions.maxHeight,
            newWidth = _dimentions.maxWidth,
            buildDim = {
                ratio: 1,
                objectWidth: _dimentions.maxWidth,
                objectHeight: _dimentions.maxHeight,
                targetWidth: _dimentions.maxWidth,
                targetHeight: _dimentions.maxHeight,
            }
        _cropInfo.tooSmall = ((targetimg.width < _cropInfo.minCropWidth) || (targetimg.height < _cropInfo.minCropHeight));
        _cropInfo.curImageSize = parseInt(targetimg.width) + "x" + parseInt(targetimg.height);
        //poseApp.debug("image size", targetimg.width, targetimg.height);
        
        if (targetimg.width < _dimentions.maxWidth && targetimg.height < _dimentions.maxHeight) {
            //small image
            if (targetimg.height < minHeight) {
                //minimum height
                buildDim.objectWidth = targetimg.width;
                buildDim.objectHeight = minHeight;
            } else {
                buildDim.objectWidth = targetimg.width;
                buildDim.objectHeight = targetimg.height;
            }

            buildDim.targetWidth = targetimg.width;
            buildDim.targetHeight = targetimg.height;
        } else if (targetimg.width > _dimentions.maxWidth || targetimg.height > _dimentions.maxHeight) {
            //largeImage
            if (targetimg.width >= targetimg.height) {
                //width is bigger

                //need to rsize the image to maxWidth
                //need To SaveThat ratio
                perc = targetimg.height / targetimg.width;
                resizeRatio = (_dimentions.maxWidth / targetimg.width);
                newWidth = _dimentions.maxWidth;
                newHeight = Math.round(targetimg.height * resizeRatio);
                
                if (newHeight > _dimentions.maxHeight) {
                    resizeRatio = (_dimentions.maxHeight / newHeight);
                    newHeight = _dimentions.maxHeight;
                    newWidth = Math.round(newWidth * resizeRatio);
                }
                buildDim.targetWidth = buildDim.objectWidth = newWidth;
                buildDim.targetHeight = buildDim.objectHeight = newHeight;
                
            } else {
                //height is bigger
                resizeRatio = (_dimentions.maxHeight / targetimg.height);
                perc = targetimg.width / targetimg.height;
                newHeight = _dimentions.maxHeight;
                newWidth = Math.round(resizeRatio * targetimg.width);
                if (newWidth > _dimentions.maxWidth) {
                    resizeRatio = (_dimentions.maxWidth / newWidth);
                    newWidth = _dimentions.maxWidth;
                    newHeight = Math.round(newHeight * resizeRatio);
                }
                buildDim.targetWidth = buildDim.objectWidth = newWidth;
                buildDim.targetHeight = buildDim.objectHeight = newHeight;
            }
        }
        _dimentions.previewResize = (buildDim.targetWidth / targetimg.width);
        if (_cropInfo.width > _cropInfo.height) {
            buildDim.ratio = (_cropInfo.width / _cropInfo.height)
        } else {
            buildDim.ratio = (_cropInfo.height / _cropInfo.width);
        }
        buildDim.objectWidth = buildDim.objectWidth + _dimentions.wPadding;
        buildDim.objectHeight = buildDim.objectHeight + _dimentions.topPadding;
        buildDim.targetimg = targetimg;
        return _openThisImageCropWin(buildDim);
    },
    _showSizeWarning = function (cb) {
        var cropImageSizeWarning = $(".cropImageSizeWarning", _templates.ctx);
        if ($.isFunction(cb)) {
            $("input", cropImageSizeWarning).offClick().onClick(cb).onClick(_hideSizeWarning);
        }
        $("#currentImageSizeWarn", _templates.ctx).text(_cropInfo.curImageSize);
        cropImageSizeWarning.addClass("showBox");
        return _sizeWarningVisible = true;
    },
    _hideSizeWarning = function () {
        if (_sizeWarningVisible) {
            $(".cropImageSizeWarning", _templates.ctx).removeClass("showBox");
            _sizeWarningVisible = false;
        } else {
            return false;
        }
    },
    _updateCords = function (c) {
        _hideSizeWarning(1);
        for (oCord in c) {
            _coords[oCord] = (c[oCord] / _dimentions.previewResize);
        }
        if (parseInt(_coords.w) > 0) {
            // Show image preview
            var imageObj = _templates.img.get(0);
            var dif = 0;
            if (_coords.w > imageObj.width) {
                dif = _coords.w - imageObj.width;
                _coords.w = imageObj.width;
                _coords.x2 = _coords.h2 - dif;
            }
            if (_coords.h > imageObj.height) {
                dif = _coords.h - imageObj.height;
                _coords.h = imageObj.height;
                _coords.y2 = _coords.y2 - dif;
            }
            if (_coords.x2 > imageObj.width) {
                dif = _coords.x2 - imageObj.width;
                _coords.x2 = imageObj.width;
                _coords.w = _coords.w - dif;
            }
            if (_coords.y2 > imageObj.height) {
                dif = _coords.y2 - imageObj.height;
                _coords.y2 = imageObj.height;
                _coords.h = _coords.h - dif;
            }
            _cropInfo.curImageSize = parseInt(_coords.w) + "x" + parseInt(_coords.h);
            var canvasTwo = _templates.canvasHidden.get(0);
            var context = canvasTwo.getContext("2d");
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvasTwo.width, canvasTwo.height);
            context.drawImage(imageObj, parseInt(_coords.x), parseInt(_coords.y), parseInt(_coords.w), parseInt(_coords.h), 0, 0, parseInt(canvasTwo.width), parseInt(canvasTwo.height));
            var cropUrl = canvasTwo.toDataURL();
            var cropPreview = $(".cropPreview", _templates.ctx);
            if (cropPreview.is(":hidden")) {
                cropPreview.show();
            }
            cropPreview.attr("src", cropUrl);
        } else {
            _cropInfo.curImageSize = "0x0";
        }
    },
    _dataURLtoBlob = function (dataURL) {
        // Decode the dataURL    
        var binary = atob(dataURL.split(',')[1]);
        // Create 8-bit unsigned array or array buffer for mobile
        var ab = new ArrayBuffer(binary.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < binary.length; i++) {
            ia[i] = binary.charCodeAt(i);
        }
        var theBlob;
        try {
            theBlob = new Blob([ab], { type: 'image/jpeg' });
        } catch (e) {
            if (e.name == "TypeError" && (window.BlobBuilder || window.WebKitBlobBuilder)) {
                try {
                    var bb = new (window.BlobBuilder || window.WebKitBlobBuilder)();
                    bb.append(ab);
                    theBlob = bb.getBlob("image/jpeg");
                } catch (e) {
                    theBlob = false
                }
            } else {
                theBlob = false
            }
        }
        // Return our Blob object
        return theBlob;
    }
    _checkTooSmallByCords = function (fullSize) {
        if (fullSize === 1) {
            return (_coords.w < _cropInfo.width) || (_coords.h < _cropInfo.height);
        } else {
            return (_coords.w < _cropInfo.minCropWidth) || (_coords.h < _cropInfo.minCropHeight);
        }
    },
    _getImageUrl = function () {
        if (_checkTooSmallByCords(1)) {
            _templates.canvasHidden = $("<canvas id='canvasHidden' height='" + Math.round(_coords.h) + "' width='" + Math.round(_coords.w) + "'>");
        } else {
            _templates.canvasHidden = $("<canvas id='canvasHidden' height='" + (_cropInfo.height) + "' width='" + (_cropInfo.width) + "'>");
        }
            var imageObj = _templates.img.get(0),
                canvasTwo = _templates.canvasHidden.get(0),
                context = canvasTwo.getContext("2d");
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvasTwo.width, canvasTwo.height);
            context.drawImage(imageObj, Math.round(_coords.x), Math.round(_coords.y), Math.round(_coords.w), Math.round(_coords.h), 0, 0, parseInt(canvasTwo.width), parseInt(canvasTwo.height));
        return _templates.canvasHidden.get(0).toDataURL();
    },
    _uploadImage = function () {
        var currIndex = _templates.img.data("index"),
            nextIndex = $.isNumeric(currIndex) ? (Number(currIndex) + 1) : 1,
            maxLength = _files.length < _cropInfo.max ? _files.length : _cropInfo.max,
            cropUrl = _getImageUrl(),
            theFile = dataURLtoBlob(cropUrl),
            buttons = $("input[type='button']", _templates.ctx);
        buttons.prop("disabled", true);
        if (theFile == false) {
            _imageCropper_def.reject({ type: "error", data: { msg: "Your browser does not currently support the Image uploader, please try again with Chrome", showMsg: true, name: "unsupprted browser", error: theFile, caller: "imageCrop > _uploadImage" } });
            _cancelCrop();
        } else {
            var newLogo = new FormData(),
                sendIndex = _cropInfo.imgInx[currIndex];
            newLogo.append("cropped_image", theFile);
            poseApp.loader.show();
            try{
                $http({
                    url: "/aj_uploadImage.aspx?prefix=" + _cropInfo.prefix + "&index=" + sendIndex,
                    type: "POST",
                    data: newLogo,
                    processData: false,
                    contentType: false,
                    dataType: "html"
                }).success(function () {
                    //upload image success
                    var imageSize = _checkTooSmallByCords(1) ? parseInt(_coords.w) : _cropInfo.width;
                    _newImages.push({ index: sendIndex, url: cropUrl, imageSize: imageSize });
                    if (nextIndex >= maxLength) {
                        _finishCrop();
                    } else {
                        _prepWindowForThisImage(nextIndex);
                    }
                }).error(function (errData) {
                    _cropperError().show({ index: currIndex });
                    poseApp.showError({ name: "error uploading image", error: errData, caller: "imageCrop > _uploadImage" });
                }).always(poseApp.loader.hide);
            } catch (ex) {
                _cropperError().show({ index: currIndex });
                poseApp.showError({ name: ex.name, msg: ex.message, error: ex.stack, caller: "imageCrop > _uploadImage" });
            }
            
        }
        
    },
    _finishCrop = function () {
        _imageCropper_def.resolve(_newImages);
        _modal.close();
        _resetCropper();
    },
    _prepWindowForThisImage = function (index) {
        var img_def = $.Deferred(),
            file = _files[index],
            fileName = file.name,
            fileType = file.type;
        if (fileType == 'image/jpeg' || fileType == 'image/png' || fileType == 'image/gif') {
            // Get window.URL object
            var URL = window.URL || window.webkitURL,

            // Create ObjectURL
                imgURL = URL.createObjectURL(file);
            //create the image
            if (!_templates.hasOwnProperty("img")) {
                _templates.img = $("<img>").load(_imageOnload);
            }
            _templates.img.data("index", index).attr("src", imgURL);
            imgURL.revokeObjectURL;
        } else {
            //if wrong file type
            if (index == 0) {
                //first one
                if (_files.length <= 1) {
                    _imageCropper_def.reject({ type: "error", data: { msg: "<div class='paddBox center'>{{lang.fileError}}</div>", showMsg: true, error: fileType, caller: "imageCrop > _prepWindowForThisImage", name: "bad file type" } });
                    _cancelCrop();
                } else {
                    _templates.ctx = compile.compileApply(_templates.cropBox.clone(true), { lang: rootLang, cropInfo: _cropInfo });
                    _cropperError().show({
                        msg: rootLang.fileError,
                        again: false,
                        index: index
                    });
                    _modal.open(_templates.ctx, {
                        onShow: function (dialog) {
                            _templates.ctx = dialog.data;
                            _modal.isOpen = true;
                        }
                    });
                }
                
            } else {
                //not the first image
                _cropperError().show({
                    msg: rootLang.fileError,
                    again: false,
                    index: index
                });
            }
        }

        return img_def.promise();
    },
    _cropperError = function (context) {
        context = context || _templates.ctx;
        var errorDiv = $(".hiddenBox", context),
            errorBtns = $(".lightboxButtonAction", errorDiv),
            cropperErrorSkip = $(".cropperErrorSkip", errorDiv),
            cropperErrorTryAgain = $(".cropperErrorTryAgain", errorDiv);
        return {
            hide: function () {
                if (errorDiv.hasClass("showBox")) {
                    errorDiv.removeClass("showBox");
                }
                if (errorBtns.hasClass("FlexEnd")) {
                    errorBtns.removeClass("flexEnd").addClass("flexBoxSpace");
                }
                cropperErrorTryAgain.add(cropperErrorSkip).offClick();
            },
            show: function (errSettings) {
                errSettings = errSettings || {};
                var defaultErrSettings = {
                    msg: rootLang.GeneralError,
                    again: true,
                    index: 0
                },
                maxLength = _files.length <= _cropInfo.max ? _files.length : _cropInfo.max;
                errSettings = $.extend(defaultErrSettings, errSettings);
                if ((errSettings.index + 1) == maxLength) {
                    _finishCrop();
                } else {
                    cropperErrorSkip.onClick(function () {
                        _prepWindowForThisImage(errSettings.index + 1);
                    });
                }
                if (errSettings.again) {
                    cropperErrorTryAgain.onClick(this.hide);
                } else {
                    cropperErrorTryAgain.hide();
                    errorBtns.removeClass("flexBoxSpace").addClass("FlexEnd");
                }
                $(".cropErrorText", errorDiv).html(errSettings.msg);
                errorDiv.addClass("showBox");
            }
        }
    },
    _files = [],
    _setupPreviewSize = function () {
        prevRatio = 1;
        if ((_cropInfo.width > 250) && (_cropInfo.height > 250)) {
            if (_cropInfo.width > _cropInfo.height) {
                if (_cropInfo.width > 250) {
                    _cropInfo.prevWidth = 250;
                    prevRatio = 250 / _cropInfo.width;
                    _cropInfo.prevHeight = _cropInfo.height * prevRatio;
                }
            } else {
                if (_cropInfo.height > 250) {
                    _cropInfo.prevHeight = 250;
                    prevRatio = 250 / _cropInfo.height;
                    _cropInfo.prevWidth = _cropInfo.width * prevRatio;
                }
            }
        } else {
            _cropInfo.prevWidth = _cropInfo.width;
            _cropInfo.prevHeight = _cropInfo.height;
        }
    },
    _openCropper = function (opts) {
        poseApp.loader.show();
        _resetCropper();
        _cropInfo = $.extend({}, _defultSettings, opts);
        if (!opts.hasOwnProperty("width")) {
            _cropInfo.width = imageSizeCache(_cropInfo.prefix + "HD").width;
        }
        if (!opts.hasOwnProperty("height")) {
            _cropInfo.height = imageSizeCache(_cropInfo.prefix + "HD").height;
        }
        if (!opts.hasOwnProperty("minCropWidth")) {
            _cropInfo.minCropWidth = imageSizeCache(_cropInfo.prefix).width;
        }
        if (!opts.hasOwnProperty("minCropHeight")) {
            _cropInfo.minCropHeight = imageSizeCache(_cropInfo.prefix).height;
        }
        
        _cropInfo.max = _cropInfo.imgInx.length;
        poseApp.debug("_cropInfo", _cropInfo, opts);
        _setupPreviewSize();
        _modal = _setCroperModal();
        _init.then(function () {
            _templates.canvasHidden = $("<canvas id='canvasHidden' height='" + (_cropInfo.prevHeight) + "' width='" + (_cropInfo.prevWidth) + "'>");
            _files = _cropInfo.fileInput.files;
            if (_files && _files.length > 0) {
                var docWin = $(_cropInfo.docWin),
                    isOwnWindow = (_cropInfo.docWin.hasOwnProperty("document"));
                _dimentions.winHeight = isOwnWindow ? docWin.outerHeight() : $(window).outerHeight();
                _dimentions.winWidth = isOwnWindow ? docWin.outerWidth() : $(window).outerWidth();
                _dimentions.maxHeight = (_dimentions.winHeight > (_dimentions.maxHeight + 100)) ? _dimentions.maxHeight : _dimentions.winHeight - 100;
                _dimentions.maxWidth = (_dimentions.winWidth > (_dimentions.maxWidth + 100)) ? _dimentions.maxWidth : _dimentions.winWidth - 100;
                _dimentions.wPadding = parseInt(_cropInfo.prevWidth + 60);
                _prepWindowForThisImage(0);
            } else {
                _imageCropper_def.reject({ type: "error", data: "no files" });
                _cancelCrop();
            }
            
        }, function (errData) {
            _imageCropper_def.reject({ type: "error", data: errData });
            _cancelCrop();
        });
        return _imageCropper_def.promise();
    };
    return {
        openCropper: _openCropper
    }
});