define([
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/Color",
    "dojo/_base/Deferred",
    "dojo/_base/event",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/number",
    "dojo/window",
    "dojo/on", 
    "dojo/fx", 
    "dojo/i18n!./nls/template.js", 
    "dijit/Dialog",
    "dijit/form/HorizontalSlider", 
    "dijit/form/VerticalSlider",
    "config/commonConfig", 
    "esri/toolbars/draw",
    "esri/config",
    "esri/arcgis/utils",
    "esri/urlUtils",
    "esri/request", 
    "esri/tasks/query", 
    "esri/tasks/QueryTask",
    "esri/tasks/GeometryService",
    "esri/dijit/BasemapGallery", 
    "esri/geometry/Extent",
    "esri/geometry/Point", 
    "esri/SpatialReference",
    "esri/symbols/PictureMarkerSymbol",
    "esri/dijit/Legend",
    "esri/dijit/Scalebar",
    "esri/geometry/webMercatorUtils", 
    "esri/graphic", 
    "esri/layers/GraphicsLayer", 
    "esri/dijit/Geocoder", 
    "esri/geometry/screenUtils", 
    "esri/dijit/Popup", 
    "esri/tasks/StatisticDefinition",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "dojo/NodeList-traverse",
    "dojo/NodeList-manipulate"
 ],
function(ready, declare, connect, Color, Deferred, event, array, dom, query, domClass, domConstruct, domGeom, domStyle, number, win, on, coreFx, i18n, Dialog, HorizontalSlider, VerticalSlider, templateConfig, Draw, config, arcgisUtils, urlUtils, esriRequest, Query, QueryTask, GeometryService, BasemapGallery, Extent, Point, SpatialReference, PictureMarkerSymbol, Legend, Scalebar, webMercatorUtils, Graphic, GraphicsLayer, Geocoder, screenUtils, Popup, StatisticDefinition, Polygon, SimpleFillSymbol, SimpleLineSymbol) {
    var Widget = declare("application.main", null, {
        constructor: function(options) {
            var _self = this;
            this.options = {};
            declare.safeMixin(_self.options, options);
            _self.setOptions();
            ready(function() {
                _self.getItemData().then(function(response) {
                    if (response) {
                        // check for false value strings
                        var appSettings = _self.setFalseValues(response.values);
                        _self._appSettings = appSettings;
                        // set other config options from app id
                        _self.options = declare.safeMixin(_self.options, _self._appSettings);
                    }
                    _self.init();
                });
            });
        },
        // round values
        roundValue: function(value) {
            var _self = this;
            if (value < 5) {
                return number.format(number.round(value, null, 1));
            }
            if (value < 10) {
                return number.format(number.round(value, null, 10));
            } else if (value < 100) {
                return number.format(number.round(value, null, 100));
            } else if (value < 1000) {
                return number.format(number.round(value, null, 1000));
            } else {
                return number.format(number.round(value, null, 10000));
            }
        },
        getChartConfig: function(settings) {
            var _self = this;
            var cfg = {
                chart: {
                    renderTo: 'chartContainer',
                    backgroundColor: '#fff',
                    reflow: true,
                    height: 200,
                    spacingTop: 20,
                    spacingRight: 20,
                    spacingBottom: 20,
                    spacingLeft: 20,
                    type: 'column'
                },
                credits: _self.options.credits,
                title: {
                    align: 'right',
                    margin: 10,
                    //text: _self.options.localImpact.totalLabel + ' ' + settings.yLabel + ': ' + _self.roundValue(settings.series[0].total)
                    text: _self.roundValue(settings.series[0].total) + _self.options.localImpact.totalLabel + settings.yLabel.toLowerCase() + _self.options.localImpact.totalLabel2
                },
                xAxis: {
                    showEmpty: false,
                    title: {
                        text: settings.xLabel,
                        margin: 10,
                        style: {
                            fontFamily: '"Arial", "Helvetica", sans-serif',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        style: {
                            fontFamily: '"Arial", "Helvetica", sans-serif',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    categories: settings.categories
                },
                yAxis: {
                    showEmpty: false,
                    title: {
                        text: settings.yLabel,
                        style: {
                            fontFamily: '"Arial", "Helvetica", sans-serif',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        var tooltip = '';
                        tooltip += '<strong>' + this.percentage + '%</strong>of ' + _self.options.localImpact.totalLabel.toLowerCase() + ' ' + settings.yLabel.toLowerCase() + ' within the affected area.<br/>';
                        if (this.point && this.point.description) {
                            tooltip += '(' + this.point.description + ')';
                        }
                        return tooltip;
                    },
                    style: {
                        fontFamily: '"Arial", "Helvetica", sans-serif',
                        fontSize: '12px',
                        fontWeight: 'normal'
                    }
                },
                series: [{
                    data: settings.series
                }]
            };
            if (settings.type === 'income') {
                cfg.title = null;
                cfg.tooltip.formatter = function() {
                    var tooltip = '';
                    tooltip += '<strong>' + this.percentage + '%</strong>of the population earns ' + this.x.toLowerCase() + '.<br/>';
                    if (this.point && this.point.description) {
                        tooltip += '(' + this.point.description + ')';
                    }
                    return tooltip;
                };
            }
            if(settings.type === 'business'){
                cfg.title.text = settings.series[0].total + ' ' + settings.yLabel.toLowerCase() + ' affected within select categories';
            }
            return cfg;
        },
        // update LIM chart
        updateChart: function(settings) {
            var _self = this;
            if (settings) {
                var chartConfig = {};
                if (settings.type === 'income') {
                    settings.xLabel = 'Household Income';
                    settings.yLabel = 'Percentage';
                } else if (settings.type === 'population') {
                    settings.xLabel = _self.options.localImpact.xLabelPop;
                    settings.yLabel = _self.options.localImpact.yLabelPop;
                } else if (settings.type === 'business') {
                    settings.xLabel = _self.options.localImpact.xLabelBus;
                    settings.yLabel = _self.options.localImpact.yLabelBus;
                } else if (settings.type === 'infrastructure') {
                    settings.xLabel = _self.options.localImpact.xLabelInf;
                    settings.yLabel = _self.options.localImpact.yLabelInf;
                }
                chartConfig = _self.getChartConfig(settings);
                _self.options.localImpact.lastSettings = settings;
                domClass.remove(dom.byId('chartContainer'), "Loading");
                _self.options.localImpactChart = new Highcharts.Chart(chartConfig);
            } else {
                _self.noResults();
            }
        },
        // get percentage
        getPercentage: function(x, total) {
            return Math.round((parseInt(x, 10) / parseInt(total, 10)) * 1000) / 10;
        },
        // set population chart data
        setChartDataPop: function(featureSet) {
            var _self = this;
            if (featureSet) {
                var series = [];
                var total = featureSet.features[0].attributes.TOTPOP;
                var chartCats = ['Under 5 Years', '5 to 19 Years', '20 to 29 Years', '30 to 39 Years', '40 to 49 Years', '50 to 60 Years', '60 to 64 Years', '65 Years or Older'];
                var chartData = [
                0, 0, 0, 0, 0, 0, 0, 0];
                var i;
                // create series objects
                if (featureSet.fields) {
                    for (i = 0; i < featureSet.fields.length; i++) {
                        if (featureSet.fields[i].name === 'MALE0') {
                            chartData[0] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE5') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE10') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE15') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE20') {
                            chartData[2] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE25') {
                            chartData[2] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE30') {
                            chartData[3] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE35') {
                            chartData[3] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE40') {
                            chartData[4] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE45') {
                            chartData[4] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE50') {
                            chartData[5] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE55') {
                            chartData[5] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE60') {
                            chartData[6] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE65') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE70') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE75') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE80') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'MALE85') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM0') {
                            chartData[0] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM5') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM10') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM15') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM20') {
                            chartData[2] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM25') {
                            chartData[2] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM30') {
                            chartData[3] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM35') {
                            chartData[3] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM40') {
                            chartData[4] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM45') {
                            chartData[4] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM50') {
                            chartData[5] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM55') {
                            chartData[5] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM60') {
                            chartData[6] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM65') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM70') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM75') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM80') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'FEM85') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                    }
                    for (i = 0; i < chartCats.length; i++) {
                        series.push({
                            percentage: _self.getPercentage(chartData[i], total),
                            id: chartCats[i],
                            name: chartCats[i],
                            color: _self.impactColor,
                            total: total,
                            x: i,
                            y: chartData[i]
                        });
                    }
                }
                if (total === 0) {
                    _self.noResults();
                } else if (_self._lastTotal === total && _self.options.localImpact.lastSettings) {
                    _self.updateChart(_self.options.localImpact.lastSettings);
                } else {
                    _self._lastTotal = total;
                    // update chart
                    _self.updateChart({
                        series: series,
                        categories: chartCats,
                        type: 'population'
                    });
                }
            }
        },
        // set population chart data
        setChartDataIncome: function(featureSet) {
            var _self = this;
            if (featureSet) {
                var series = [];
                var total = 0;
                var chartCats = ["<$15,000", "$15,000 - $24,999", "$25,000 - $34,999", "$35,000 - $49,999", "$50,000 - $74,999", "$75,000 - $99,999", "$100,000 - $149,999", "$150,000 - $199,999", "$200,000+"];
                var chartData = [
                0, 0, 0, 0, 0, 0, 0, 0, 0];
                var i;
                // create series objects
                if (featureSet.fields) {
                    for (i = 0; i < featureSet.fields.length; i++) {
                        if (featureSet.fields[i].name === 'HINC0_CY_P') {
                            chartData[0] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC15_CY_P') {
                            chartData[1] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC25_CY_P') {
                            chartData[2] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC35_CY_P') {
                            chartData[3] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC50_CY_P') {
                            chartData[4] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC75_CY_P') {
                            chartData[5] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC100_CY_P') {
                            chartData[6] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC150_CY_P') {
                            chartData[7] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                        if (featureSet.fields[i].name === 'HINC200_CY_P') {
                            chartData[8] += featureSet.features[0].attributes[featureSet.fields[i].name];
                            total += featureSet.features[0].attributes[featureSet.fields[i].name];
                        }
                    }
                    for (i = 0; i < chartCats.length; i++) {
                        series.push({
                            percentage: _self.getPercentage(chartData[i], total),
                            id: chartCats[i],
                            name: chartCats[i],
                            color: _self.impactColor,
                            total: total,
                            x: i,
                            y: chartData[i]
                        });
                    }
                }
                if (total === 0) {
                    _self.noResults();
                } else if (_self._lastTotal === total && _self.options.localImpact.lastSettings) {
                    _self.updateChart(_self.options.localImpact.lastSettings);
                } else {
                    _self._lastTotal = total;
                    // update chart
                    _self.updateChart({
                        series: series,
                        categories: chartCats,
                        type: 'income'
                    });
                }
            }
        },
        // set population chart data
        setChartDataInfrastructure: function(featureSet) {
            var _self = this;
            if (featureSet) {
                var series = [];
                var total = 0;
                var chartCats = [];
                var chartData = [];
                var i;
                // create series objects
                if (featureSet.features) {
                    for (i = 0; i < featureSet.features.length; i++) {
                        chartCats.push(featureSet.features[i].attributes['CIKR_Type']);
                        chartData.push(parseInt(featureSet.features[i].attributes['FREQUENCY'], 10));
                        total += parseInt(featureSet.features[i].attributes['FREQUENCY'], 10);
                    }
                    for (i = 0; i < chartCats.length; i++) {
                        series.push({
                            percentage: _self.getPercentage(chartData[i], total),
                            id: chartCats[i],
                            name: chartCats[i],
                            color: _self.impactColor,
                            total: total,
                            x: i,
                            y: chartData[i]
                        });
                    }
                }
                if (total === 0) {
                    _self.noResults();
                } else if (_self._lastTotal === total && _self.options.localImpact.lastSettings) {
                    _self.updateChart(_self.options.localImpact.lastSettings);
                } else {
                    _self._lastTotal = total;
                    // update chart
                    _self.updateChart({
                        series: series,
                        categories: chartCats,
                        type: 'infrastructure'
                    });
                }
            }
        },
        // set population chart data
        setChartDataBusiness: function(featureSet) {
            var _self = this;
            if (featureSet) {
                var series = [];
                var total = 0;
                var chartCats = [];
                var chartData = [];
                var i;
                // create series objects
                if (featureSet.features) {
                    for (i = 0; i < featureSet.features.length; i++) {
                        chartCats.push(featureSet.features[i].attributes['Description']);
                        chartData.push(parseInt(featureSet.features[i].attributes['FREQUENCY'], 10));
                        total += parseInt(featureSet.features[i].attributes['FREQUENCY'], 10);
                    }
                    for (i = 0; i < chartCats.length; i++) {
                        series.push({
                            percentage: _self.getPercentage(chartData[i], total),
                            id: chartCats[i],
                            name: chartCats[i],
                            color: _self.impactColor,
                            total: total,
                            x: i,
                            y: chartData[i]
                        });
                    }
                }
                if (total === 0) {
                    _self.noResults();
                } else if (_self._lastTotal === total && _self.options.localImpact.lastSettings) {
                    _self.updateChart(_self.options.localImpact.lastSettings);
                } else {
                    _self._lastTotal = total;
                    // update chart
                    _self.updateChart({
                        series: series,
                        categories: chartCats,
                        type: 'business'
                    });
                }
            }
        },
        // no results found
        noResults: function() {
            var _self = this;
            _self.options.localImpact.lastSettings = false;
            var html = '';
            html += '<div class="noResults"><p>' + _self.options.localImpact.noResultsText + ' View the <a id="fullImpact" class="fullImpact">full impact area</a>.<p></div>';
            query('#chartContainer')[0].innerHTML = html;
            domClass.remove(dom.byId('chartContainer'), "Loading");
        },
        queryInfrastructureChartData: function(geometry) {
            var _self = this;
            esriRequest({
                url: 'data/infrastructure.js',
                timeout: 1000,
                handleAs: "json",
                load: function(data) {
                    _self.setChartDataInfrastructure(data);
                }
            });
        },
        queryBusinessChartData: function(geometry) {
            var _self = this;
            esriRequest({
                url: 'data/business.js',
                timeout: 1000,
                handleAs: "json",
                load: function(data) {
                    _self.setChartDataBusiness(data);
                }
            });
        },
        queryIncomeChartData: function(geometry) {
            var _self = this;
            esriRequest({
                url: 'data/income.js',
                timeout: 1000,
                handleAs: "json",
                load: function(data) {
                    var featureSet = data.results[0].value.FeatureSet[0];
                    _self.setChartDataIncome(featureSet);
                }
            });
        },
        // get population chart data
        queryPopulationChartData: function(geometry) {
            var _self = this;
            esriRequest({
                url: 'data/population.js',
                timeout: 1000,
                handleAs: "json",
                load: function(data) {
                    var featureSet = data.results[0].value.FeatureSet[0];
                    _self.setChartDataPop(featureSet);
                }
            });
        },
        // get layer of impact area by layer title
        getLayerByTitle: function(title) {
            var _self = this;
            for (var i = 0; i < _self.itemInfo.itemData.operationalLayers.length; i++) {
                var layer = _self.itemInfo.itemData.operationalLayers[i];
                if (layer.title === title) {
                    return _self.map.getLayer(layer.id);
                }
            }
            return false;
        },
        // intersect extent with geo and then get chart
        getChart: function() {
            var _self = this;
            if (_self.options.customPoly) {
                var polygon = new Polygon(_self.options.customPoly);
                var isIntersecting = polygon.isSelfIntersecting();
                if (isIntersecting) {
                    _self.clearDraw();
                    _self.alertDialog('Please draw a non-intersecting impact area');
                    _self.getChart();
                } else {
                    switch (_self.options.localImpact.defaultPanel) {
                    case 'population':
                        _self.queryPopulationChartData(_self.options.customPoly);
                        break;
                    case 'income':
                        _self.queryIncomeChartData(_self.options.customPoly);
                        break;
                    case 'business':
                        _self.queryBusinessChartData(_self.options.customPoly);
                        break;
                    case 'infrastructure':
                        _self.queryInfrastructureChartData(_self.options.customPoly);
                        break;
                    }
                }
            } else {
                var newGeometry = _self.options.localImpact.impactGeo[0];
                if (newGeometry) {
                    switch (_self.options.localImpact.defaultPanel) {
                    case 'population':
                        _self.queryPopulationChartData(newGeometry);
                        break;
                    case 'income':
                        _self.queryIncomeChartData(newGeometry);
                        break;
                    case 'business':
                        _self.queryBusinessChartData(newGeometry);
                        break;
                    case 'infrastructure':
                        _self.queryInfrastructureChartData(newGeometry);
                        break;
                    }
                } else {
                    _self.noResults();
                }
            }
        },
        // change panel type
        getImpactGeo: function() {
            var _self = this;
            var impactArea = _self.getLayerByTitle(_self.options.localImpact.layerTitle);
            if (impactArea) {
                var rgba = impactArea.renderer.symbol.color.toRgba();
                _self.impactColor = "000000";
                if(rgba && rgba.length == 4){
                    _self.impactColor = 'rgba('+ rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3]  +')';   
                }
                // set up query
                var query = new Query();
                // only within extent
                query.geometry = _self.map.extent;
                // if where specified
                if (_self.options.localImpact.polygonWhere) {
                    // give me all of them!
                    query.where = _self.options.localImpact.polygonWhere;
                } else {
                    query.where = "1=1";
                }
                // make sure I get them back in my spatial reference
                query.outSpatialReference = _self.map.extent.spatialReference;
                // get em!
                impactArea.queryFeatures(query, function(featureSet) {
                    // if we get results back
                    if (featureSet && featureSet.features && featureSet.features.length > 0) {
                        // insert html
                        _self.insertLocalImpactHTML();
                        // set delegations
                        _self.localImpactDelegations();
                        // resize
                        _self.resizeMap();
                        var geometries = [];
                        for (var i = 0; i < featureSet.features.length; i++) {
                            geometries.push(featureSet.features[i].geometry);
                        }
                        _self.options.localImpact.impactGeo = geometries;
                        if (_self.options.localImpact.draw) {
                            _self.placeDrawButton();
                        }
                        _self.getChart();
                        _self.options.previousExtent = _self.options.startExtent;
                    }
                });
            }
        },
        destroyChart: function() {
            var _self = this;
            if (_self.options.localImpactChart) {
                _self.options.localImpactChart.destroy();
                _self.options.localImpactChart = null;
            }
            query('#chartContainer')[0].innerHTML = '';
        },
        // change LIM panel
        setSelectedChart: function(obj) {
            var _self = this;
            _self.destroyChart();
            query('#chartUl li.dataType').removeClass("selected");
            domClass.add(obj, "selected");
            _self.options.localImpact.defaultPanel = query(obj).attr('data-panel')[0];
            _self.getChart();
        },
        // change LIM panel
        setChartType: function(obj) {
            var _self = this;
            _self.destroyChart();
            query('#chartUl li.rightMenu .mapButton').removeClass("buttonSelected");
            query('.mapButton', obj).addClass('buttonSelected');
            _self.options.localImpact.chartType = query(obj).attr('data-type')[0];
            _self.updateChart(_self.options.localImpact.lastSettings);
        },
        // refresh timer
        refreshChart: function() {
            var _self = this;
            clearTimeout(_self.options.localImpactRefresh);
            _self.options.localImpactRefresh = setTimeout(function() {
                if (!_self.options.customPoly) {
                    _self.destroyChart();
                    _self.getChart();
                }
            }, 1200);
        },
        // event connections
        localImpactDelegations: function() {
            var _self = this;
            var toggler = query("#chartHidden");
            // on toggle clicks
            on(query("#graphBar .ui-widget-header"), "click, keyup", function() {
                var toggle = query('.toggle', this);
                if (domClass.contains(toggle[0], "open")) {
                    domClass.remove(toggle[0], "open");
                    toggler.style('display', 'none');
                    _self.resizeMap();
                } else {
                    domClass.add(toggle[0], "open");
                    toggler.style('display', 'block');
                    _self.getChart();
                    _self.resizeMap();
                }
            });
            // on toggle clicks
            on(query("#chartContainer"), ".fullImpact:click, .fullImpact:keyup", function() {
                _self.map.setExtent(_self.options.startExtent);
            });
            // on toggle clicks
            on(query("#chartUl li.dataType"), "click, keyup", function() {
                _self.setSelectedChart(this);
            });
            // on toggle clicks
            on(query("#chartUl li.rightMenu"), "click, keyup", function() {
                _self.setChartType(this);
            });
        },
        // chart html
        insertLocalImpactHTML: function() {
            var _self = this;
            var html = '';
            html += '<div class="ui-widget-header">';
            html += '<div class="toggle open"></div>';
            html += '<span id="limTitle"></span>';
            html += '<div class="clear"></div>';
            html += '</div>';
            html += '<div id="chartHidden">';
            html += '<div class="chartMenu">';
            html += '<ul id="chartUl">';
            html += '<li class="dataType" data-panel="population">' + _self.options.localImpact.population + '</li>';
            html += '<li class="dataType" data-panel="income">Income</li>';
            html += '<li class="dataType" data-panel="business">Business</li>';
            //html += '<li class="dataType" data-panel="infrastructure">Infrastructure</li>';
            html += '</ul>';
            html += '<div class="clear"></div>';
            html += '</div>';
            html += '<div class="clear"></div>';
            html += '<div id="chartContainer"></div>';
            html += '</div>';
            // INSERT HTML
            var node = query('#graphBar');
            node.style('display', 'block');
            node[0].innerHTML = html;
            domClass.add(query('#chartUl li[data-panel="' + _self.options.localImpact.defaultPanel + '"]')[0], "selected");
        },
        clearDraw: function() {
            var _self = this;
            _self.destroyChart();
            _self.options.localImpact.graphics.clear();
            query('#clearButton').orphan();
            _self.options.customPoly = false;
        },
        // add drawed geometry to map
        addToMap: function(geometry) {
            var _self = this;
            if (_self.options.localImpact.graphics) {
                _self.clearDraw();
            } else {
                _self.options.localImpact.graphics = new GraphicsLayer();
                _self.map.addLayer(_self.options.localImpact.graphics);
            }
            if (geometry) {
                _self.destroyChart();
                _self.options.toolbar.deactivate();
                var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                var graphic = new Graphic(geometry, symbol);
                _self.options.localImpact.graphics.add(graphic);
                var html = '<div id="clearButton" class="mapDelete buttonSingle clearButton">Clear Impact Area</div>';
                domConstruct.place(html, dom.byId('draw'), 'last');
                _self.options.customPoly = geometry;
                _self.getChart();
            }
        },
        // create drawing toolbar
        createToolbar: function() {
            var _self = this;
            _self.options.toolbar = new Draw(_self.map);
            connect.connect(_self.options.toolbar, "onDrawEnd", function(geometry) {
                _self.addToMap(geometry);
            });
        },
        toggleDraw: function() {
            var _self = this;
            _self.options.toolbar.activate(Draw.FREEHAND_POLYGON);
        },
        placeDrawButton: function() {
            var _self = this;
            var html = '<div class="draw" id="draw"><div id="drawButton" class="mapSubmit buttonSingle drawButton">Draw Impact Area</div></div>';
            domConstruct.place(html, dom.byId('mapcon'), 'first');
            // on toggle clicks
            on(query("#draw"), ".drawButton:click, .drawButton:keyup", function() {
                _self.toggleDraw();
            });
            // on toggle clicks
            on(query("#draw"), ".clearButton:click, .clearButton:keyup", function() {
                _self.clearDraw();
                _self.getChart();
            });
            _self.createToolbar();
        },
        // init LIM
        initLocalImpact: function() {
            var _self = this;
            // default variables
            _self.options.carouselFeats = {};
            // Chart credits
            _self.options.credits = {
                enabled: false
            };
            // Chart labels
            _self.options.localImpact.xLabelInf = 'Types';
            _self.options.localImpact.yLabelInf = 'Structures';
            _self.options.localImpact.xLabelBus = 'Types';
            _self.options.localImpact.yLabelBus = 'Businesses';
            _self.options.localImpact.xLabelPop = 'Age (years)';
            _self.options.localImpact.yLabelPop = 'Population';
            // UI labels
            _self.options.localImpact.infrastructure = 'Infrastructure';
            _self.options.localImpact.business = 'Business';
            _self.options.localImpact.population = 'Population';
            _self.options.localImpact.pieLabel = 'Pie';
            _self.options.localImpact.barLabel = 'Bar';
            _self.options.localImpact.totalLabel = ' estimated ';
            _self.options.localImpact.totalLabel2 = ' within the affected area';
            _self.options.localImpact.noResultsText = 'Search is outside of impact area.';
            // Data Schema
            _self.options.localImpact.descField = 'Description';
            _self.options.localImpact.colorField = 'ColorCode';
            _self.options.localImpact.infrastructureLabel = 'CIKR_Type';
            _self.options.localImpact.infrastructureType = 'CIKR_TypeID';
            _self.options.localImpact.infrastructureCount = 'Count_CIKR_TypeID';
            _self.options.localImpact.businessLabel = 'INDUSTRY';
            _self.options.localImpact.businessType = 'NAICS_short';
            _self.options.localImpact.businessCount = 'COUNT_NAICS_short';
            _self.options.localImpact.populationLabel = 'FieldTitle';
            _self.options.localImpact.populationType = 'FieldName';
            _self.options.localImpact.populationGroup = 'STATE_FIPS';
            _self.options.localImpact.populationFields = "AGE_UNDER5, AGE_5_17, AGE_18_21, AGE_22_29, AGE_30_39, AGE_40_49, AGE_50_64, AGE_65_UP, POP2010";
            // init
            _self.getImpactGeo();
        },
        addReportInAppButton: function() {
            var _self = this;
            if (_self.options.bannedUsersService) {
                _self.removeReportInAppButton();
                var html = '<span id="inFlag"><a id="reportItem">Flag as inappropriate</a></span>';
                domConstruct.place(html, query('.esriPopup .actionList')[0], 'last');
                _self.options.flagConnect = connect.connect(dom.byId('reportItem'), 'onclick', function() {
                    var node = dom.byId('inFlag');
                    if (node) {
                        node.innerHTML = '<span id="reportLoading"></span> Reporting&hellip;';
                        _self.ReportInapp();
                    }
                });
            }
        },
        removeReportInAppButton: function() {
            query('#inFlag').orphan();
        },
        replaceFlag: function() {
            var node = dom.byId('inFlag');
            if (node) {
                node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>';
            }
        },
        replaceFlagError: function() {
            var node = dom.byId('inFlag');
            if (node) {
                node.innerHTML = 'Error flagging content.';
            }
        },
        ReportInapp: function() {
            var _self = this;
            if (_self.options.bannedUsersService && _self.options.flagMailServer) {
                esriRequest({
                    url: _self.options.flagMailServer,
                    content: {
                        "op": "send",
                        "auth": "esriadmin",
                        "author": _self.options.activeFeature.attributes.filterAuthor,
                        "appname": _self.itemInfo.item.title,
                        "type": _self.options.activeFeature.attributes.filterType,
                        "content": _self.options.activeFeature.attributes.filterContent
                    },
                    handleAs: 'json',
                    callbackParamName: 'callback',
                    // on load
                    load: function() {
                        _self.replaceFlag();
                    },
                    error: function() {
                        _self.replaceFlagError();
                    }
                });
            } else {
                _self.replaceFlagError();
            }
        },
        // Set false url param strings to false
        setFalseValues: function(obj) {
            // for each key
            for (var key in obj) {
                // if not a prototype
                if (obj.hasOwnProperty(key)) {
                    // if is a false value string
                    if (typeof obj[key] === 'string' && (obj[key].toLowerCase() === 'false' || obj[key].toLowerCase() === 'null' || obj[key].toLowerCase() === 'undefined')) {
                        // set to false bool type
                        obj[key] = false;
                    }
                    // if it's a true string
                    else if (typeof obj[key] === 'string' && obj[key].toLowerCase() === 'true') {
                        obj[key] = true;
                    }
                }
            }
            // return object
            return obj;
        },
        // set application configuration settings
        getItemData: function(all) {
            var _self = this;
            var deferred = new Deferred();
            if (_self.options.appid) {
                var dataUrl;
                if (all) {
                    dataUrl = arcgisUtils.arcgisUrl + "/" + _self.options.appid;
                } else {
                    dataUrl = arcgisUtils.arcgisUrl + "/" + _self.options.appid + "/data";
                }
                esriRequest({
                    url: dataUrl,
                    content: {
                        f: "json"
                    },
                    callbackParamName: "callback",
                    // on load
                    load: function(response) {
                        // callback function
                        deferred.resolve(response);
                    },
                    // on error
                    error: function(response) {
                        var error = response.message;
                        // show error dialog
                        var dialog = new Dialog({
                            title: i18n.viewer.errors.general,
                            content: '<div class="padContainer">' + error + '</div>'
                        });
                        dialog.show();
                        deferred.resolve();
                    }
                });
            } else {
                deferred.resolve();
            }
            return deferred;
        },
        getUrlObject: function() {
            var params = urlUtils.urlToObject(document.location.href);
            // make sure it's an object
            params.query = params.query || {};
            return params;
        },
        // get URL params
        configUrlParams: function() {
            var _self = this;
            // set url object
            var params = this.getUrlObject();
            // check for false value strings
            params.query = this.setFalseValues(params.query);
            // mix in settings
            _self.options = declare.safeMixin(_self.options, params.query);
        },
        // Set sharing links
        setSharing: function() {
            var _self = this;
            // parameters to share
            var urlParams = ['webmap', 'appid', 'basemap', 'extent', 'locateName', 'layers', 'locatePoint'];
            if (urlParams) {
                _self.options.shareParams = '';
                // for each parameter
                for (var i = 0; i < urlParams.length; i++) {
                    // if it's set in _self.options
                    if (_self.options.hasOwnProperty(urlParams[i]) && (_self.options[urlParams[i]].toString() !== '') || typeof(_self.options[urlParams[i]]) === 'object') {
                        // if it's the first param
                        if (i === 0) {
                            _self.options.shareParams = '?';
                        } else {
                            _self.options.shareParams += '&';
                        }
                        // show it
                        _self.options.shareParams += urlParams[i] + '=' + encodeURIComponent(_self.options[urlParams[i]].toString());
                    }
                }
                var params = this.getUrlObject();
                // embed path URL
                var pathUrl = params.path.substring(0, params.path.lastIndexOf('/'));
                // Sharing url
                _self.options.shareURL = pathUrl + '/' + _self.options.homePage + _self.options.shareParams;
                // quick embed width
                var embedWidth = _self.options.embedWidth || _self.options.embedSizes.medium.width;
                var embedHeight = _self.options.embedHeight || _self.options.embedSizes.medium.height;
                // iframe code
                _self.options.embedURL = '<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="' + embedWidth + '" height="' + embedHeight + '" align="center" src="' + _self.options.shareURL + '"></iframe>';
                var inputEmbed = dom.byId('inputEmbed');
                if (inputEmbed) {
                    query(inputEmbed).attr('value', _self.options.embedURL);
                }
                var quickEmbed = dom.byId('quickEmbedCode');
                if (quickEmbed) {
                    query(quickEmbed).attr('value', _self.options.embedURL);
                }
                var inputShare = dom.byId('inputShare');
                if (inputShare) {
                    query(inputShare).attr('value', _self.options.shareURL);
                }
            }
        },
        // set defaults for config
        setDefaultOptions: function() {
            var _self = this;
            if (!_self.options.locateName) {
                _self.options.locateName = "";
            }
            _self.options.previewSize = {
                "width": 900,
                "height": 750
            };
            _self.options.embedSizes = {
                "small": {
                    width: 480,
                    height: 360
                },
                "medium": {
                    width: 700,
                    height: 525
                },
                "large": {
                    width: 940,
                    height: 705
                },
                "maximum": {
                    width: 1900,
                    height: 1200
                },
                "minimum": {
                    width: 350,
                    height: 250
                }
            };
            _self.options.previewPage = 'preview.html';
            _self.options.homePage = 'index.html';
            if (!_self.options.layerInfos) {
                _self.options.layerInfos = [];
            }
            if (_self.options.layers && typeof _self.options.layers === 'string') {
                _self.options.layers = _self.options.layers.split(',');
            } else {
                _self.options.layers = [];
            }
            if (_self.options.locatePoint && typeof _self.options.locatePoint === 'string') {
                _self.options.locatePoint = _self.options.locatePoint.split(',');
            } else {
                _self.options.locatePoint = [];
            }
            if (window.dojoConfig.locale && window.dojoConfig.locale.indexOf("ar") !== -1) {
                //right now checking for Arabic only, to generalize for all RTL languages
                _self.options.isRightToLeft = true; // _self.options.isRightToLeft property setting to true when the locale is 'ar'
            }
            var dirNode = query('html');
            if (_self.options.isRightToLeft) {
                _self.options.dir = 'rtl';
                dirNode.attr("dir", "rtl");
                dirNode.addClass('esriRtl');
            } else {
                _self.options.dir = 'ltr';
                dirNode.attr("dir", "ltr");
                dirNode.addClass('esriLtr');
            }
        },
        // make sure config options are correct
        validateConfig: function() {
            var _self = this;
            //need to set the sharing url here so that when we query the applciation and organization the correct
            //location is searched.
            if (location.host.indexOf("arcgis.com") === -1) {
                //default (Not Hosted no org specified)
                arcgisUtils.arcgisUrl = location.protocol + "//www.arcgis.com/sharing/rest/content/items";
            } else {
                // org app
                arcgisUtils.arcgisUrl = location.protocol + '//' + location.host + "/sharing/rest/content/items";
                _self.options.proxyUrl = location.protocol + '//' + location.host + "/sharing/proxy";
            }
            //if the sharing url is set overwrite value
            if (_self.options.sharingurl) {
                arcgisUtils.arcgisUrl = _self.options.sharingurl + 'sharing/rest/content/items';
            }
            // Set geometry to HTTPS if protocol is used
            if (templateConfig.helperServices.geometry.url && location.protocol === "https:") {
                templateConfig.helperServices.geometry.url = templateConfig.helperServices.geometry.url.replace('http:', 'https:');
            }
            // https locator url
            if (templateConfig.helperServices.geocode.url && location.protocol === "https:") {
                templateConfig.helperServices.geocode.url = templateConfig.helperServices.geocode.url.replace('http:', 'https:');
            }
            config.defaults.geometryService = new GeometryService(templateConfig.helperServices.geometry.url);
            config.defaults.io.proxyUrl = _self.options.proxyUrl;
            config.defaults.io.corsEnabledServers = [location.protocol + '//' + location.host];
            config.defaults.io.alwaysUseProxy = false;
        },
        // Alert box
        alertDialog: function(text) {
            var _self = this;
            if (_self._alertDialog) {
                _self._alertDialog.destroy();
            }
            if (_self.alertCloseConnect) {
                connect.disconnect(_self.alertCloseConnect);
            }
            var html = '';
            html += '<div class="padContainer">';
            html += '<div>';
            html += text;
            html += '</div>';
            html += '<div class="buttons">';
            html += '<span id="closeAlert" tabindex="0" class="mapSubmit">' + i18n.viewer.general.ok + '</span>';
            html += '</div>';
            html += '</div>';
            var props = {
                style: "width: 350px",
                draggable: true,
                modal: false,
                showTitle: true,
                title: i18n.viewer.errors.general,
                content: html
            };
            _self._alertDialog = new Dialog(props, dom.byId('alertDialog'));
            _self._alertDialog.show();
            var closeAlert = dom.byId("closeAlert");
            if (closeAlert) {
                _self.alertCloseConnect = on(closeAlert, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self._alertDialog.hide();
                    }
                });
            }
        },
        // create the basemap gallery when active
        createBMGallery: function() {
            var _self = this;
            var basemapGroup = false;
            if (!_self.options.useArcGISOnlineBasemaps) {
                basemapGroup = {
                    title: _self.options.basemapGroupTitle,
                    owner: _self.options.basemapGroupOwner
                };
            }
            // basemap gallery
            _self.basemapDijit = new BasemapGallery({
                showArcGISBasemaps: _self.options.useArcGISOnlineBasemaps,
                basemapsGroup: basemapGroup,
                map: _self.map
            }, domConstruct.create("div"));
            // on initial load
            connect.connect(_self.basemapDijit, "onLoad", function() {
                query('#map').removeClass('mapLoading');
                _self.selectCurrentBasemap().then(function() {
                    connect.connect(_self.basemapDijit, "onSelectionChange", function() {
                        _self.baseMapChanged();
                    });
                });
            });
            // start it up
            _self.basemapDijit.startup();
            var baseContainer = dom.byId("baseContainer");
            if (baseContainer) {
                domConstruct.place(_self.basemapDijit.domNode, baseContainer, "first");
            }
        },
        // Gets current basemap ID by its title
        getBasemapIdTitle: function(title) {
            var _self = this;
            var bmArray = _self.basemapDijit.basemaps;
            if (bmArray) {
                for (var i = 0; i < bmArray.length; i++) {
                    if (bmArray[i].title === title) {
                        return bmArray[i].id;
                    }
                }
            }
            return false;
        },
        // Gets current basemap id by its Item ID on arcgisonline
        getBasemapId: function(itemId) {
            var _self = this;
            var bmArray = _self.basemapDijit.basemaps;
            if (bmArray) {
                for (var i = 0; i < bmArray.length; i++) {
                    if (bmArray[i].itemId === itemId) {
                        return bmArray[i].id;
                    }
                }
            }
            return false;
        },
        // Selects a basemap by its title
        selectCurrentBasemap: function() {
            var _self = this;
            var deferred = new Deferred();
            _self._bmInitConnect = connect.connect(_self.basemapDijit, "onSelectionChange", function() {
                deferred.resolve();
                connect.disconnect(_self._bmInitConnect);
            });
            var bmid;
            if (_self.options.basemap) {
                bmid = _self.getBasemapId(_self.options.basemap);
                if (bmid) {
                    _self.basemapDijit.select(bmid);
                }
            } else {
                bmid = _self.getBasemapIdTitle(_self.itemInfo.itemData.baseMap.title);
                if (bmid) {
                    _self.basemapDijit.select(bmid);
                }
            }
            return deferred;
        },
        // on change of basemap, update selected basemap global variable
        baseMapChanged: function() {
            var _self = this;
            // get currently selected basemap
            var basemap = _self.basemapDijit.getSelected();
            if (basemap && basemap.itemId) {
                // update global
                _self.options.basemap = basemap.itemId;
            }
            // set sharing links and embed code
            _self.setSharing();
            _self.hideAllMenus();
        },
        adjustPopupSize: function(map) {
            var box = domGeom.getContentBox(map.container);
            var width = 270,
                height = 300,
                // defaults
                newWidth = Math.round(box.w * 0.60),
                newHeight = Math.round(box.h * 0.45);
            if (newWidth < width) {
                width = newWidth;
            }
            if (newHeight < height) {
                height = newHeight;
            }
            map.infoWindow.resize(width, height);
        },
        // Set initial extent for future use
        setStartExtent: function() {
            var _self = this;
            _self.options.startExtent = _self.map.extent;
            // if extent is a string
            if (_self.options.extent && typeof _self.options.extent === 'string') {
                var splitExtent = _self.options.extent.split(',');
                // Loaded from URL
                _self.options.startExtent = new Extent({
                    xmin: parseFloat(splitExtent[0]),
                    ymin: parseFloat(splitExtent[1]),
                    xmax: parseFloat(splitExtent[2]),
                    ymax: parseFloat(splitExtent[3]),
                    spatialReference: _self.map.extent.spatialReference
                });
            }
            _self.map.setExtent(_self.options.startExtent);
        },
        setStartLevel: function() {
            var _self = this;
            if (_self.options.level) {
                _self.map.setLevel(parseInt(_self.options.level, 10));
            }
        },
        setStartMarker: function() {
            var _self = this;
            if (_self.options.locatePoint[0] && _self.options.locatePoint[1]) {
                var point = new Point([_self.options.locatePoint[0], _self.options.locatePoint[1]], SpatialReference({
                    wkid: _self.map.spatialReference.wkid
                }));
                if (point) {
                    _self.setMarker(point, _self.options.locateName);
                }
            }
        },
        // set the order of these functions
        setOptions: function() {
            var _self = this;
            _self.configUrlParams();
            _self.setDefaultOptions();
            _self.validateConfig();
        },
        toggleSettingsContent: function() {
            var node = query('#collapseIcon')[0];
            var panel = query('#settingsDialog .dijitDialogPaneContent');
            domClass.toggle(node, "iconDown");
            if (domClass.contains(node, "iconDown")) {
                panel.style('display', 'none');
            } else {
                panel.style('display', 'block');
            }
        },
        // hide all dropdown menus
        hideAllMenus: function() {
            var _self = this;
            query('#topMenuCon .barButton').removeClass('barSelected');
            query('#mapcon .menuSelected').forEach(function(selectTag) {
                _self.hideMenu(selectTag);
            });
        },
        // Show dropdown menu
        showMenu: function(menuObj, buttonObj) {
            query('#mapcon .menuSelected').removeClass('menuSelected');
            if (menuObj) {
                coreFx.wipeIn({
                    node: menuObj,
                    duration: 200
                }).play();
                query(menuObj).addClass('menuSelected');
            }
            if (buttonObj) {
                query(buttonObj).addClass('barSelected');
            }
        },
        // zebra stripe css object
        zebraStripe: function(obj) {
            obj.removeClass("stripe");
            obj.filter(":nth-child(even)").addClass("stripe");
        },
        // Folder Layer CheckBoxes
        toggleChecked: function(obj) {
            var _self = this;
            var list = query(obj).parent('li');
            if (domClass.contains(list[0], "checked")) {
                list.removeClass('cLoading');
            } else {
                list.addClass('cLoading');
            }
            domClass.toggle(list[0], 'checked');
            _self.setSharing();
        },
        // removes layer from list of visible layers
        removeFromActiveLayers: function(layerid) {
            var _self = this;
            var theIndex = this.getActiveLayerIndex(layerid);
            for (theIndex; theIndex > -1; theIndex = this.getActiveLayerIndex(layerid)) {
                _self.options.layers.splice(theIndex, 1);
            }
            _self.setSharing();
        },
        // change active layers
        getActiveLayerIndex: function(layerid) {
            var _self = this;
            var indexNum = array.indexOf(_self.options.layers, layerid);
            return indexNum;
        },
        // adds layer to list of visible layers
        addToActiveLayers: function(layerid) {
            var _self = this;
            var theIndex = _self.getActiveLayerIndex(layerid);
            if (theIndex === -1) {
                _self.options.layers.push(layerid);
            }
            _self.setSharing();
        },
        // layers ui
        configureLayerUI: function() {
            var _self = this;
            var layersList = dom.byId("layersList");
            if (layersList) {
                on(layersList, ".toggle:click, .toggle:keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.toggleChecked(this);
                        var changeMapVal = query(this).parent('li').attr('data-layer')[0];
                        var splitVals = changeMapVal.split(',');
                        if (splitVals) {
                            for (var i = 0; i < splitVals.length; i++) {
                                _self.toggleMapLayer(splitVals[i]);
                            }
                        }
                        _self.hideLoading(query('#layersList li[data-layer="' + changeMapVal + '"]'));
                    }
                });
            }
            // ToolTips
            on(query(".listMenu"), ".cBinfo:click, .cBinfo:keyup", function(e) {
                if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                    var toolTip = query(this).parent('li').children('.infoHidden');
                    query('.listMenu ul li .cBinfo').removeClass('cBinfoAnim');
                    if (toolTip[0]) {
                        if (toolTip.style('display')[0] === 'none') {
                            query('.infoHidden').style('display', 'none');
                            query('.listMenu ul li').removeClass('active');
                            query(this).parent('li').addClass('active');
                            toolTip.style('display', 'block');
                            query(this).addClass('cBinfoAnim');
                        } else {
                            toolTip.style('display', 'none');
                            query(this).parent('li').removeClass('active');
                        }
                    }
                }
            });
            // Close Menus
            on(query(".slideMenu"), ".closeMenu:click, .closeMenu:keyup", function() {
                _self.hideAllMenus();
            });
            // Close ToolTips
            on(query(".listMenu"), ".ihClose:click, .ihClose:keyup", function() {
                _self.hideLayerInfo();
            });
            // config settings
            on(query(".listMenu"), ".cBconfig:click, .cBconfig:keyup", function(e) {
                if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                    _self.hideLayerInfo();
                    query('.listMenu ul li .cBconfig').removeClass('cBconfigAnim');
                    var parentLi = query(this).parent('li').attr('data-layer')[0];
                    var panelObj = query('#settingsDialog .cfgPanel[data-layer=' + parentLi + ']');
                    var panelBtn = query('#cfgMenu .mapButton[data-layer=' + parentLi + ']');
                    query('#cfgMenu span').removeClass('buttonSelected');
                    panelBtn.addClass('buttonSelected');
                    _self.options.customPopup.hide();
                    query(this).addClass('cBconfigAnim');
                    query("#settingsDialog .cfgPanel").style('display', 'none');
                    panelObj.style('display', 'block');
                    query('#collapseIcon').removeClass('iconDown');
                    query('#settingsDialog .dijitDialogPaneContent').style('display', 'block');
                    if (!_self.options.settingsDialog.get('open')) {
                        _self.options.settingsDialog.show();
                    } else if (_self.options.currentSettingsTab === parentLi) {
                        _self.options.settingsDialog.hide();
                    }
                    _self.options.currentSettingsTab = parentLi;
                }
            });
        },
        // toggle map layer on and off
        toggleMapLayer: function(layerid) {
            var _self = this;
            var layer = _self.map.getLayer(layerid);
            if (layer) {
                //if visible hide the layer
                if (layer.visible === true) {
                    layer.hide();
                    _self.removeFromActiveLayers(layerid);
                }
                //otherwise show and add to layers
                else {
                    layer.show();
                    _self.addToActiveLayers(layerid);
                }
            }
        },
        addLayerToUI: function(layerToAdd, index) {
            var _self = this;
            // each layer
            var layerClass;
            // URL layers variable
            var urlLayers = false;
            var params = _self.getUrlObject();
            // if visible layers set in URL
            if (params.query.hasOwnProperty('layers')) {
                urlLayers = true;
            }
            // generate layer html
            var html = '';
            // if layer object
            if (layerToAdd) {
                // default layer class
                layerClass = 'layer';
                // layer ids
                var dataLayers = '';
                // key variable
                var key;
                if (layerToAdd.featureCollection) {
                    // if feature collection layers
                    if (layerToAdd.featureCollection.layers) {
                        // for each feature collection
                        for (var k = 0; k < layerToAdd.featureCollection.layers.length; k++) {
                            // if URL layers set
                            if (urlLayers) {
                                // set layer visibility to false
                                layerToAdd.featureCollection.layers[k].visibility = false;
                                _self.map.getLayer(layerToAdd.featureCollection.layers[k].id).hide();
                                // for each visible layer array item
                                for (key in _self.options.layers) {
                                    // if current layer ID matches visible layer item
                                    if (_self.options.layers[key] === layerToAdd.featureCollection.layers[k].id) {
                                        // set visibility to true
                                        layerToAdd.featureCollection.layers[k].visibility = true;
                                        _self.map.getLayer(layerToAdd.featureCollection.layers[k].id).show();
                                    }
                                }
                            }
                            // if layer visibility is true
                            if (layerToAdd.featureCollection.layers[k].visibility === true) {
                                // set layer class to checked
                                layerClass = 'layer checked';
                                // add to active layers array
                                _self.addToActiveLayers(layerToAdd.featureCollection.layers[k].id);
                            }
                            // data layer attrubute
                            dataLayers += layerToAdd.featureCollection.layers[k].id;
                            // if not last feature collection add comma for splitting
                            if (k !== (layerToAdd.featureCollection.layers.length - 1)) {
                                dataLayers += ",";
                            }
                        }
                    }
                    // csv
                    else {
                        // if URL layers set
                        if (urlLayers) {
                            _self.map.getLayer(layerToAdd.id).hide();
                            layerToAdd.visibility = false;
                            // for each visible layer array item
                            for (key in _self.options.layers) {
                                // if current layer ID matches visible layer item
                                if (_self.options.layers[key] === layerToAdd.id) {
                                    // set visibility to true
                                    layerToAdd.visibility = true;
                                    _self.map.getLayer(layerToAdd.id).show();
                                }
                            }
                        }
                        // if layer visibility is true
                        if (layerToAdd.visibility === true) {
                            // set layer class to checked
                            layerClass = 'layer checked';
                            // add to active layers array
                            _self.addToActiveLayers(layerToAdd.id);
                        }
                        // data layer attrubute
                        dataLayers += layerToAdd.id;
                    }
                } else {
                    // if URL layers set
                    if (urlLayers) {
                        layerToAdd.visibility = false;
                        _self.map.getLayer(layerToAdd.id).hide();
                        // for each visible layer array item
                        for (key in _self.options.layers) {
                            // if current layer ID matches visible layer item
                            if (_self.options.layers[key] === layerToAdd.id) {
                                // set visibility to true
                                layerToAdd.visibility = true;
                                _self.map.getLayer(layerToAdd.id).show();
                            }
                        }
                    }
                    // if layer visibility is true
                    if (layerToAdd.visibility === true) {
                        // set layer class to checked
                        layerClass = 'layer checked';
                        // add to active layers array
                        _self.addToActiveLayers(layerToAdd.id);
                    }
                    // data layer attrubute
                    dataLayers += layerToAdd.id;
                }
                // Set data layers
                layerToAdd.dataLayers = dataLayers;
                // compose html list string
                html += '<li class="' + layerClass + '" data-layer="' + dataLayers + '">';
                html += '<div class="cover"></div>';
                html += '<span tabindex="0" class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
                html += '<span tabindex="0" class="toggle cBox"></span>';
                html += '<span tabindex="0" class="toggle cBtitle" title="' + layerToAdd.title + '">' + layerToAdd.title.replace(/[\-_]/g, " ") + '</span>';
                html += '<div class="clear"></div>';
                html += '<div class="infoHidden">';
                html += '<div title="' + i18n.viewer.general.close + '" class="ihClose"></div>';
                if (layerToAdd.resourceInfo) {
                    html += '<div class="infoHiddenScroll">';
                    if (layerToAdd.resourceInfo.serviceDescription || layerToAdd.resourceInfo.description) {
                        if (layerToAdd.resourceInfo.serviceDescription) {
                            html += (layerToAdd.resourceInfo.serviceDescription);
                        }
                        if (layerToAdd.resourceInfo.description) {
                            html += (layerToAdd.resourceInfo.description);
                        }
                    }
                    html += '</div>';
                } else {
                    html += '<div>' + i18n.viewer.errors.nodesc + '</div>';
                }
                html += '<div class="transSlider"><span class="transLabel">' + i18n.viewer.layer.transparency + '</span><span id="layerSlider' + index + '" data-layer-id="' + dataLayers + '" class="uiSlider slider"></span></div>';
                html += '</div>';
            }
            html += '</li>';
            // append html
            var node = dom.byId('layersList');
            if (node) {
                domConstruct.place(html, node, "first");
            }
        },
        // Show spinner on object
        showLoading: function(obj) {
            if (obj) {
                query('#' + obj).removeClass('LoadingComplete').addClass('Loading').style('display', 'inline-block');
            }
        },
        // remove loading spinners
        hideLoading: function(obj, obj2) {
            if (obj) {
                obj.removeClass('cLoading');
            }
            if (obj2) {
                obj2.removeClass('Loading').addClass('LoadingComplete');
            }
        },
        addLayerTransparencySlider: function(theLayer, index) {
            var _self = this;
            // if layer object
            if (theLayer) {
                // init sliders
                HorizontalSlider({
                    name: "slider",
                    value: parseFloat(theLayer.opacity * 100),
                    minimum: 1,
                    showButtons: false,
                    maximum: 100,
                    discreteValues: 20,
                    intermediateChanges: true,
                    style: "width:100px; display:inline-block; *display:inline; vertical-align:middle;",
                    onChange: function(value) {
                        _self.transparencyChange(value, theLayer.dataLayers);
                    }
                }, "layerSlider" + index);
            }
        },
        // create layer items
        configureLayers: function() {
            var _self = this;
            // if operational layers
            if (_self.itemInfo.itemData.operationalLayers) {
                // if operational layers of at least 1
                if (_self.itemInfo.itemData.operationalLayers.length > 0) {
                    if (!_self.options.layerInfos) {
                        _self.options.layerInfos = [];
                    }
                    // get legend layers
                    var legendLayers = arcgisUtils.getLegendLayers(_self.mapResponse);
                    // build layers
                    _self.options.layerInfos = _self.options.layerInfos.concat(legendLayers);
                    var node;
                    if (_self.options.showLegendMenu) {
                        node = dom.byId('legendMenu');
                        if (node) {
                            node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.legend.menuTitle + '<div class="clear"></div></div><div class="legendMenuCon"><div class="slideScroll"><div id="legendContent"></div></div></div>';
                        }
                        // Build Legend
                        if (_self.options.layerInfos && _self.options.layerInfos.length > 0) {
                            _self.options.legendDijit = new Legend({
                                map: _self.map,
                                layerInfos: _self.options.layerInfos
                            }, "legendContent");
                            _self.options.legendDijit.startup();
                        } else {
                            var legendContentNode = dom.byId('legendContent');
                            if (legendContentNode) {
                                legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
                            }
                        }
                    }
                    // ADD URL
                    node = dom.byId('layersMenu');
                    if (node) {
                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.layers.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="layersList"></ul>';
                    }
                    // for each layer
                    for (var i = 0; i < _self.itemInfo.itemData.operationalLayers.length; i++) {
                        _self.addLayerToUI(_self.itemInfo.itemData.operationalLayers[i], i);
                        _self.addLayerTransparencySlider(_self.itemInfo.itemData.operationalLayers[i], i);
                    }
                    _self.zebraStripe(query('#layersList li.layer'));
                }
                _self.options.scaleBar = new Scalebar({
                    map: _self.map,
                    attachTo: "bottom-left",
                    scalebarUnit: i18n.viewer.main.scaleBarUnits
                });
                _self.configureLayerUI();
            }
        },
        // slidder transparency change
        transparencyChange: function(value, layerID) {
            var _self = this;
            var newValue = (value / 100);
            var splitVals = layerID.split(',');
            if (splitVals) {
                for (var j = 0; j < splitVals.length; j++) {
                    var layer = _self.map.getLayer(splitVals[j]);
                    if (layer) {
                        if (layer._fLayers) {
                            for (var k = 0; k < layer._fLayers.length; k++) {
                                layer._fLayers[k].setOpacity(newValue);
                            }
                        } else {
                            layer.setOpacity(newValue);
                        }
                    }
                }
            }
        },
        // create places item
        createPlacesListItem: function(i) {
            var _self = this;
            // default vars //
            var html = '';
            // list html
            html += '<li data-index="' + i + '" class="layer sharedItem placesClick">';
            html += _self.itemInfo.itemData.bookmarks[i].name.replace(/[\-_]/g, " ");
            html += '</li>';
            // insert list item
            var node = dom.byId('placesList');
            if (node) {
                domConstruct.place(html, node, "last");
            }
        },
        // zoom to location: zooms map to location point
        zoomToLocation: function(x, y) {
            var _self = this;
            var lod = 16;
            // set point
            var pt = webMercatorUtils.geographicToWebMercator(new Point(x, y));
            // zoom and center
            _self.map.centerAndZoom(pt, lod);
        },
        // geolocation error
        geoLocateMapError: function(error) {
            this.alertDialog(error.toString());
        },
        // geolocate function: sets map location to users location
        geoLocateMap: function(position) {
            var _self = this;
            if (position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var IPAccuracy = position.coords.accuracy;
                _self.zoomToLocation(longitude, latitude, IPAccuracy);
            }
        },
        // configure places
        placesOnClick: function() {
            var _self = this;
            // places click
            var placesList = dom.byId("placesList");
            if (placesList) {
                on(placesList, ".placesClick:click, .placesClick:keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        var objIndex = query(this).attr('data-index');
                        if (objIndex !== -1) {
                            // create extent
                            var newExtent = new Extent(_self.itemInfo.itemData.bookmarks[objIndex].extent);
                            // set extent
                            _self.map.setExtent(newExtent);
                            _self.hideAllMenus();
                        }
                    }
                });
            }
            // places click
            var placesButton = dom.byId("placesButton");
            if (placesButton) {
                on(placesButton, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.toggleMenus('places');
                    }
                });
            }
        },
        // configure places
        configurePlaces: function() {
            var _self = this;
            // if places
            if (_self.options.showPlaces) {
                if (_self.itemInfo.itemData.bookmarks && _self.itemInfo.itemData.bookmarks.length > 0) {
                    // insert places button
                    var node = dom.byId('placesCon');
                    if (node) {
                        node.innerHTML = '<span tabindex="0" id="placesButton" class="barButton" data-menu="places" title="' + i18n.viewer.places.placesTitle + '"><span class="barIcon placesMenuIcon"></span>' + i18n.viewer.places.places + '</span>';
                    }
                    // create list
                    node = dom.byId('placesMenu');
                    if (node) {
                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.places.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="placesList"></ul>';
                    }
                    // if share object
                    for (var i = 0; i < _self.itemInfo.itemData.bookmarks.length; i++) {
                        _self.createPlacesListItem(i);
                    }
                    // set on clicks
                    _self.placesOnClick();
                    _self.zebraStripe(query('#placesList li.layer'));
                } else {
                    _self.options.showPlaces = false;
                }
            }
        },
        // clear the locate graphic
        resetLocateLayer: function() {
            var _self = this;
            if (_self.options.locateLayer) {
                _self.options.locateLayer.clear();
            }
            _self.options.locateName = "";
            _self.setSharing();
        },
        setMarker: function(point, address) {
            var _self = this;
            if (_self.options.pointGraphic) {
                // Create point marker
                var pointGraphic = new PictureMarkerSymbol(_self.options.pointGraphic, 21, 29).setOffset(0, 12);
                var locationGraphic = new Graphic(point, pointGraphic);
                // if locate point layer
                if (_self.options.locateLayer) {
                    _self.options.locateLayer.clear();
                    _self.clearPopupValues();
                    _self.options.customPopup.hide();
                } else {
                    _self.options.locateLayer = new GraphicsLayer();
                    connect.connect(_self.options.locateLayer, "onClick", function(e) {
                        _self.clearPopupValues();
                        event.stop(e);
                        var content = "<strong>" + e.graphic.attributes.address + "</strong>";
                        _self.options.customPopup.setContent(content);
                        _self.options.customPopup.setTitle(i18n.viewer.search.location);
                        _self.options.customPopup.show(e.graphic.geometry);
                    });
                    _self.map.addLayer(_self.options.locateLayer);
                }
                // graphic
                locationGraphic.setAttributes({
                    "address": address
                });
                _self.options.locateLayer.add(locationGraphic);
                var content = "<strong>" + address + "</strong>";
                _self.options.customPopup.setContent(content);
                _self.options.customPopup.setTitle(i18n.viewer.search.location);
                _self.options.customPopup.show(point);
            }
        },
        // resize map
        resizeMap: function() {
            var _self = this;
            _self.adjustPopupSize(_self.map);
            if (_self.mapTimer) {
                //clear any existing resize timer
                clearTimeout(_self.mapTimer);
            }
            //create new resize timer with delay of 500 milliseconds
            _self.mapTimer = setTimeout(function() {
                if (_self.map) {
                    var barHeight = 0,
                        chartHeight = 0;
                    // menu bar height
                    var menuBar = dom.byId('topMenuBar');
                    if (menuBar) {
                        var menuPos = domGeom.position(menuBar);
                        barHeight = menuPos.h;
                    }
                    // chart height
                    var chartNode = dom.byId('graphBar');
                    if (chartNode) {
                        var chartPos = domGeom.position(chartNode);
                        chartHeight = chartPos.h;
                    }
                    // window height
                    var vs = win.getBox();
                    var windowHeight = vs.h;
                    var node = dom.byId('map');
                    if (node) {
                        domStyle.set(node, {
                            "height": windowHeight - barHeight - chartHeight + 'px'
                        });
                    }
                    // resize
                    _self.map.resize();
                    _self.map.reposition();
                    // update location of menus
                    _self.updateLeftMenuOffset('#shareMap', '#shareControls');
                    _self.updateLeftMenuOffset('#placesButton', '#placesMenu');
                    _self.updateRightMenuOffset('#layersButton', '#layersMenu');
                    _self.updateRightMenuOffset('#basemapButton', '#basemapMenu');
                    _self.updateRightMenuOffset('#legendButton', '#legendMenu');
                }
            }, 500);
        },
        // update position of menu for right side buttons
        updateRightMenuOffset: function(button, menu) {
            var _self = this;
            var buttonObj = query(button)[0];
            var menuObj = query(menu)[0];
            var position;
            if (buttonObj && menuObj) {
                var offset = domGeom.position(buttonObj);
                var vs = win.getBox();
                if (offset) {
                    if (_self.options.isRightToLeft) {
                        position = offset.x;
                        domStyle.set(menuObj, {
                            "left": position + 'px'
                        });
                    } else {
                        position = vs.w - (offset.x + offset.w);
                        domStyle.set(menuObj, {
                            "right": position + 'px'
                        });
                    }
                }
            }
        },
        // update position of menu for left side buttons
        updateLeftMenuOffset: function(button, menu) {
            var _self = this;
            var btn = query(button)[0];
            var mnu = query(menu)[0];
            var vs = win.getBox();
            var leftOffset;
            if (btn && mnu) {
                var offset = domGeom.position(btn);
                if (_self.options.isRightToLeft) {
                    leftOffset = vs.w - (offset.x + offset.w);
                    domStyle.set(mnu, {
                        "right": leftOffset + 'px'
                    });
                } else {
                    leftOffset = offset.x;
                    domStyle.set(mnu, {
                        "left": leftOffset + 'px'
                    });
                }
            }
        },
        hideAboutMap: function() {
            var _self = this;
            if (_self.options.aboutDialog) {
                _self.options.aboutDialog.hide();
                query('#aboutMap').removeClass('barSelected');
            }
        },
        // Toggle show/hide about map info
        toggleAboutMap: function(obj) {
            var _self = this;
            if (_self.options.aboutDialog) {
                if (!_self.options.aboutDialog.get('open')) {
                    _self.options.aboutDialog.show();
                    query(obj).addClass('barSelected');
                } else {
                    _self.options.aboutDialog.hide();
                    query(obj).removeClass('barSelected');
                }
            }
        },
        // twitter link
        setTWLink: function(shLink) {
            var _self = this;
            if (shLink) {
                var fullLink;
                var w = 650;
                var h = 400;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);
                fullLink = 'https://twitter.com/intent/tweet?' + 'url=' + encodeURIComponent(shLink) + '&text=' + encodeURIComponent(_self.itemInfo.item.snippet) + '&hashtags=' + 'EsriSMT';
                window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
            }
        },
        // facebook link
        setFBLink: function(fbLink) {
            var _self = this;
            if (fbLink) {
                var fullLink;
                var w = 650;
                var h = 360;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);
                fullLink = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(fbLink) + '&t=' + encodeURIComponent(_self.itemInfo.item.snippet);
                window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
            }
        },
        // right side menu buttons
        rightSideMenuButtons: function() {
            var _self = this;
            var html = '';
            var node;
            if (_self.options.showLegendMenu && _self.options.layerInfos && _self.options.layerInfos.length > 0) {
                html += '<span tabindex="0" id="legendButton" data-menu="legend" class="barButton" title="' + i18n.viewer.buttons.legendTitle + '"><span class="barIcon legendIcon"></span>' + i18n.viewer.buttons.legend + '</span>';
            }
            if (_self.options.showBasemapMenu) {
                html += '<span tabindex="0" id="basemapButton" data-menu="basemap" class="barButton" title="' + i18n.viewer.buttons.basemapTitle + '"><span class="barIcon basemapIcon"></span>' + i18n.viewer.buttons.basemap + '</span>';
                node = dom.byId('basemapMenu');
                if (node) {
                    node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.basemap.menuTitle + '<div class="clear"></div></div><div class="bmMenuCon"><div class="slideScroll"><div id="baseContainer"></div></div></div>';
                }
            }
            if (_self.options.showLayersMenu && _self.itemInfo.itemData.operationalLayers.length) {
                html += '<span tabindex="0" id="layersButton" data-menu="layers" class="barButton" title="' + i18n.viewer.buttons.layersTitle + '"><span class="barIcon layersIcon"></span>' + i18n.viewer.buttons.layers + '</span>';
            }
            node = dom.byId('menuList');
            if (node) {
                node.innerHTML = html;
            }
            var legendButton = dom.byId("legendButton");
            if (legendButton) {
                on(legendButton, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.toggleMenus('legend');
                    }
                });
            }
            // Basemap MENU TOGGLE
            var basemapButton = dom.byId("basemapButton");
            if (basemapButton) {
                on(basemapButton, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.toggleMenus('basemap');
                    }
                });
            }
            // Layers MENU TOGGLE
            var layersButton = dom.byId("layersButton");
            if (layersButton) {
                on(layersButton, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.toggleMenus('layers');
                    }
                });
            }
            // Show Default Menu
            if (_self.options.defaultMenu) {
                switch (_self.options.defaultMenu) {
                case 'places':
                    if (_self.options.showPlaces) {
                        _self.toggleMenus(_self.options.defaultMenu);
                    }
                    break;
                case 'basemap':
                    if (_self.options.showBasemapMenu) {
                        _self.toggleMenus(_self.options.defaultMenu);
                    }
                    break;
                case 'layers':
                    if (_self.options.showLayersMenu) {
                        _self.toggleMenus(_self.options.defaultMenu);
                    }
                    break;
                case 'legend':
                    if (_self.options.showLegendMenu) {
                        _self.toggleMenus(_self.options.defaultMenu);
                    }
                    break;
                }
            }
            // Show Menu Bar
            query('#topMenuBar').style('display', 'block');
        },
        // set up share menu
        configureShareMenu: function() {
            var _self = this;
            if (_self.options.showShareMenu) {
                var node = query('#shareMap')[0];
                if (node) {
                    node.innerHTML = '<span tabindex="0" id="shareIcon" data-menu="share" class="barButton" title="' + i18n.viewer.buttons.linkTitle + '"><span class="barIcon iconBlock"></span>' + i18n.viewer.buttons.link + '</span></div><div class="clear">';
                }
                var html = '';
                html += '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.shareMenu.menuTitle + '<div class="clear"></div></div>';
                html += '<div class="shareContainer">';
                html += '<div class="Pad">';
                html += '<h3>' + i18n.viewer.shareMenu.shareHeader + '</h3>';
                html += '<input id="inputShare" value="" type="text" class="mapInput inputSingle" size="20" readonly>';
                html += '<span tabindex="0" id="fbImage" title="' + i18n.viewer.shareMenu.facebookHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.facebook + '</span><span tabindex="0" id="twImage" title="' + i18n.viewer.shareMenu.twitterHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.twitter + '</span></div>';
                html += '<h3>' + i18n.viewer.shareMenu.instructionHeader + '</h3>';
                html += '<textarea rows="3" id="quickEmbedCode"></textarea>';
                if (_self.options.previewPage) {
                    html += '<span id="embedOptions">' + i18n.viewer.shareMenu.preview + '</span>';
                }
                node = query('#shareControls')[0];
                if (node) {
                    node.innerHTML = html;
                }
                // embed click
                if (_self.options.previewPage) {
                    var embedOptions = dom.byId("embedOptions");
                    if (embedOptions) {
                        // on click
                        on(embedOptions, "click, keyup", function(e) {
                            if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                                var w = _self.options.previewSize.width;
                                var h = _self.options.previewSize.height;
                                var left = (screen.width / 2) - (w / 2);
                                var top = (screen.height / 2) - (h / 2);
                                window.open(_self.options.previewPage + _self.options.shareParams, 'embed', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
                            }
                        });
                    }
                }
                // toggle share menu
                var shareIcon = dom.byId("shareIcon");
                if (shareIcon) {
                    on(shareIcon, "click, keyup", function(e) {
                        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                            _self.toggleMenus('share');
                        }
                    });
                }
                var fbImage = dom.byId("fbImage");
                if (fbImage) {
                    // share buttons
                    on(fbImage, "click, keyup", function(e) {
                        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                            _self.setFBLink(_self.options.shareURL);
                            return false;
                        }
                    });
                }
                var twImage = dom.byId("twImage");
                if (twImage) {
                    on(twImage, "click, keyup", function(e) {
                        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                            _self.setTWLink(_self.options.shareURL);
                            return false;
                        }
                    });
                }
                var inputShare = dom.byId("inputShare");
                if (inputShare) {
                    on(inputShare, "click", function() {
                        this.select();
                    });
                }
                var quickEmbedCode = dom.byId("quickEmbedCode");
                if (quickEmbedCode) {
                    on(quickEmbedCode, "click", function() {
                        this.select();
                    });
                }
            }
        },
        removeSpotlight: function() {
            query('.spotlight').removeClass('spotlight-active');
        },
        // show search
        configureSearchBox: function() {
            var _self = this;
            if (_self.options.showSearchBox) {
                var html = '<div id="spotlight" class="spotlight"><\/div>';
                domConstruct.place(html, dom.byId('map_container'), 'last');
                _self._geocoder = new Geocoder({
                    map: _self.map,
                    theme: 'modernGrey',
                    autoComplete: true
                }, dom.byId("geocoderSearch"));
                // on select test
                connect.connect(_self._geocoder, 'onSelect', function(result) {
                    var spotlight = connect.connect(_self.map, 'onExtentChange', function() {
                        var geom = screenUtils.toScreenGeometry(_self.map.extent, _self.map.width, _self.map.height, result.extent);
                        var width = geom.xmax - geom.xmin;
                        var height = geom.ymin - geom.ymax;
                        var max = height;
                        if (width > height) {
                            max = width;
                        }
                        var margin = '-' + Math.floor(max / 2) + 'px 0 0 -' + Math.floor(max / 2) + 'px';
                        var pt = result.feature.geometry;
                        _self.setMarker(pt, result.name);
                        query('.spotlight').addClass('spotlight-active').style({
                            width: max + 'px',
                            height: max + 'px',
                            margin: margin
                        });
                        _self.setSharing();
                        connect.disconnect(spotlight);
                    });
                });
                connect.connect(_self._geocoder, 'onFindResults', function(response) {
                    if (!response.results.length) {
                        _self.alertDialog(i18n.viewer.errors.noLocation);
                        _self.resetLocateLayer();
                    }
                });
                _self._geocoder.startup();
                // on clear test
                connect.connect(_self._geocoder, 'onClear', function() {
                    _self.removeSpotlight();
                    _self.resetLocateLayer();
                    _self.clearPopupValues();
                    _self.map.infoWindow.hide();
                });
                if (_self.options.locateName) {
                    _self._search.set('value', _self.options.locateName);
                }
            }
        },
        // show about button if url is set
        configureAboutText: function() {
            var _self = this;
            if (_self.itemInfo.item.description && _self.options.showAboutDialog) {
                // insert html
                var node = dom.byId('aboutMapCon');
                if (node) {
                    node.innerHTML = '<span tabindex="0" class="barButton" id="aboutMap" title="' + i18n.viewer.buttons.aboutTitle + '"><span class="barIcon aboutInfo"></span>' + i18n.viewer.buttons.about + '</span>';
                }
                node = dom.byId('aboutDialog');
                var html = '';
                html += '<div class="padContainer">';
                html += '<h2 tabindex="0">' + _self.itemInfo.item.title + '</h2>';
                html += '<div class="desc">' + _self.itemInfo.item.description + '</div>';
                html += '<div class="clear"></div>';
                // see if not just empty HTML tags
                if (_self.itemInfo.item.licenseInfo) {
                    var result = _self.itemInfo.item.licenseInfo.replace(/(<([^>]+)>)/ig, "");
                    if (_self.itemInfo.item.licenseInfo && result) {
                        html += '<h3>' + i18n.viewer.about.access + '</h3>';
                        html += '<div class="license">' + _self.itemInfo.item.licenseInfo + '</div>';
                    }
                }
                html += '</div>';
                if (node) {
                    node.innerHTML = html;
                }
                var aboutMap = dom.byId("aboutMap");
                if (aboutMap) {
                    on(aboutMap, "click, keyup", function(e) {
                        if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                            this.blur();
                            _self.hideAllMenus();
                            _self.toggleAboutMap(this);
                        }
                    });
                }
                var props = {
                    //style: "width:550px;",
                    style: "width:52%; max-width:725px; min-width:400px;",
                    draggable: true,
                    modal: false,
                    showTitle: true,
                    title: i18n.viewer.about.title
                };
                _self.options.aboutDialog = new Dialog(props, dom.byId('aboutDialog'));
                node = query('#aboutDialog .dijitDialogTitle')[0];
                if (node) {
                    node.innerHTML = '<span class="inlineIcon aboutInfo"></span>' + i18n.viewer.about.title;
                }
                if (_self.options.showAboutDialogOnLoad) {
                    _self.options.aboutDialog.show();
                }
                connect.connect(_self.options.aboutDialog, 'onHide', function() {
                    var buttons = query('#mapcon .barButton');
                    if (buttons && buttons.length > 0) {
                        buttons.removeClass('barSelected');
                        for (var i = 0; i < buttons.length; i++) {
                            buttons[i].blur();
                        }
                    }
                });
            }
        },
        createCustomSlider: function() {
            var _self = this;
            var node = dom.byId('zoomSlider');
            var html = '';
            if (_self.options.showGeolocation && "geolocation" in navigator) {
                html += '<div tabindex="0" title="' + i18n.viewer.places.myLocationTitle + '" id="geoLocate"></div>';
            } else {
                _self.options.showGeolocation = false;
            }
            var homeClass = '';
            if (!_self.options.showGeolocation) {
                homeClass = 'noGeo';
            }
            html += '<div tabindex="0" title="' + i18n.viewer.general.homeExtent + '" id="homeExtent" class="' + homeClass + '"></div>';
            html += '<div id="customZoom"></div>';
            if (node) {
                node.innerHTML = html;
            }
            // Home extent
            var homeExtent = dom.byId("homeExtent");
            if (homeExtent) {
                on(homeExtent, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        _self.map.setExtent(_self.options.startExtent);
                    }
                });
            }
            // geolocate click
            var geolocateButton = dom.byId("geoLocate");
            if (geolocateButton) {
                on(geolocateButton, "click, keyup", function(e) {
                    if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 13)) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                            _self.geoLocateMap(position);
                        }, function(err) {
                            if (err.code === 1) {
                                _self.geoLocateMapError('The user denied the request for location information.');
                            } else if (err.code === 2) {
                                _self.geoLocateMapError('Your location information is unavailable.');
                            } else if (err.code === 3) {
                                _self.geoLocateMapError('The request to get your location timed out.');
                            } else {
                                _self.geoLocateMapError('An unknown error occurred while requesting your location.');
                            }
                        }, {
                            maximumAge: 3000,
                            timeout: 1000,
                            enableHighAccuracy: true
                        });
                    }
                });
            }
            connect.connect(_self.map, "onZoomEnd", function() {
                var level = _self.map.getLevel();
                if (level !== -1 && _self.options.mapZoomBar) {
                    _self.options.mapZoomBar.set("value", level);
                }
            });
            var sliderMax;
            var mapLevel;
            if (_self.map.getLevel() !== -1) {
                mapLevel = _self.map.getLevel();
            }
            if (_self.map._params && _self.map._params.lods) {
                sliderMax = _self.map._params.lods.length - 1;
            }
            if (typeof sliderMax !== 'undefined' && typeof mapLevel !== 'undefined') {
                _self.options.mapZoomBar = new VerticalSlider({
                    name: "slider",
                    showButtons: true,
                    value: mapLevel,
                    minimum: 0,
                    maximum: sliderMax,
                    discreteValues: sliderMax,
                    style: 'height:130px;',
                    intermediateChanges: true,
                    onChange: function(value) {
                        var level = parseInt(value, 10);
                        if (_self.map.getLevel() !== level) {
                            _self.map.setLevel(level);
                        }
                    }
                }, "customZoom");
            }
        },
        // application title
        configureAppTitle: function() {
            var _self = this;
            document.title = _self.itemInfo.item.title;
            var node = dom.byId('mapTitle');
            if (node) {
                node.innerHTML = _self.itemInfo.item.title;
                query(node).attr('title', _self.itemInfo.item.title);
            }
            query('meta[name="Description"]').attr('content', _self.itemInfo.item.snippet);
            query('meta[property="og:image"]').attr('content', arcgisUtils.arcgisUrl + '/' + _self.itemInfo.item.id + '/info/' + _self.itemInfo.item.thumbnail);
        },
        // Hide dropdown menu
        hideMenu: function(menuObj) {
            if (menuObj) {
                coreFx.wipeOut({
                    node: menuObj,
                    duration: 200
                }).play();
                query('#mapcon .menuSelected').removeClass('menuSelected');
                var buttons = query('#mapcon .barButton');
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].blur();
                }
            }
        },
        // Hide layer info boxes
        hideLayerInfo: function() {
            query('.listMenu ul li .infoHidden').style('display', 'none');
            query('.listMenu ul li').removeClass('active');
        },
        // toggle menu object
        toggleMenus: function(menu) {
            var _self = this;
            if (menu) {
                // get nodes
                var menuQuery = query('#dataMenuCon [data-menu="' + menu + '"]')[0];
                var buttonQuery = query('#topMenuCon [data-menu="' + menu + '"]')[0];
                // remove selected buttons
                query('#topMenuCon .barButton').removeClass('barSelected');
                if (menuQuery) {
                    if (domClass.contains(menuQuery, "menuSelected")) {
                        _self.hideMenu(menuQuery);
                    } else {
                        _self.hideAllMenus();
                        _self.showMenu(menuQuery, buttonQuery);
                    }
                }
                _self.hideLayerInfo();
            } else {
                _self.hideAllMenus();
            }
        },
        // add menus to dom
        addSlideMenus: function() {
            var html = '';
            html += '<div id="dataMenuCon">';
            html += '<div data-menu="share" id="shareControls" class="slideMenu"></div>';
            html += '<div data-menu="autocomplete" id="autoComplete" class="slideMenu"></div>';
            html += '<div data-menu="places" id="placesMenu" class="slideMenu listMenu"></div>';
            html += '<div data-menu="basemap" id="basemapMenu" class="slideMenu"></div>';
            html += '<div data-menu="layers" id="layersMenu" class="slideMenu listMenu"></div>';
            html += '<div data-menu="legend" id="legendMenu" class="slideMenu"></div>';
            html += '</div>';
            var node = query('#mapcon')[0];
            if (node) {
                domConstruct.place(html, node, "last");
            }
            query('#mapcon .slideMenu').style('display', 'none');
        },
        webmapNext: function() {
            var _self = this;
            _self.setStartExtent();
            _self.setStartLevel();
            _self.setStartMarker();
            _self.configureAppTitle();
            _self.configureShareMenu();
            _self.configureAboutText();
            _self.configurePlaces();
            // once map is loaded
            if (_self.map.loaded) {
                _self.mapIsLoaded();
            } else {
                connect.connect(_self.map, "onLoad", function() {
                    _self.mapIsLoaded();
                });
            }
        },
        // webmap object returned. Create map data
        webmapReturned: function(response) {
            var _self = this;
            // map response
            _self.mapResponse = response;
            // webmap
            _self.map = response.map;
            _self.itemInfo = response.itemInfo;
            if (_self.options.appid) {
                // get webapp object item info
                _self.getItemData(true).then(function(resp) {
                    if (resp && resp.length) {
                        for (var i in resp) {
                            if (resp.hasOwnProperty(i) && resp[i] === "" || resp[i] === null) {
                                delete resp[i];
                            }
                        }
                        // set other config options from app id
                        _self.itemInfo.item = declare.safeMixin(_self.itemInfo.item, _self._appSettings);
                    }
                    _self.webmapNext();
                });
            } else {
                _self.webmapNext();
            }
        },
        onMapLoad: function() {},
        mapIsLoaded: function() {
            var _self = this;
            // map connect functions
            connect.connect(window, "onresize", function() {
                _self.resizeMap();
            });
            _self.createCustomSlider();
            _self.setSharing();
            // set up layer menu
            _self.configureLayers();
            _self.rightSideMenuButtons();
            // create basemap gallery widget
            _self.createBMGallery(_self.map);
            // resize map
            _self.resizeMap();
            _self.configureSearchBox();
            setTimeout(function() {
                connect.connect(_self.map, "onExtentChange", function(extent) {
                    _self.removeSpotlight();
                    // hide about panel if open
                    _self.hideAboutMap();
                    // update current extent
                    _self.options.extent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
                    // update sharing link
                    _self.setSharing();
                });
            }, 4000);
            // map loaded.
            _self.onMapLoad();
            _self.initLocalImpact();
        },
        // clear popup content, title and features
        clearPopupValues: function() {
            var _self = this;
            _self.options.customPopup.setContent('');
            _self.options.customPopup.setTitle('');
            _self.options.customPopup.clearFeatures();
        },
        // Info window popup creation
        configurePopup: function() {
            var _self = this;
            // popup dijit configuration
            _self.options.customPopup = new Popup({
                offsetX: 3,
                fillSymbol: false,
                highlight: false,
                lineSymbol: false,
                marginLeft: 10,
                marginTop: 10,
                markerSymbol: false,
                offsetY: 3,
                zoomFactor: 4
            }, domConstruct.create("div"));
            // connects for popup
            connect.connect(_self.options.customPopup, "maximize", function() {
                _self.hideAllMenus();
            });
            connect.connect(_self.options.customPopup, "onHide", function() {
                _self.clearPopupValues();
            });
            // popup theme
            domClass.add(_self.options.customPopup.domNode, "modernGrey");
        },
        // Create the map object for the template
        createWebMap: function() {
            var _self = this;
            // configure popup
            _self.configurePopup();
            // create map deferred with options
            var mapDeferred = arcgisUtils.createMap(_self.options.webmap, 'map', {
                mapOptions: {
                    slider: false,
                    wrapAround180: true,
                    infoWindow: _self.options.customPopup,
                    isScrollWheelZoom: true
                },
                bingMapsKey: templateConfig.bingMapsKey,
                geometryServiceURL: templateConfig.helperServices.geometry.url
            });
            // on successful response
            mapDeferred.addCallback(function(response) {
                _self.webmapReturned(response);
            });
            // on error response
            mapDeferred.addErrback(function(error) {
                _self.alertDialog(i18n.viewer.errors.createMap + ": " + error.message);
            });
        },
        init: function() {
            var _self = this;
            _self.setOptions();
            // add menus
            _self.addSlideMenus();
            // Create Map
            _self.createWebMap();
        }
    });
    return Widget;
});