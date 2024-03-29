define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/query",
    "dojo/dom",
    "dojo/on",
    "dojo/json",
    "dojo/topic",
    "dojo/i18n!./nls/template.js",
    "application/main",
    "dojox/layout/ResizeHandle",
    "esri/arcgis/utils"
],
function (declare, connect, query, dom, on, JSON, topic, i18n, appMain, ResizeHandle, arcgisUtils) {
    var Widget = declare('application.preview', appMain, {
        constructor: function () {},
        // resize map function
        resizeMapPreview: function () {
            var _self = this;
            _self.map.resize();
        },
        // Handle the map size variables
        mapSize: function (mSize, width, height) {
            var _self = this;
            query('#previewContainer .embedSizing li').removeClass('selected');
            switch (mSize) {
                case 'small':
                    _self.options.embedWidth = _self.options.embedSizes.small.width;
                    _self.options.embedHeight = _self.options.embedSizes.small.height;
                    query('#inputWidth').attr('value', _self.options.embedWidth);
                    query('#inputHeight').attr('value', _self.options.embedHeight);
                    query('#embedSmall').addClass('selected');
                    break;
                case 'medium':
                    _self.options.embedWidth = _self.options.embedSizes.medium.width;
                    _self.options.embedHeight = _self.options.embedSizes.medium.height;
                    query('#inputWidth').attr('value', _self.options.embedWidth);
                    query('#inputHeight').attr('value', _self.options.embedHeight);
                    query('#embedMedium').addClass('selected');
                    break;
                case 'large':
                    _self.options.embedWidth = _self.options.embedSizes.large.width;
                    _self.options.embedHeight = _self.options.embedSizes.large.height;
                    query('#inputWidth').attr('value', _self.options.embedWidth);
                    query('#inputHeight').attr('value', _self.options.embedHeight);
                    query('#embedLarge').addClass('selected');
                    break;
                case 'resize':
                    _self.options.embedWidth = width;
                    _self.options.embedHeight = height;
                    query('#inputWidth').attr('value', _self.options.embedWidth);
                    query('#inputHeight').attr('value', _self.options.embedHeight);
                    query('#embedCustom').addClass('selected');
                    break;
                case 'input':
                    _self.options.embedWidth = width;
                    _self.options.embedHeight = height;
                    query('#inputWidth').attr('value', _self.options.embedWidth);
                    query('#inputHeight').attr('value', _self.options.embedHeight);
                    query('#embedCustom').addClass('selected');
                    break;
                default:
                    _self.options.embedWidth = query('#inputWidth').attr('value')[0];
                    _self.options.embedHeight = query('#inputHeight').attr('value')[0];
                    if (isNaN(_self.options.embedWidth)) {
                        _self.alertDialog(i18n.viewer.errors.integersOnly);
                        _self.options.embedWidth = _self.options.embedSizes.medium.width;
                        query('#inputWidth').attr('value', _self.options.embedWidth);
                    }
                    if (isNaN(_self.options.embedHeight)) {
                        _self.alertDialog(i18n.viewer.errors.integersOnly);
                        _self.options.embedHeight = _self.options.embedSizes.medium.height;
                        query('#inputHeight').attr('value', _self.options.embedHeight);
                    }
                    if (_self.options.embedSizes.minimum.width && _self.options.embedWidth < _self.options.embedSizes.minimum.width) {
                        _self.options.embedWidth = _self.options.embedSizes.minimum.width;
                        _self.alertDialog(i18n.viewer.preview.minWidth + ' ' + _self.options.embedWidth);
                        query('#inputWidth').attr('value', _self.options.embedWidth);
                    } else if (_self.options.embedSizes.minimum.height && _self.options.embedHeight < _self.options.embedSizes.minimum.height) {
                        _self.options.embedHeight = _self.options.embedSizes.minimum.height;
                        _self.alertDialog(i18n.viewer.preview.minHeight + ' ' + _self.options.embedHeight);
                        query('#inputHeight').attr('value', _self.options.embedHeight);
                    } else if (_self.options.embedSizes.maximum.width && _self.options.embedWidth > _self.options.embedSizes.maximum.width) {
                        _self.options.embedWidth = _self.options.embedSizes.maximum.width;
                        _self.alertDialog(i18n.viewer.preview.maxWidth + ' ' + _self.options.embedWidth);
                        query('#inputWidth').attr('value', _self.options.embedWidth);
                    } else if (_self.options.embedSizes.maximum.height && _self.options.embedHeight > _self.options.embedSizes.maximum.height) {
                        _self.options.embedHeight = _self.options.embedSizes.maximum.height;
                        _self.alertDialog(i18n.viewer.preview.maxHeight + ' ' + _self.options.embedHeight);
                        query('#inputHeight').attr('value', _self.options.embedHeight);
                    }
                    query('#embedCustom').addClass('selected');
            }
            query('#map, #mapPreviewResize').style({
                'width': _self.options.embedWidth + 'px',
                'height': _self.options.embedHeight + 'px'
            });
            _self.resizeMapPreview();
            _self.setSharing(true);
        },
        // configure embed
        init: function () {
            var _self = this;
            // overwite from url values
            _self.setOptions();
            _self.options.embedWidth = _self.options.embedSizes.medium.width;
            _self.options.embedHeight = _self.options.embedSizes.medium.height;
            var html = '';
            html += '<h2>' + i18n.viewer.preview.customize + '</h2>';
            html += '<table id="embedArea"><tbody><tr><td>';
            html += '<ul class="embedSizing">';
            html += '<li tabindex="0" class="item" id="embedSmall"><span class="itemIcon"></span>' + i18n.viewer.preview.small + '</li>';
            html += '<li tabindex="0" class="item selected" id="embedMedium"><span class="itemIcon"></span>' + i18n.viewer.preview.medium + '</li>';
            html += '<li tabindex="0" class="item" id="embedLarge"><span class="itemIcon"></span>' + i18n.viewer.preview.large + '</li>';
            html += '<li tabindex="0" class="item" id="embedCustom"><span class="itemIcon"></span>' + i18n.viewer.preview.custom + '';
            html += '<ul>';
            html += '<li><input placeholder="Width" autocomplete="off" id="inputWidth" value="' + _self.options.embedSizes.medium.width + '" type="text" class="mapInput inputSingle" size="10"></li>';
            html += '<li><input placeholder="Height" autocomplete="off" id="inputHeight" value="' + _self.options.embedSizes.medium.height + '" type="text" class="mapInput inputSingle" size="10"></li>';
            html += '</ul>';
            html += '</li>';
            html += '</ul></td><td>';
            html += '<div id="mapPreviewResize"><div id="map" dir="ltr" class="mapLoading"></div></div>';
            html += '</div></td></tr></tbody></table>';
            html += '<h2>' + i18n.viewer.preview.embed + '</h2>';
            html += '<div class="instruction">' + i18n.viewer.preview.instruction + '</div>';
            html += '<div class="textAreaCon">';
            html += '<textarea id="inputEmbed" value="" class="" size="30" rows="5" readonly></textarea>';
            html += '</div>';
            var node = dom.byId('previewContainer');
            if (node) {
                node.innerHTML = html;
            }
            // create map deferred with options
            var mapDeferred = arcgisUtils.createMap(_self.options.webmap, 'map', {
                mapOptions: {
                    slider: false,
                    wrapAround180: true,
                    logo: false,
                    isScrollWheelZoom: true
                }
            });
            // on successful response
            mapDeferred.addCallback(function (response) {
                _self.map = response.map;
                // init basemap gallery hidden
                _self.createBMGallery(_self.map);
                // disable panning
                _self.map.disableMapNavigation();
                // start extent
                _self.setExtentValues(_self.map);
                _self.map.setExtent(_self.options.startExtent);
                connect.connect(_self.map, "onResize", function (event) {
                   setTimeout(function () {
                        if (_self.options.startExtent) {
                            _self.map.setExtent(_self.options.startExtent);
                        }
                    }, 500);
                });             
            });
            // on error response
            mapDeferred.addErrback(function (error) {
                console.log(i18n.viewer.errors.createMap + ": ", JSON.stringify(error));
            });
            // Embed Radio Buttons
            on(dom.byId("embedSmall"), "click, keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    _self.mapSize('small');
                }
            });
            on(dom.byId("embedMedium"), "click, keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    _self.mapSize('medium');
                }
            });
            on(dom.byId("embedLarge"), "click, keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    _self.mapSize('large');
                }
            });
            on(dom.byId("embedCustom"), "click, keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    _self.mapSize('custom');
                }
            });
            // listener for custom map size key up - height
            connect.connect(dom.byId('inputHeight'), "onchange", function (event) {
                _self.mapSize('custom');
            });
            // listener for custom map size key up - width
            connect.connect(dom.byId('inputWidth'), "onchange", function (event) {
                _self.mapSize('custom');
            });
            // input select all
            on(dom.byId("inputEmbed"), "click", function (event) {
                this.select();
            });
            // resizable
            var handle = new ResizeHandle({
                targetId: "mapPreviewResize",
                constrainMax: true,
                dir: _self.options.dir,
                textDir: _self.options.dir,
                minWidth: _self.options.embedSizes.minimum.width,
                minHeight: _self.options.embedSizes.minimum.height,
                maxHeight: _self.options.embedSizes.maximum.height,
                maxWidth: _self.options.embedSizes.maximum.width
            }).placeAt("mapPreviewResize");
            topic.subscribe("/dojo/resize/stop", function (inst) {
                setTimeout(function () {
                    query('#map').style('opacity', "1");
                    query(this).removeClass('resizing');
                    _self.mapSize('resize', inst.targetDomNode.clientWidth, inst.targetDomNode.clientHeight);
                }, 750);
            });
            topic.subscribe("/dojo/resize/start", function (inst) {
                query('#map').style('opacity', "0");
                query(this).addClass('resizing');
            });
            // set initial embed code
            _self.setSharing(true);
        }
    });
    return Widget;
});