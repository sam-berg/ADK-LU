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
    'jimu/dijit/TabContainer',
    'jimu/dijit/List',
    'jimu/dijit/Message',
    'jimu/utils',
    'jimu/dijit/LoadingShelter',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Polygon',
    'esri/symbols/SimpleFillSymbol',
    'esri/InfoTemplate',
    'esri/symbols/jsonUtils',
    'esri/request',
    'dijit/ProgressBar',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array'
  ],
  function(declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, Message, utils, LoadingShelter,Query, QueryTask,
    GraphicsLayer, FeatureLayer, Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol,
    Polygon, SimpleFillSymbol, InfoTemplate, jsonUtils, esriRequest, ProgressBar, lang, html, array) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Query',
      baseClass: 'jimu-widget-query',
      resultLayer: null,
      progressBar: null,
      tabContainer: null,
      list: null,
      onClickEvent: null,
      isValidConfig:false,

      postCreate:function(){
        this.inherited(arguments);
        this.isValidConfig = this._isConfigValid();
        this._initTabContainer();
        this._initLayer();
        this.labelQueryName.textContent = (this.config.layer && this.config.layer.textsearchlabel)||'';
        this.inputQueryName.set("placeHolder", (this.config.layer && this.config.layer.textsearchhint)||'');
      },

      _isConfigValid:function(){
        return this.config.layer && this.config.layer.url && this.config.layer.fields && (this.config.layer.fields.field.length > 0);
      },

      _initLayer:function(){
        if(!this.isValidConfig){
          return;
        }
        if(this.config.shareResult){
          this.shelter.show();
          esriRequest({
            url: (this.config.layer && this.config.layer.url)||'',
            content:{f:'json'},
            handleAs:'json',
            callbackParamName:'callback',
            timeout:30000
          },{
            useProxy:false
          }).then(lang.hitch(this,function(response){
            response.name = this.nls.queryResult + " : " + response.name;
            var names = array.map(this.config.layer.fields.field,lang.hitch(this,function(item){
              return item.name;
            }));

            var objectIdFieldInfo = (array.filter(response.fields,lang.hitch(this,function(fieldInfo){
              return fieldInfo.type === 'esriFieldTypeOID';
            })))[0];
            if(objectIdFieldInfo){
              this.config.layer.objectIdField = objectIdFieldInfo.name;
            }
            this.config.layer.existObjectId = array.indexOf(names,this.config.layer.objectIdField) >= 0;
            response.fields = array.filter(response.fields,lang.hitch(this,function(fieldInfo){
              return fieldInfo.type === 'esriFieldTypeOID' || array.indexOf(names,fieldInfo.name) >= 0;
            }));
            this.config.layer.fields.field = response.fields;
            this.shelter.hide();
            this.resultLayer = new FeatureLayer({
              layerDefinition:response,
              featureSet:null
            });
            this.map.addLayer(this.resultLayer);
            this._startup();
          }),lang.hitch(this,function(err){
            this.shelter.hide();
            console.error(err);
            this.resultLayer = new GraphicsLayer();
            this.map.addLayer(this.resultLayer);
          }));
        }
        else{
          this.resultLayer = new GraphicsLayer();
          this.map.addLayer(this.resultLayer);
        }
      },

      _initTabContainer:function(){
        this.tabContainer = new TabContainer({
          tabs: [{
            title: this.nls.selectByAttribute,
            content: this.queryNode1
          }, {
            title: this.nls.results,
            content: this.queryNode2
          }],
          selected: this.nls.results
        }, this.tabQuery);
        this.tabContainer.startup();
        utils.setVerticalCenter(this.tabContainer.domNode);
      },

      _startup:function(){
        if (!this._startedNow) {
          if (this.config.defaultValue) {
            this.inputQueryName.value = this.config.defaultValue;
            this.search(this.config.defaultValue);
          } else {
            this.search(null, true);
          }
        }
        this._startedNow = true;
      },

      startup: function() {
        this.inherited(arguments);
        if(this.isValidConfig){
          if(this.resultLayer && !(this.resultLayer instanceof FeatureLayer)){
            this._startup();
          }
        }
      },

      onClose:function(){
        this._hideInfoWindow();
        this.inherited(arguments);
      },

      destroy:function(){
        this._hideInfoWindow();
        if(this.resultLayer){
          this.map.removeLayer(this.resultLayer);
        }
        this.resultLayer = null;
        this.inherited(arguments);
      },

      onShowAll: function() {
        this.search(null, true);
      },

      onSearch: function() {
        if(!this.config.expression){
          return;
        }
        this.search();
      },

      search: function(defaultValue, showAll) {
        if(!this.isValidConfig){
          return;
        }
        var content, where;
        var query = new Query();
        this.list.clear();
        this.tabContainer.selectTab(this.nls.results);

        this.resultLayer.clear();
        if (defaultValue) {
          content = defaultValue;
        } else {
          content = this.inputQueryName.value;
        }

        if (showAll) {
          where = "1=1";
        } else {
          if (!content) {
            return;
          }
          where = this.config.layer.expression;
          where = where.replace(/\[value\]/g, content);
        }
        query.where = where;
        html.setStyle(this.progressBar.domNode,'display','block');
        html.setStyle(this.divResult,'display','none');
        var fields = [];
        if (this.config.layer.fields.all) {
          fields[0] = "*";
        } else {
          fields = array.map(this.config.layer.fields.field,lang.hitch(this,function(item){
            return item.name;
          }));
          if(this.resultLayer.renderer){
            var attributeField = this.resultLayer.renderer.attributeField;
            if(attributeField && array.indexOf(fields,attributeField) < 0){
              fields.push(attributeField);
            }
          }
        }

        var url = this.config.layer.url;
        var queryTask = new QueryTask(url);
        query.returnGeometry = true;
        query.outFields = fields;
        queryTask.execute(query, lang.hitch(this, this._onQueryFinish), lang.hitch(this, this._onQueryError));
      },

      clear: function() {
        this._hideInfoWindow();
        if (this.resultLayer) {
          this.resultLayer.clear();
        }
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noResults;
        return false;
      },

      _onQueryError: function(error) {
        html.setStyle(this.progressBar.domNode,'display','none');
        html.setStyle(this.divResult,'display','block');
        this.resultLayer.clear();
        new Message({
          message: this.nls._onQueryError
        });
        console.debug(error);
      },

      _onQueryFinish: function(results) {
        html.setStyle(this.progressBar.domNode,'display','none');
        html.setStyle(this.divResult,'display','block');
        this.resultLayer.clear();
        this.list.clear();
        var title = "";
        var titlefield = this.config.layer.titlefield;
        var objectIdField = this.config.layer.objectIdField;
        var existObjectId = this.config.layer.existObjectId;
        var len = results.features.length;
        if (len === 0) {
          this.divResultMessage.textContent = this.nls.noResults;
          return;
        } else {
          this.divResultMessage.textContent = this.nls.featuresSelected + results.features.length;
        }

        for (var i = 0; i < len; i++) {
          var attributes = results.features[i].attributes;
          var line = "",br = "",label = "",content = "";
          for (var att in attributes) {
            if(!existObjectId && att === objectIdField){
              continue;
            }
            label = label + line + this._getAlias(att) + ": " + attributes[att];
            line = ", ";
            if (titlefield &&　(att.toLowerCase() === titlefield.toLowerCase())) {
              title = attributes[att];
            } else {
              content = content + br + this._getAlias(att) + ": " + attributes[att];
              br = "<br>";
            }
          }
          this.list.add({
            id: "id_" + i,
            label: (i+1)+",  "+label,
            title: title,
            content: content
          });
        }
        
        this._drawResults(results);
      },

      _getAlias: function(att) {
        var field = this.config.layer.fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.alias) {
            return item.alias;
          }
        }
        return att;
      },

      _drawResults: function(results) {
        var symbol;
        if(this.config.symbol){
          if(this.config.symbol.url){
            this.config.symbol.url = this.folderUrl + this.config.symbol.url;
          }
          symbol = jsonUtils.fromJson(this.config.symbol);
        }
        var features = results.features;
        for (var i = 0, len = features.length; i < len; i++) {
          var feature = features[i];
          var listItem = this.list.items[i];
          var type = feature.geometry.type;
          var json = {};
          var geometry, centerpoint;
          json.spatialReference = feature.geometry.spatialReference;
          switch (type) {
          case "multipoint":
          case "point":
            json.x = feature.geometry.x;
            json.y = feature.geometry.y;
            geometry = new Point(json);
            if(!symbol){
              symbol = new SimpleMarkerSymbol();
            }
            centerpoint = geometry;
            break;
          case "polyline":
            json.paths = feature.geometry.paths;
            geometry = new Polyline(json);
            if(!symbol){
              symbol = new SimpleLineSymbol();
            }
            centerpoint = geometry.getPoint(0, 0);
            break;
          case "extent":
          case "polygon":
            json.rings = feature.geometry.rings;
            geometry = new Polygon(json);
            if(!symbol){
              symbol = new SimpleFillSymbol();
            }
            centerpoint = geometry.getPoint(0, 0);
            break;
          default:
            break;
          }

          if(this.resultLayer.renderer){
            symbol = null;
          }

          feature.setSymbol(symbol);
          if(!feature.infoWindow){
            var it = new InfoTemplate(title, title + "<br>" + content);
            feature.setInfoTemplate(it);
          }

          listItem.centerpoint = centerpoint;
          listItem.graphic = feature;
          var title = listItem.title;
          var content = listItem.content;
          this.resultLayer.add(feature);
        }
      },

      _selectResultItem: function(index, item) {
        var point = this.list.items[this.list.selectedIndex].centerpoint;
        this.map.centerAt(point).then(lang.hitch(this, function(){
          this.map.infoWindow.setFeatures([item.graphic]);
          this.map.infoWindow.setTitle(item.title);
          if(item.content){
            this.map.infoWindow.setContent(item.content);
          }else{
            this.map.infoWindow.setContent(item.title);
          }
          this.map.infoWindow.reposition();
          this.map.infoWindow.show(item.centerpoint);
        }));
      },

      _hideInfoWindow:function(){
        if(this.map &&　this.map.infoWindow){
          this.map.infoWindow.hide();
        }
      }

    });
  });