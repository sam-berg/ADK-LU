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
  'dojo/_base/array',
  'dojo/_base/lang',
  'esri/graphicsUtils',
  'dojo/aspect',
  './LayerInfoForDefault'
], function(declare, array, lang, graphicsUtils, aspect, LayerInfoForDefault) {
  var clazz = declare(LayerInfoForDefault, {

    constructor: function( operLayer, map ) {
      this.layerObject = operLayer.layerObject;
      this.noLegend= true;
      /*jshint unused: false*/
    },

    getExtent: function() {
    },

    _obtainIsVisible: function() {
    },

    setTopLayerVisible: function(visible) {
      /*jshint unused: false*/
    },

    setLayerVisiblefromTopLayer: function() {
    },

    //---------------new section-----------------------------------------
    // operLayer = {
    //    layerObject: layer,
    //    title: layer.label || layer.title || layer.name || layer.id || " ",
    //    id: layerId || " ",
    //    subLayers: [operLayer, ... ],
    //    mapService: {layerInfo: , subId: },
    //    collection: {layerInfo: }
    // };
    _obtainLegendInfos: function(operLayer) {
      /*jshint unused: false*/
      var legendInfos = [];
      return legendInfos;
    },

    obtainNewSubLayers: function() {
      var newSubLayers = [];
      if(!this.originOperLayer.subLayers || this.originOperLayer.subLayers.length === 0) {
        //***********
        console.log();
      } else {
        array.forEach(this.originOperLayer.subLayers, function(subOperLayer){

          var subLayerInfo = new clazz(subOperLayer, this.map);
          newSubLayers.push(subLayerInfo);

          subLayerInfo.init();
        }, this);
      }
      return newSubLayers;
    },

    getOpacity: function() {
    },

    setOpacity: function(opacity) {
      /*jshint unused: false*/
    }

  });
  return clazz;
});
