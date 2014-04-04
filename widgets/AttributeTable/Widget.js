///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dijit/layout/TabContainer',
    "dijit/layout/ContentPane",
    'jimu/utils',
    'jimu/dijit/Popup',
    'jimu/dijit/Message',
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dojo/store/Memory",
    "dgrid/extensions/Pagination",
    "dgrid/extensions/ColumnReorder",
    "dgrid/extensions/ColumnHider",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-class",
    "esri/config",
    "esri/tasks/RelationParameters",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/GraphicsLayer",
    "esri/renderers/SimpleRenderer",
    "esri/layers/FeatureLayer",
    "esri/symbols/jsonUtils",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    'dojo/_base/lang',
    "dojo/on",
    "dojo/_base/array",
    "dojo/has",
    "dojo/query",
    "dojo/_base/window",
    "dijit/Toolbar",
    "dijit/form/Button",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "jimu/dijit/CheckBox",
    "dijit/CheckedMenuItem",
    "dijit/form/DropDownButton",
    "jimu/dijit/SymbolChooser"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    TabContainer,
    ContentPane,
    utils,
    Popup,
    Message,
    OnDemandGrid,
    Selection,
    Memory,
    Pagination,
    ColumnReorder,
    ColumnHider,
    domConstruct,
    domStyle,
    domAttr,
    domClass,
    esriConfig,
    RelationParameters,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    SimpleRenderer,
    FeatureLayer,
    jsonUtils,
    QueryTask,
    Query,
    Graphic,
    Point,
    Multipoint,
    Polyline,
    Polygon,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    lang,
    on,
    array,
    has,
    domQuery,
    win,
    Toolbar,
    Button,
    DropDownMenu,
    MenuItem,
    CheckBox,
    CheckedMenuItem,
    DropDownButton,
    SymbolChooser) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      /* global apiUrl */
      name: 'AttributeTable',
      baseClass: 'jimu-widget-attributetable',

      startup: function() {
        this.inherited(arguments);
        utils.loadStyleLink("dgrid", apiUrl + "js/dgrid/css/dgrid.css");
        this.AttributeTableDiv = null;
        this.layers = [];
        this.grids = [];
        this.selectedRowsLabelDiv = [];
        this.tabContainer = null;
        this.tabPages = [];
        this.tableDiv = null;
        this.zoomButton = null;
        this.exportButton = null;
        this.selectionMenu = null;
        this.refreshButton = null;
        this.moveMaskDiv = null;
        this.moveMode = false;
        this.moveY = 0;
        this.previousDomHeight = 0;
        this.previousGridHeight = 0;
        this.noGridHeight = 0;
        this.matchingCheckBox = null;
        this.layersIndex = -1;
        this.matchingMap = false;
        this.isTransparent = true;
        this.showing = true;
        this.graphicsLayers = [];
        this.initLayers();
        this.initDiv();
        this.resize();

        this.own(on(this.map, "extent-change", lang.hitch(this, this.onExtentChange)));
        this.own(on(this.map, "layer-remove", lang.hitch(this, this.onRemoveLayer)));
        this.own(on(this.map, "pan-start", lang.hitch(this, this.onPan, true)));
        this.own(on(this.map, "pan-end", lang.hitch(this, this.onPan, false)));
        this.own(on(this.map, "resize", lang.hitch(this, this.onMapResize)));
        this.own(on(window.document, "mouseup", lang.hitch(this, this.onMouseEvent)));
        this.own(on(window.document, "mousemove", lang.hitch(this, this.onMouseEvent)));
      },

      destroy: function() {
        var len, i;
        len = this.tabPages.length;
        for (i = 0; i < len; i++) {
          this.tabPages[i].destroy();
        }
        this.tabPages.length = 0;
        this.tabContainer.destroy();

        this.layers.length = 0;
        this.grids.length = 0;
        this.selectedRowsLabelDiv.length = 0;
        this.layersIndex = -1;
        this.tableDiv = null;
        this.zoomButton = null;
        this.exportButton = null;
        if (this.moveMaskDiv) {
          domConstruct.destroy(this.moveMaskDiv);
          this.moveMaskDiv = null;
        }
        if (this.selectionMenu) {
          this.selectionMenu.destroy();
        }
        this.selectionMenu = null;
        this.refreshButton = null;
        domConstruct.empty(this.AttributeTableDiv);
        this.AttributeTableDiv = null;

        len = this.graphicsLayers.length;
        for (i = 0; i < len; i++) {
          this.map.removeLayer(this.graphicsLayers[i]);
        }
        this.inherited(arguments);
      },

      onOpen: function() {
        if (!this.config.layers.length) {
          this.onClose();
        } else {
          domStyle.set(this.domNode, "display", "");
          domStyle.set(this.domNode, "opacity", "1.0");
          this.showing = true;
          this.onMapResize();
        }
      },

      onClose: function() {
        domStyle.set(this.domNode, "display", "none");
        this.showing = false;
      },

      onMapResize: function() {
        if (this.layersIndex > -1) {
          var width = domStyle.get(this.domNode, "width");
          var tab = domQuery(".dijitTabPaneWrapper");
          if (tab && tab[0]) {
            tab[0].style.width = (width - 5) + "px";
          }
          var dom = domQuery(".dgrid-content");
          var len = this.tabPages.length;
          for (var i = 0; i < len; i++) {
            domStyle.set(this.tabPages[i].domNode, "width", (width - 18) + "px");
            if (this.grids[i]) {
              domStyle.set(this.grids[i].domNode, "width", (width - 18) + "px");
            }
            if (dom && dom[i]) {
              dom[i].style.width = (width - 33) + "px";
            }
          }
          if(this.grids[this.layersIndex]){
            this.grids[this.layersIndex].resize();
          }
        }
      },

      onPositionChange: function() {
        this.initialPosition();
        var height = domStyle.get(this.domNode, "height");
        if (this.layersIndex > -1) {
          var len = this.grids.length;
          for (var i = 0; i < len; i++) {
            domStyle.set(this.grids[i].domNode, "height", (height - this.noGridHeight) + "px");
          }
        }
        this.refreshGridHeight();
      },

      onRemoveLayer: function(params) {
        var len = this.layers.length;
        for (var i = 0; i < len; i++) {
          if (this.getLayerLabel(this.layers[i]) === this.getLayerLabel(params.layer)) {
            this.tabPageClose(this.tabPages[i].id, true);
            break;
          }
        }
      },

      initLayers: function() {
        var len = this.config.layers.length;
        for (var i = 0; i < len; i++) {
          var layer = this.getLayerFromMap(i);
          if (!layer) {
            var options = {};
            if (this.config.layers[i].layer.options) {
              options = this.config.layers[i].layer.options;
            }
            layer = new FeatureLayer(this.config.layers[i].layer.url, options);
            this.map.addLayer(layer);
          }
          if (!layer.visible) {
            layer.show();
          }
          this.layers[i] = layer;
          this.graphicsLayers[i] = new GraphicsLayer();
          this.map.addLayer(this.graphicsLayers[i]);
          this.own(on(layer, "click", lang.hitch(this, this.onGraphicClick, i)));
        }
      },

      onGraphicClick: function(index, event) {
        if (!this.showing || index !== this.layersIndex) {
          return;
        }
        var id = event.graphic.attributes[this.layers[this.layersIndex].objectIdField] + "";
        this.highlightRow(id);
        this.selectFeatures("mapclick", [event.graphic]);
      },

      highlightRow: function(id) {
        if (!this.showing) {
          return;
        }
        var store = this.grids[this.layersIndex].store;
        var row = -1;
        for (var i in store.index) {
          if (i === id) {
            row = store.index[i];
            break;
          }
        }
        if (row > -1) {
          var rowsPerPage = this.grids[this.layersIndex].get("rowsPerPage");
          var pages = parseInt(row / rowsPerPage, 10);
          pages++;

          this.grids[this.layersIndex].gotoPage(pages);
          this.grids[this.layersIndex].clearSelection();
          this.grids[this.layersIndex].select(id);
          // if (this.grids[this.layersIndex].row(id)) {
          //   this.grids[this.layersIndex].row(id).element.scrollIntoView();
          // }
        }
      },

      getLayerFromMap: function(index) {
        var url = this.config.layers[index].layer.url;
        var ids = this.map.graphicsLayerIds;
        var i = 0,
          len = ids.length;
        for (i = 0; i < len; i++) {
          var layer1 = this.map.getLayer(ids[i]);
          if (layer1.url === url) {
            return layer1;
          }
        }
        ids = this.map.layerIds;
        len = ids.length;
        var dynamicUrl = url.substr(0, url.lastIndexOf("/"));
        for (i = 0; i < len; i++) {
          var layer2 = this.map.getLayer(ids[i]);
          if (layer2.url === dynamicUrl) {
            var fl = new FeatureLayer(url);
            this.config.layers[index].isDynamicLayer = true;
            return fl;
          }
        }
        return null;
      },

      tabChanged: function() {
        if (this.tabContainer && this.tabContainer.selectedChildWidget) {
          var title = this.tabContainer.selectedChildWidget.params.id;
          var i = 0;
          var len = this.config.layers.length;
          for (i = 0; i < len; i++) {
            if (this.getLayerLabel(this.layers[i]) === title) {
              this.layersIndex = i;
              break;
            }
          }
          if (this.layersIndex > -1) {
            if (!this.config.layers[this.layersIndex].opened) {
              if (this.matchingMap) {
                this.startQuery(this.layersIndex, this.map.extent);
              } else {
                this.config.layers[this.layersIndex].opened = true;
                this.startQuery(this.layersIndex);
              }
            } else if (this.matchingMap) {
              this.startQuery(this.layersIndex, this.map.extent);
            }
          }
          this.onMapResize();
        }
        this.resetButtonStatus();
      },

      resetButtonStatus: function() {
        var selectionRows = this.getSelectedRows();
        if (selectionRows && selectionRows.length) {
          //if (isHas) {
          this.zoomButton.set('disabled', false);
          if (this.exportButton) {
            this.exportButton.set('disabled', false);
          }
        } else {
          this.zoomButton.set('disabled', true);
          if (this.exportButton) {
            this.exportButton.set('disabled', true);
          }
        }
        if (this.config.layers && this.config.layers.length === 0) {
          this.selectionMenu.set('disabled', true);
          this.refreshButton.set('disabled', true);
          this.matchingCheckBox.set('disabled', true);
        } else {
          this.selectionMenu.set('disabled', false);
          this.refreshButton.set('disabled', false);
          this.matchingCheckBox.set('disabled', false);
        }

        this.setSelectedNumber();
      },

      onSymbolChange: function(symbol) {
        if (this.layersIndex > -1) {
          this.config.layers[this.layersIndex].selectionSymbol = symbol.toJson();
          var len = this.graphicsLayers[this.layersIndex].graphics.length;
          for (var i = 0; i < len; i++) {
            this.graphicsLayers[this.layersIndex].graphics[i].setSymbol(symbol);
          }
        }
      },

      createTable: function(columns, data) {
        var memStore = new Memory({
          data: data,
          idProperty: this.layers[this.layersIndex].objectIdField
        });

        if (this.grids[this.layersIndex]) {
          this.grids[this.layersIndex].set("store", memStore);
          this.grids[this.layersIndex].refresh();
        } else {
          this.config.layers[this.layersIndex].loaded = true;
          var json = {};
          if (this.config.table && this.config.table.pageSizeOptions) {
            json.pageSizeOptions = this.config.table.pageSizeOptions;
            json.rowsPerPage = json.pageSizeOptions[0];
          }
          json.bufferRows = Infinity;
          json.columns = columns;
          json.store = memStore;
          json.pagingTextBox = true;
          json.firstLastArrows = true;
          var grid = new(declare([OnDemandGrid, Selection, Pagination, ColumnHider]))(json, domConstruct.create("div"));
          domConstruct.place(grid.domNode, this.tabPages[this.layersIndex].content);
          grid.startup();
          this.grids[this.layersIndex] = grid;
          this.own(on(grid, "click", lang.hitch(this, this.onRowClick)));
          this.own(on(grid, "dblclick", lang.hitch(this, this.onZoomButton)));
          // this.own(on(grid, "click", lang.hitch(this, this.setSelectedNumber)));

          var selectedRowsDomNode = domQuery(".dgrid-pagination");
          if (selectedRowsDomNode && selectedRowsDomNode.length) {
            this.selectedRowsLabelDiv[this.layersIndex] = domConstruct.create("div");
            domClass.add(this.selectedRowsLabelDiv[this.layersIndex], "dgrid-status");
            domConstruct.place(this.selectedRowsLabelDiv[this.layersIndex], selectedRowsDomNode[this.layersIndex]);
            this.setSelectedNumber();
          }
          var height = domStyle.get(this.domNode, "height");
          domStyle.set(this.grids[this.layersIndex].domNode, "height", (height - this.noGridHeight) + "px");
          this.refreshGridHeight();
          if (this.grids.length === 1) {
            this.onMapResize();
          }
        }
        this.showRefreshText(false);
      },

      showRefreshText: function(refresh) {
        if (this.layersIndex > -1) {
          var id = this.tabPages[this.layersIndex].get("id");
          if (refresh) {
            this.tabPages[this.layersIndex].set("title", id + "(" + this.nls.refresh + ")");
          } else {
            this.tabPages[this.layersIndex].set("title", id);
          }
        }
      },

      startQuery: function(index, extent) {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        this.showRefreshText(true);
        var selectionRows = this.getSelectedRows();
        if (this.layers[index].url) {
          var qt = new QueryTask(this.config.layers[index].layer.url);
          var query = new Query();
          query.where = "1=1";
          if (this.config.layers[index].layer.options && this.config.layers[index].layer.options.outFields) {
            query.outFields = this.config.layers[index].layer.options.outFields;
          } else {
            query.outFields = ["*"];
          }
          if (extent) {
            query.geometry = extent;
            this.config.layers[index].opened = false;
          }
          this.config.layers[index].extent = extent;


          query.returnGeometry = false;
          qt.execute(query, lang.hitch(this, this.queryExecute, selectionRows));
        } else {
          var json = {};
          json.features = this.layers[index].graphics;
          json.fields = this.layers[index].fields;
          json.selectionRows = selectionRows;
          if (extent && esriConfig.defaults.geometryService) {
            var geometries = [];
            var len = json.features.length;
            for (var i = 0; i < len; i++) {
              geometries.push(json.features[i].geometry);
            }
            var params = new RelationParameters();
            params.geometries1 = geometries;
            params.geometries2 = [extent];
            params.relation = RelationParameters.SPATIAL_REL_INTERSECTION;

            esriConfig.defaults.geometryService.relation(params, lang.hitch(this, function(json, indexes) {
              var n = indexes.length;
              var gs = [];
              for (var m = 0; m < n; m++) {
                gs.push(json.features[m]);
              }
              json.features = gs;
              this.queryExecute(selectionRows, json);
            }, json));
          } else {
            this.queryExecute(selectionRows, json);
          }
        }
      },

      onExtentChange: function(params) {
        if (this.matchingMap) {
          this.startQuery(this.layersIndex, params.extent);
        }
      },

      onPan: function(status) {
        if (this.isTransparent && status && this.showing) {
          domStyle.set(this.domNode, "opacity", "0.3");
        } else if (this.isTransparent && this.showing) {
          domStyle.set(this.domNode, "opacity", "1.0");
        }
      },

      queryExecute: function(selectionRows, results) {
        var data = [],
          columns = {},
          value, type;
        if (!this.domNode) {
          return;
        }
        array.map(results.features, lang.hitch(this, function(fields, feature) {
          for (var attr in feature.attributes) {
            value = feature.attributes[attr];
            if (attr === this.layers[this.layersIndex].typeIdField && this.layers[this.layersIndex].types) {
              value = this.getTypeName(value, this.layers[this.layersIndex].types);
              feature.attributes[attr] = value;
            }
            type = this.getFieldType(attr, fields);
            if (value && type === "esriFieldTypeDate") {
              var sDateate = new Date(value);
              value = sDateate.toLocaleString();
              feature.attributes[attr] = value;
            }
          }
          data.push(feature.attributes);
        }, results.fields));

        if (!this.config.layers[this.layersIndex].loaded && results.fields) {
          var len = results.fields.length;
          for (var i = 0; i < len; i++) {
            columns[results.fields[i].name] = {
              label: results.fields[i].alias
            };
            if (results.fields[i].name === this.config.layers[this.layersIndex].linkfield) {
              var url = this.config.layers[this.layersIndex].layer.url;
              columns[results.fields[i].name].renderCell = lang.hitch(this, this.renderCell, url);
            }
          }
        }
        this.createTable(columns, data);
        if (selectionRows && selectionRows.length) {
          for (var id in selectionRows) {
            this.grids[this.layersIndex].select(selectionRows[id]);
          }
          this.resetButtonStatus();
        }
      },

      renderCell: function(url, object, value, node) {
        var href = "";
        if (url.endWith("/")) {
          href = url + value;
        } else {
          href = url + "/" + value;
        }
        node.innerHTML = "<a target='_blank' href='" + href + "'>" + value + "</a>";
      },

      getTypeName: function(value, types) {
        var len = types.length;
        for (var i = 0; i < len; i++) {
          if (value === types[i].id) {
            return types[i].name;
          }
        }
        return "";
      },

      getFieldType: function(name, fields) {
        var len = fields.length;
        for (var i = 0; i < len; i++) {
          if (name === fields[i].name) {
            return fields[i].type;
          }
        }
        return "";
      },

      onRowClick: function(zoomIds) {
        var ids = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            ids.push(id);
          }
        }
        if (ids.length) {
          this.zoomButton.set('disabled', false);
          this.exportButton.set('disabled', false);
          if (this.layers[this.layersIndex].url) {
            var query = new Query();
            query.objectIds = ids;
            this.layers[this.layersIndex].selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, this.selectFeatures, "rowclick"));
          } else {
            if (zoomIds && !zoomIds.type && zoomIds.length) {
              this.selectFeatures("zoom", this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids));
            } else {
              this.selectFeatures("rowclick", this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids));
            }
          }
        } else {
          this.zoomButton.set('disabled', true);
          this.exportButton.set('disabled', true);
          this.graphicsLayers[this.layersIndex].clear();
        }
      },

      getGraphicsFromLocalFeatureLayer: function(index, ids) {
        var gs = [],
          id;
        var len = ids.length;
        var n = this.layers[index].graphics.length;
        var objectid = this.layers[index].objectIdField;
        for (var i = 0; i < len; i++) {
          for (var m = 0; m < n; m++) {
            id = this.layers[index].graphics[m].attributes[objectid] + "";
            if (id === ids[i]) {
              gs.push(this.layers[index].graphics[m]);
              break;
            }
          }
        }
        return gs;
      },

      getExtent: function(result) {
        var extent, points;
        var len = result.length;
        if (len === 1 && result[0].geometry.type === "point") {
          extent = result[0].geometry;
        } else {
          for (var i = 0; i < len; i++) {
            if (result[i].geometry.type === "point") {
              if (!points) {
                points = new Multipoint(result[i].geometry.spatialReference);
                points.addPoint(result[i].geometry);
              } else {
                points.addPoint(result[i].geometry);
              }
              if (i === (len - 1)) {
                extent = points.getExtent();
              }
            } else {
              if (!extent) {
                extent = result[i].geometry.getExtent();
              } else {
                extent = extent.union(result[i].geometry.getExtent());
              }
            }
          }
        }
        return extent;
      },

      addGraphics: function(result) {
        var symbol, graphic;
        var len = result.length;
        this.graphicsLayers[this.layersIndex].clear();

        if (this.config.layers[this.layersIndex].selectionSymbol) {
          symbol = jsonUtils.fromJson(this.config.layers[this.layersIndex].selectionSymbol);
        }
        for (var i = 0; i < len; i++) {
          var geometry = null;
          if (result[i].geometry.type === "point") {
            geometry = new Point(result[i].geometry.toJson());
            if (!symbol) {
              symbol = new SimpleMarkerSymbol();
            }
          } else if (result[i].geometry.type === "multipoint") {
            geometry = new Multipoint(result[i].geometry.toJson());
            if (!symbol) {
              symbol = new SimpleMarkerSymbol();
            }
          } else if (result[i].geometry.type === "polyline") {
            geometry = new Polyline(result[i].geometry.toJson());
            if (!symbol) {
              symbol = new SimpleLineSymbol();
            }
          } else if (result[i].geometry.type === "polygon") {
            geometry = new Polygon(result[i].geometry.toJson());
            if (!symbol) {
              symbol = new SimpleFillSymbol();
            }
          }
          graphic = new Graphic(geometry, symbol, result[i].attributes, result[i].infoTemplate);
          this.graphicsLayers[this.layersIndex].add(graphic);
        }
      },

      setSelectedNumber: function() {
        if (this.selectedRowsLabelDiv && this.selectedRowsLabelDiv[this.layersIndex] &&
          this.layersIndex < this.grids.length) {
          var selection = this.grids[this.layersIndex].selection;
          var ids = [];
          if (selection) {
            for (var id in selection) {
              if (selection[id]) {
                ids.push(id);
              }
            }
          }
          this.selectedRowsLabelDiv[this.layersIndex].innerHTML = ", " + ids.length + " " + this.nls.selected;
        }
      },

      selectFeatures: function(method, result) {
        if (result && result.length > 0) {
          if (method === "mapclick") {
            this.addGraphics(result);
            if (this.config.layers[this.layersIndex].isDynamicLayer) {
              var id = result[0].attributes[this.grids[this.layersIndex].store.idProperty] + "";
              this.highlightRow(id);
            }
          } else if (method === "rowclick" || method === "selectall") {
            this.addGraphics(result);
          } else if (method === "zoom") {
            var extent = this.getExtent(result);
            if (extent) {
              if (extent.type === "point") {
                this.map.centerAndZoom(extent, 15);
              } else {
                this.map.setExtent(extent.expand(1.5));
              }
            }
          }
          this.setSelectedNumber();
        } else {
          var popup = new Message({
            message: this.nls.dataNotAvailable,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
        }
      },

      onMouseEvent: function(event) {
        var type = event.type;
        if (!this.config.layers.length) {
          return;
        }
        switch (type) {
          case "mousedown":
            this.moveMode = true;
            this.moveY = event.clientY;
            this.previousDomHeight = domStyle.get(this.domNode, "height");
            this.previousArrowTop = domStyle.get(this.arrowDiv, "top");
            if (this.grids.length) {
              this.previousGridHeight = domStyle.get(this.grids[0].domNode, "height");
            }
            domStyle.set(this.arrowDiv, "background-color", "gray");
            domStyle.set(this.moveMaskDiv, "display", "");
            break;
          case "mouseup":
            this.moveMode = false;
            this.onPan(false);
            domStyle.set(this.arrowDiv, "background-color", "");
            domStyle.set(this.moveMaskDiv, "display", "none");
            break;
          case "mousemove":
            if (this.moveMode) {
              var y = this.moveY - event.clientY;
              if ((y + this.previousDomHeight) <= 5 || (event.clientY < 40)) {
                return;
              }
              domStyle.set(this.domNode, "height", (y + this.previousDomHeight) + "px");
              var len = this.grids.length;
              for (var i = 0; i < len; i++) {
                domStyle.set(this.grids[i].domNode, "height", (y + this.previousGridHeight) + "px");
              }
              this.refreshGridHeight();
            }
            break;
        }
      },

      refreshGridHeight: function() {
        var tab = domQuery(".dijitTabPaneWrapper");
        if (tab && tab.length) {
          domStyle.set(tab[0], "height", "100%");
        }
      },

      initialPosition: function() {
        var bodyHeight = 0;
        if (this.position.height) {
          bodyHeight = this.position.height;
        } else {
          bodyHeight = document.body.clientHeight;
          bodyHeight = bodyHeight / 3;
        }
        domStyle.set(this.domNode, "top", "auto");
        domStyle.set(this.domNode, "left", "0px");
        domStyle.set(this.domNode, "right", "0px");
        domStyle.set(this.domNode, "bottom", "0px");
        domStyle.set(this.domNode, "position", "absolute");
        domStyle.set(this.domNode, "height", bodyHeight + "px");
      },

      initDiv: function() {
        this.moveMaskDiv = domConstruct.create("div", {
          style: "opacity:0; width:100%; height:100%; position:absolute; z-index:999; display:none;cursor: ns-resize;"
        });
        domConstruct.place(this.moveMaskDiv, win.body(), "first");
        this.AttributeTableDiv = domConstruct.create("div");
        domClass.add(this.AttributeTableDiv, "jimu-widget-attributetable");
        this.initialPosition();

        this.arrowDiv = domConstruct.create("div");
        domClass.add(this.arrowDiv, "jimu-widget-attributetable-move");
        var breakline = domConstruct.create("div");
        domClass.add(breakline, "jimu-widget-attributetable-line");
        domConstruct.place(breakline, this.arrowDiv);
        this.own(on(this.arrowDiv, 'mousedown', lang.hitch(this, this.onMouseEvent)));

        domConstruct.place(this.arrowDiv, this.AttributeTableDiv);
        domConstruct.place(this.AttributeTableDiv, this.domNode);

        var toolbarDiv = domConstruct.create("div");
        var toolbar = new Toolbar({}, domConstruct.create("div"));

        var menus = new DropDownMenu();

        var selectPageButton = new MenuItem({
          label: this.nls.selectPage,
          iconClass: "esriAttributeTableSelectPageImage",
          onClick: lang.hitch(this, this.selectPage)
        });
        menus.addChild(selectPageButton);

        var selectAllButton = new MenuItem({
          label: this.nls.selectAll,
          iconClass: "esriAttributeTableSelectAllImage",
          onClick: lang.hitch(this, this.selectAll, true)
        });
        menus.addChild(selectAllButton);

        var transparent = new CheckedMenuItem({
          checked: true,
          label: this.nls.transparent,
          onChange: lang.hitch(this, function(status) {
            this.isTransparent = status;
          })
        });
        menus.addChild(transparent);

        this.matchingCheckBox = new CheckedMenuItem({
          checked: false,
          // style: "margin-left:10px;margin-right:10px;",
          label: this.nls.filterByExtent,
          onChange: lang.hitch(this, function(status) {
            this.matchingMap = status;
            if (status) {
              this.startQuery(this.layersIndex, this.map.extent);
            } else {
              this.startQuery(this.layersIndex);
            }
          })
        });
        //domClass.add(this.matchingCheckBox.domNode, 'dijitInline');
        menus.addChild(this.matchingCheckBox);

        var setSymbol = new MenuItem({
          label: this.nls.selectionSymbol,
          iconClass: "esriAttributeTableSymbolImage",
          onClick: lang.hitch(this, this.setSelectionSymbol)
        });
        menus.addChild(setSymbol);

        var columns = new MenuItem({
          label: this.nls.columns,
          iconClass: "esriAttributeTableColumnsImage",
          onClick: lang.hitch(this, this.toggleColumns)
        });
        menus.addChild(columns);

        if (!this.config.hideExportButton) {
          this.exportButton = new MenuItem({
            label: this.nls.exportFiles,
            showLabel: true,
            iconClass: "esriAttributeTableExportImage",
            onClick: lang.hitch(this, this.onExportButton)
          });
          menus.addChild(this.exportButton);
        }

        this.selectionMenu = new DropDownButton({
          label: this.nls.options,
          iconClass: "esriAttributeTableOptionsImage",
          dropDown: menus
        });
        toolbar.addChild(this.selectionMenu);

        this.zoomButton = new Button({
          label: this.nls.zoomto,
          iconClass: "esriAttributeTableZoomImage",
          onClick: lang.hitch(this, this.onZoomButton)
        });
        toolbar.addChild(this.zoomButton);

        var clearSelectionButton = new Button({
          label: this.nls.clearSelection,
          iconClass: "esriAttributeTableClearImage",
          onClick: lang.hitch(this, this.selectAll, false)
        });
        toolbar.addChild(clearSelectionButton);

        this.refreshButton = new Button({
          label: this.nls.refresh,
          showLabel: true,
          iconClass: "esriAttributeTableRefreshImage",
          onClick: lang.hitch(this, this.onRefreshButton)
        });
        toolbar.addChild(this.refreshButton);

        this.closeButton = new Button({
          style: "float: right;",
          iconClass: "esriAttributeTableCloseImage",
          onClick: lang.hitch(this, this.onClose)
        });
        toolbar.addChild(this.closeButton);

        domConstruct.place(toolbar.domNode, toolbarDiv);

        var tabDiv = domConstruct.create("div");
        this.tableDiv = domConstruct.create("div");
        domConstruct.place(this.tableDiv, tabDiv);
        domConstruct.place(toolbarDiv, this.AttributeTableDiv);
        domConstruct.place(tabDiv, this.AttributeTableDiv);

        var height = domStyle.get(toolbarDiv, "height");
        this.noGridHeight = 40 + height;
        // var width = domStyle.get(this.domNode, "width");

        this.tabContainer = new TabContainer({
          style: "height: 100%; width: 100%;"
        }, tabDiv);
        var len = this.config.layers.length;
        for (var j = 0; j < len; j++) {
          var json = {};
          var div = domConstruct.create("div");
          json.title = this.getLayerLabel(this.config.layers[j]);
          json.id = json.title;
          json.content = div;
          //json.closable = true;
          json.style = "height: 100%; width: 100%; overflow: visible;";
          var cp = new ContentPane(json);
          this.tabPages.push(cp);
          this.tabContainer.addChild(cp);
        }
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);
        this.tabChanged();
        this.own(on(this.tabContainer, "click", lang.hitch(this, this.tabChanged)));
      },

      getLayerLabel: function(layer) {
        var label = layer.label || layer.title || layer.name || layer.id || "Unknown";
        return label;
      },

      toggleColumns: function() {
        if (this.layersIndex > -1 && this.grids[this.layersIndex]) {
          this.grids[this.layersIndex]._toggleColumnHiderMenu();
        }
      },

      setSelectionSymbol: function() {
        var div = domConstruct.create("div", {
          style: "background-color:white"
        });
        var symbolChooser = new SymbolChooser();
        this.own(on(symbolChooser, 'change', lang.hitch(this, this.onSymbolChange)));
        domConstruct.place(symbolChooser.domNode, div);

        var symbol;
        if (this.layersIndex > -1 && this.config.layers[this.layersIndex].selectionSymbol) {
          symbol = jsonUtils.fromJson(this.config.layers[this.layersIndex].selectionSymbol);
        } else if (this.layersIndex > -1 && this.layers[this.layersIndex]) {
          var type = this.layers[this.layersIndex].geometryType;
          if (type) {
            if (type === "esriGeometryPoint") {
              symbol = new SimpleMarkerSymbol();
            } else if (type === "esriGeometryPolyline") {
              symbol = new SimpleLineSymbol();
            } else {
              symbol = new SimpleFillSymbol();
            }
          }
        }
        if (symbol) {
          symbolChooser.showBySymbol(symbol);
        }

        var popup = new Popup({
          content: div,
          titleLabel: this.nls.selectionSymbol,
          width: "600",
          height: "600",
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              if (symbolChooser) {
                symbolChooser.destroy();
                symbolChooser = null;
              }
              popup.close();
            })
          }, {
            label: this.nls.cancel,
            onClick: lang.hitch(this, function() {
              if (symbol) {
                this.onSymbolChange(symbol);
              }
              if (this.symbolChooser) {
                symbolChooser.destroy();
                symbolChooser = null;
              }
              popup.close();
            })
          }]
        });
      },

      onRefreshButton: function() {
        if (this.layersIndex > -1) {
          this.grids[this.layersIndex].clearSelection();
          this.graphicsLayers[this.layersIndex].clear();
          this.setSelectedNumber();
          this.startQuery(this.layersIndex, this.config.layers[this.layersIndex].extent);
        }
      },

      onReceiveData: function(name, source, params) {
        if (params && params.layer && params.target === "AttributeTable") {
          var layer = params.layer;
          var label = this.getLayerLabel(layer);
          if (layer) {
            var page = this.isExistTabPage(label);
            if (page) {
              this.onOpen();
              this.tabContainer.selectChild(page);
              this.tabChanged();
            } else {
              this.config.layers.push({
                name: label,
                layer: {
                  url: layer.url
                }
              });
              this.layers.push(layer);
              var g = new GraphicsLayer();
              this.graphicsLayers.push(g);
              this.map.addLayer(g);
              this.onOpen();

              var div = domConstruct.create("div");
              var json = {};
              json.title = this.getLayerLabel(layer);
              json.id = json.title;
              json.content = div;
              json.closable = true;
              // var width = domStyle.get(this.domNode, "width");
              json.style = "height: 100%; width: 100%; overflow: visible";
              var cp = new ContentPane(json);
              this.tabPages.push(cp);
              cp.set("title", json.id);
              this.own(on(cp, "close", lang.hitch(this, this.tabPageClose, json.id)));
              this.tabContainer.addChild(cp);
              this.tabContainer.selectChild(cp);
              this.tabChanged();
              this.own(on(layer, "click", lang.hitch(this, this.onGraphicClick, this.layersIndex)));
            }
          }
        }
      },

      isExistTabPage: function(id) {
        var len = this.tabPages.length;
        for (var i = 0; i < len; i++) {
          if (this.tabPages[i].id === id) {
            return this.tabPages[i];
          }
        }
        return null;
      },

      tabPageClose: function(id, isRemoveChild) {
        var len = this.tabPages.length;
        for (var i = 0; i < len; i++) {
          if (this.tabPages[i].id === id) {
            if (isRemoveChild === true) {
              this.tabContainer.removeChild(this.tabPages[i]);
            }
            this.grids[i].destroy();
            this.tabPages[i].destroyDescendants();
            this.tabPages.splice(i, 1);
            this.config.layers.splice(i, 1);
            this.layers.splice(i, 1);
            this.grids.splice(i, 1);
            this.map.removeLayer(this.graphicsLayers[i]);
            this.graphicsLayers.splice(i, 1);
            if (len === 1) {
              this.layersIndex = -1;
              this.onClose();
              return;
            } else {
              if (i < this.layersIndex) {
                this.layersIndex--;
              } else if (i === this.layersIndex) {
                if (len > 1) {
                  this.layersIndex = len - 2;
                  this.tabContainer.selectChild(this.tabPages[this.layersIndex]);
                  this.tabChanged();
                } else {
                  this.layersIndex = 0;
                }
              }
            }
            break;
          }
        }
        setTimeout(lang.hitch(this, function() {
          this.refreshGridHeight();
        }), 10);
      },

      selectAll: function(status) {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        if (status) {
          //this.grids[this.layersIndex].selectAll();
          var ids = [];
          var indexes = this.grids[this.layersIndex].store.index;
          for (var id in indexes) {
            ids.push(id);
            this.grids[this.layersIndex].select(id);
          }
          if (ids.length) {
            if (this.layers[this.layersIndex].url) {
              var query = new Query();
              query.objectIds = ids;
              this.layers[this.layersIndex].selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, this.selectFeatures, "selectall"));
            } else {
              this.selectFeatures("selectall", this.layers[this.layersIndex].graphics);
            }
          }
        } else {
          this.grids[this.layersIndex].clearSelection();
          this.graphicsLayers[this.layersIndex].clear();
        }
        this.resetButtonStatus();
      },

      selectPage: function() {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        this.grids[this.layersIndex].clearSelection();
        this.graphicsLayers[this.layersIndex].clear();
        var currentPage = this.grids[this.layersIndex]._currentPage;
        var rowsPerPage = this.grids[this.layersIndex].rowsPerPage;
        var index = this.grids[this.layersIndex].store.index;
        var ids = [];
        for (var id in index) {
          var number = index[id];
          if (number >= (currentPage - 1) * rowsPerPage && number < rowsPerPage * currentPage) {
            ids.push(id);
            this.grids[this.layersIndex].select(id);
          }
        }
        if (this.layers[this.layersIndex].url) {
          var query = new Query();
          query.objectIds = ids;
          this.layers[this.layersIndex].selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, this.selectFeatures, "selectall"));
        } else {
          this.selectFeatures("selectall", this.getGraphicsFromLocalFeatureLayer(this.layersIndex, ids));
        }
        this.resetButtonStatus();
      },

      exportToCSV: function() {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        var content = "";
        var len = 0,
          n = 0,
          comma = "",
          value = "",
          arrayCol = [];
        var columns = this.grids[this.layersIndex].columns;
        //var data = this.grids[this.layersIndex].store.data;
        var data = this.getSelectedRowsData();
        for (var column in columns) {
          content = content + comma + column;
          comma = ",";
          arrayCol.push(column);
        }
        content = content + "\r\n";
        len = data.length;
        n = arrayCol.length;
        for (var i = 0; i < len; i++) {
          comma = "";
          for (var m = 0; m < n; m++) {
            value = data[i][arrayCol[m]];
            if (!value) {
              value = "";
            }
            content = content + comma + value;
            comma = ",";
          }
          content = content + "\r\n";
        }
        this.download(this.config.layers[this.layersIndex].name + ".csv", content);
      },

      getSelectedRowsData: function() {
        if (!this.grids.length) {
          return null;
        }
        if (!this.grids[this.layersIndex]) {
          return null;
        }
        var data = this.grids[this.layersIndex].store.data;
        var idProperty = this.grids[this.layersIndex].store.idProperty;
        var len = data.length;
        var rows = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var attr in selection) {
          for (var i = 0; i < len; i++) {
            if (attr === String(data[i][idProperty])) {
              rows.push(data[i]);
            }
          }
        }
        return rows;
      },

      getSelectedRows: function() {
        var rows = [];
        if (!this.grids.length) {
          return rows;
        }
        if (!this.grids[this.layersIndex]) {
          return rows;
        }
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            rows.push(id);
          }
        }
        return rows;
      },

      download: function(filename, text) {
        if (has("ie")) {
          var oWin = window.open("about:blank", "_blank");
          oWin.document.write(text);
          oWin.document.close();
          oWin.document.execCommand('SaveAs', true, filename);
          oWin.close();
        } else {
          var link = domConstruct.create("a", {
            href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
            download: filename
          });
          link.click();
          domConstruct.destroy(link);
        }
      },

      onExportButton: function() {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        var popup = new Popup({
          content: this.nls.exportMessage,
          titleLabel: this.nls.exportFiles,
          width: "400",
          height: "200",
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function() {
              this.exportToCSV();
              popup.close();
            })
          }, {
            label: this.nls.cancel,
            onClick: lang.hitch(this, function() {
              popup.close();
            })
          }]
        });
      },

      onZoomButton: function() {
        if (!this.config.layers || this.config.layers.length === 0) {
          return;
        }
        var ids = [];
        var selection = this.grids[this.layersIndex].selection;
        for (var id in selection) {
          if (selection[id]) {
            ids.push(id);
          }
        }
        if (ids.length === 0) {
          // var extent = this.layers[this.layersIndex].fullExtent;
          // if (extent) {
          //   this.map.setExtent(extent);
          // }
          return;
        } else {
          if (this.layers[this.layersIndex].url) {
            var query = new Query();
            query.objectIds = ids;
            this.layers[this.layersIndex].selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this,
              this.selectFeatures, "zoom"));
          } else {
            this.onRowClick(ids);
          }
        }
      }

    });

    clazz.inPanel = false;
    clazz.hasUIFile = false;
    return clazz;
  });