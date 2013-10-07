define([], function() {
    var config = {
       "appid":"",
       "webmap":"5276cc976db1452884019a79ee80bac8",
       "useArcGISOnlineBasemaps":true,
       "basemapGroupTitle":"Community Basemaps",
       "basemapGroupOwner":"esri",
       "pointGraphic":"images/map/bluepoint21x29.png",
       "proxyUrl":"resources/proxy.php",
       "sharingurl":"",
       "defaultMenu":"none",
       "showSearchBox":true,
       "showShareMenu":true,
       "showBasemapMenu":true,
       "showLayersMenu":true,
       "showLegendMenu":true,
       "showDisplaySwitch":true,
       "showPlaces":true,
       "showGeolocation":true,
       "showAboutDialog":true,
       "showAboutDialogOnLoad":false,
       "locateName":"",
       "locatePoint":"",
       "localImpact": {
            "enabled": true,
            "title":"Local Impact Map",
            "layerTitle":"Local Impact",
            "polygonWhere":"",
            "defaultPanel": "population",
            "draw": false,
            "block": 1,
            "tract": 0,
            "county": 2,
            "lut": 3,
            "infrastructureUrl": "http://tm3-elb-1547271983.us-east-1.elb.amazonaws.com/arcgis/rest/services/LocalImpactMaps/USA_CIKR/MapServer",
            "businessUrl": "http://tm3-elb-1547271983.us-east-1.elb.amazonaws.com/arcgis/rest/services/LocalImpactMaps/USA_Business/MapServer",
            "populationUrl": "http://tm3-elb-1547271983.us-east-1.elb.amazonaws.com/arcgis/rest/services/LocalImpactMaps/USA_Census/MapServer"
        }
    };
    return config;
});