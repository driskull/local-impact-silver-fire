// http://dojotoolkit.org/reference-guide/1.8/quickstart/writingWidgets.html

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dojo/on",


    // load template
    "dojo/text!./templates/zoombar.html",
    "dojo/i18n!./nls/zoombar",

    "dojo/dom",
    "dojo/dom-class",


    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",

    "dojo/domReady!"
],
function (
    declare,
    _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    dom, domClass,
    webMercatorUtils, Point
) {
    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
    declaredClass: "modules.zoomControl",
    templateString: dijitTemplate,
    options: {
        theme: "zoomControl",
        map: null,
        showHome: true,
        showGeolocate: true
    },
    // lifecycle: 1
    constructor: function(options, srcRefNode) {
        // mix in settings and defaults
        declare.safeMixin(this.options, options);
        // widget node
        this.domNode = srcRefNode;
        // local map
        this.set("map", this.options.map);
        this.set("showHome", this.options.home);
        this.set("showGeolocate", this.options.geolocate);
        this.set("theme", this.options.theme);
        this.watch("theme", this._updateThemeWatch);
        // classes
        this._css = {
            container: "zoomControl",
            increment: "zoomIncrementButton",
            decrement: "zoomDecrementButton",
            home: "zoomHomeButton",
            geolocate: "zoomGeolocateButton"
        };
    },
    // start widget. called by user
    startup: function() {
        var _self = this;
        // map not defined
        if (!_self.map) {
            this._error('map required');
            _self.destroy();
            return;
        }
        // map domNode
        this._mapNode = dom.byId(this.map.id);
        // when map is loaded
        if (this.map.loaded) {
            _self._init();
        } else {
            on(_self.map, "load", function() {
                _self._init();
            });
        }
    },
    // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
    destroy: function() {
        this.inherited(arguments);
    },
    /* ---------------- */
    /* Public Events */
    /* ---------------- */
    onLoad: function() {
        this.set("i18n", i18n);
        this.set("startExtent", this.map.extent);
        this.set("loaded", true);
    },
    /* ---------------- */
    /* Public Functions */
    /* ---------------- */
    zoomIn: function() {
        var currentLevel = this.map.getLevel();
        var newLevel = currentLevel + 1;
        this.map.setLevel(newLevel);
    },
    zoomOut: function() {
        var currentLevel = this.map.getLevel();
        var newLevel = currentLevel - 1;
        this.map.setLevel(newLevel);
    },
    goHome: function() {
        this.map.setExtent(this.get("startExtent"));
    },
    geolocate: function() {
        var _self = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                if (position) {
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    var lod = 16;
                    // set point
                    var pt = webMercatorUtils.geographicToWebMercator(new Point(latitude, longitude));
                    // zoom and center
                    _self.map.centerAndZoom(pt, lod);
                }
            }, function(err) {
                if (err.code === 1) {
                    _self._error('The user denied the request for location information.');
                } else if (err.code === 2) {
                    _self._error('Your location information is unavailable.');
                } else if (err.code === 3) {
                    _self._error('The request to get your location timed out.');
                } else {
                    _self._error('An unknown error occurred while requesting your location.');
                }
            }, {
                maximumAge: 3000,
                timeout: 1000,
                enableHighAccuracy: true
            });
        }
    },
    /* ---------------- */
    /* Private Functions */
    /* ---------------- */
    _init: function() {
        this.onLoad();
    },
    _updateThemeWatch: function(attr, oldVal, newVal) {
        var _self = this;
        if (_self.get("loaded")) {
            domClass.remove(_self.domNode, oldVal);
            domClass.add(_self.domNode, newVal);
        }
    },
    _error: function(message) {
        console.log(message);
    }
});
});