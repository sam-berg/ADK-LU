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
    "esri/dijit/Basemap",
    "esri/dijit/BasemapLayer",
    'esri/dijit/BasemapGallery',
    'dojo/_base/lang',
    'dojo/on'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Basemap,
    BasemapLayer,
    BasemapGallery,
    lang,
    on) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'BasemapGallery',
      baseClass: 'jimu-widget-basemapgallery',
      basemapGallery: null,

      startup: function() {
        this.inherited(arguments);
        this.basemapGallery = new BasemapGallery(this.resetBasemaps(), this.basemapGalleryDiv);
        this.basemapGallery.startup();
        this.own(on(this.basemapGallery, "selection-change", lang.hitch(this, this.selectionChange)));
      },

      resetBasemaps: function() {
        var config = lang.clone(this.config.basemapGallery);
        config.map = this.map;
        if (this.appConfig.portalUrl) {
          config.portalUrl = this.appConfig.portalUrl;
        }
        var json = config.basemaps;
        if (json === undefined) {
          return;
        }
        var len = json.length;

        for (var i = 0; i < len; i++) {
          var n = json[i].layers.length;
          var layersArray = [];
          for (var j = 0; j < n; j++) {
            layersArray.push(new BasemapLayer(json[i].layers[j]));
          }
          json[i].layers = layersArray;
          if (json[i].thumbnailUrl) {
            if (json[i].thumbnailUrl.indexOf("data:image") !== 0) {
              json[i].thumbnailUrl = this.folderUrl + json[i].thumbnailUrl;
            }
          }else{
            json[i].thumbnailUrl = this.folderUrl + "images/default.jpg";
          }
          var basemap = new Basemap(json[i]);
          json[i] = basemap;
        }
        return config;
      },

      selectionChange: function() {
        var basemap = this.basemapGallery.getSelected();
        var layers = basemap.getLayers();
        if (layers.length > 0) {
          this.publishData();
        }
      }

    });

    return clazz;
  });