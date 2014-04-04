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
    'jimu/BaseWidgetSetting',
    "dojo/_base/lang",
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-attr",
    'jimu/dijit/SimpleTable',
    'jimu/dijit/ImageChooser',
    "dojo/query",
    'jimu/dijit/Message',
    "esri/layers/ArcGISTiledMapServiceLayer",
    'dijit/form/CheckBox',
    'dijit/form/Button',
    'dijit/form/ValidationTextBox',
    'dijit/form/TextBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    on,
    domStyle,
    domAttr,
    Table,
    ImageChooser,
    query,
    Message,
    ArcGISTiledMapServiceLayer) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-basemapgallery-setting',
      imageChooser: null,
      basemapLayers: [],
      oldBasemapTitle: "",
      tableTr: "",

      startup: function() {
        this.inherited(arguments);
        if (!this.config.basemapGallery) {
          this.config.basemapGallery = {};
        }

        var fields = [{
          name: 'title2',
          title: this.nls.title,
          type: 'text',
          unique: true,
          editable: true
        }, {
          name: 'thumbnailUrl',
          title: this.nls.thumbnail,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          'class': "actions",
          actions: ['up', 'down', 'edit', 'delete']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableBasemaps);
        this.displayFieldsTable.startup();
        this.own(on(this.displayFieldsTable, 'Edit', lang.hitch(this, this.editBasemap)));

        var fields2 = [{
          name: 'url',
          title: this.nls.url,
          type: 'text',
          editable: true,
          unique: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          'class': 'actions',
          actions: ['up', 'down', 'delete']
        }];
        var args2 = {
          fields: fields2,
          selectable: true
        };
        this.urlTable = new Table(args2);
        this.urlTable.placeAt(this.tableUrls);
        this.urlTable.startup();

        this.imageChooser = new ImageChooser({
          displayImg: this.showImageChooser
        });
        this.own(on(this.imageChooser, 'imageChange', lang.hitch(this, this.imageChange)));
        this.setConfig(this.config);
        domAttr.set(this.checkImg, 'src', require.toUrl('jimu') + "/images/loading.gif");
        this.own(on(this.thumbnail, 'change', lang.hitch(this, this.onThumbnailChange)));
      },

      onThumbnailChange: function(){
        var value = this.thumbnail.value;
        if(value.indexOf('data:image')>-1){
          domAttr.set(this.showImageChooser, 'src', value);
        }else{
          domAttr.set(this.showImageChooser, 'src', this.folderUrl + value);
        }
      },

      editBasemap: function(tr){
        this.tableTr = tr;
        var tds = query(".action-item-parent", tr);
        if (tds && tds.length) {
          this.gotoUrlPage();
          var data = this.displayFieldsTable.getRowData(tr);
          if(data.title2){
            this.urlTable.clear();
            this.title.set('value', data.title2);
            this.thumbnail.set('value', data.thumbnailUrl);
            if(data.thumbnailUrl && data.thumbnailUrl.indexOf('data:image')>-1){
              domAttr.set(this.showImageChooser, 'src', data.thumbnailUrl);
            }else if(data.thumbnailUrl){
              domAttr.set(this.showImageChooser, 'src', this.folderUrl + data.thumbnailUrl);
            }else{
              domAttr.set(this.showImageChooser, 'src', this.folderUrl + "images/default.jpg");
            }
            this.oldBasemapTitle = data.title2;
            var layers = this.getLayersByTitle(data.title2);
            var len = layers.length;
            for(var i=0;i<len;i++){
              this.urlTable.addRow({
                url: layers[i].url
              });
            }
          }
        }
      },

      addImage: function() {
        this.imageChooser.show();
      },

      imageChange: function(data) {
        this.thumbnail.set('value', data);
      },

      addUrl: function(){
        var url = this.url.value;
        if(url){
          if(this.check.checked){
            domStyle.set(this.checkCheckboxDiv, "display", "none");
            domStyle.set(this.checkProcessDiv, "display", "");
            var layer = new ArcGISTiledMapServiceLayer(url);
            this.own(on(layer, 'error', lang.hitch(this, this.checkError)));
            this.own(on(layer, 'load', lang.hitch(this, this.checkLoad)));
          }else{
            this.urlTable.addRow({
              url: url
            });
          }
        }
      },

      checkError: function(params){
        domStyle.set(this.checkProcessDiv, "display", "none");
        domStyle.set(this.checkCheckboxDiv, "display", "");
        if(params && params.error && params.error.message){
          var popup = new Message({
            message: params.error.message,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
        }
      },

      checkLoad: function(params){
        domStyle.set(this.checkProcessDiv, "display", "none");
        domStyle.set(this.checkCheckboxDiv, "display", "");
        if(params.layer.spatialReference.wkid === this.map.spatialReference.wkid){
          this.urlTable.addRow({
            url: params.layer.url
          });
        }else{
          var popup = new Message({
            message: this.nls.spError,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
        }
        
      },

      saveBasemap: function(evt,auto){
        var json = {};
        json.title2 = this.title.value;
        json.thumbnailUrl = this.thumbnail.value;
        var layers = this.urlTable.getData();
        if (!json.title2 || !layers || !layers.length) {
          var popup = new Message({
            message: this.nls.warning,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                popup.close();
              })
            }]
          });
          return false;
        }
        this.saveUrls(this.oldBasemapTitle, json.title2, layers);
        if(!this.oldBasemapTitle){
          this.displayFieldsTable.addRow(json);
          this.gotoUrlPage();
        }else{
          this.displayFieldsTable.editRow(this.tableTr, {
            title2: json.title2,
            thumbnailUrl: json.thumbnailUrl
          });
        }
        if(!auto){
          var result = new Message({
            message: this.nls.result,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function() {
                result.close();
              })
            }]
          });
        }
        return true;
      },

      saveUrls: function(oldTitle, newTitle, layers){
        if(!oldTitle){
          var layer = {};
          layer.title = newTitle;
          layer.layers = layers;
          this.basemapLayers.push(layer);
        }else{
          var len = this.basemapLayers.length;
          for(var i=0;i<len;i++){
            if(this.basemapLayers[i].title === oldTitle){
              this.basemapLayers[i].title = newTitle;
              this.basemapLayers[i].layers = layers;
              break;
            }
          }
        }
      },

      setConfig: function(config) {
        this.config = config;
        this.displayFieldsTable.clear();
        this.basemapLayers.length = 0;
        this.showArcGISBasemaps.set('checked', config.basemapGallery.showArcGISBasemaps);
        if (config.basemapGallery.basemaps) {
          var json = [];
          var len = config.basemapGallery.basemaps.length;
          var configuration = config.basemapGallery.basemaps;
          for (var i = 0; i < len; i++) {
            json.push({
              title2: configuration[i].title,
              thumbnailUrl: configuration[i].thumbnailUrl
            });
            var layer = {};
            layer.title = configuration[i].title;
            layer.layers = configuration[i].layers;
            this.basemapLayers.push(layer);
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      gotoUrlPage: function() {
        var display = domStyle.get(this.secondPage, "display");
        if (display === "none") {
          domStyle.set(this.firstPage, "display", "none");
          domStyle.set(this.secondPage, "display", "");
        } else {
          domStyle.set(this.secondPage, "display", "none");
          domStyle.set(this.firstPage, "display", "");
        }
      },

      addNew: function(){
        this.oldBasemapTitle = "";
        this.title.set('value', "");
        this.url.set('value', "");
        this.thumbnail.set('value', "");
        this.urlTable.clear();
        this.gotoUrlPage();
        setTimeout(lang.hitch(this, function(){
          domAttr.set(this.showImageChooser, 'src', this.folderUrl + "images/default.jpg");
        }),100);
      },

      getLayersByTitle: function(title){
        var len = this.basemapLayers.length;
        for(var i=0;i<len;i++){
          if(this.basemapLayers[i].title === title){
            return this.basemapLayers[i].layers;
          }
        }
      },

      getConfig: function(ok) {
        var display = domStyle.get(this.firstPage, "display");
        if (ok && display === "none") {
          var result = this.saveBasemap(null,true);
          if(!result){
            return false;
          }
        }
        this.config.basemapGallery.showArcGISBasemaps = this.showArcGISBasemaps.checked;
        var data = lang.clone(this.displayFieldsTable.getData());
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          var basemap = {};
          basemap.title = data[i].title2;
          basemap.thumbnailUrl = data[i].thumbnailUrl;
          basemap.layers = this.getLayersByTitle(data[i].title2);
          json.push(basemap);
        }
        this.config.basemapGallery.basemaps = json;
        return this.config;
      }

    });
  });