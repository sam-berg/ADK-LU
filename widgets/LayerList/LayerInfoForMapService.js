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
  'dojo/Deferred',
  './LayerInfo',
  './LayerInfoForDefault',
  './LayerInfoForDefaultTile',
  'esri/layers/ArcGISDynamicMapServiceLayer',
  'esri/layers/FeatureLayer'
], function(declare, array, lang, Deferred, LayerInfo, LayerInfoForDefault, LayerInfoForDefaultTile, ArcGISDynamicMapServiceLayer, FeatureLayer) {
  return declare(LayerInfo, {


    constructor: function( operLayer, map) {
      this.initSubLayerVisible();
      /*jshint unused: false*/
    },

    initSubLayerVisible: function() {
      this.subLayerVisible = [];
      //the subLayerVisible has the same index width layerInfos.
      this.subLayerVisible[this.layerObject.layerInfos.length-1] = 0;

      for(var i = 0; i<this.subLayerVisible.length; i++) {
        if(this.layerObject.layerInfos[i].subLayerIds) {
        // it's a group
          this.subLayerVisible[i] = -100000;
        } else {
          this.subLayerVisible[i] = 0;
        }
      }

      /*
      function makeSubLayerVisible(subLayerId){
        this.setSubLayerVisible(subLayerId, true);
      }

      
      // unvisible group and visible subLayers of group.
      for(i=0; i<this.layerObject.layerInfos.length; i++) {
        var layerInfo = this.layerObject.layerInfos[i];
        var index = array.indexOf(this.layerObject.visibleLayers, layerInfo.id);
        if(layerInfo.subLayerIds && index >= 0) {
          array.forEach(layerInfo.subLayerIds, makeSubLayerVisible, this);
          this.setSubLayerVisible(layerInfo.id, false);
          i = -1;
          continue;
        }
      }
      */

      array.forEach(this.layerObject.visibleLayers, function(visibleId){
        if(visibleId >= 0) {
          this.subLayerVisible[visibleId]++;
        }
      }, this);
    },

    getExtent: function() {
      var extent = this.originOperLayer.layerObject.initialExtent;
      return this._convertGeometryToMapSpatialRef(extent);
    },

    _obtainIsVisible: function() {
      return this.originOperLayer.layerObject.visible;
    },

    setTopLayerVisible: function(visible) {
      this.originOperLayer.layerObject.setVisibility(visible);
    },

    setSubLayerVisible: function(subLayerId, visible) {
      var ary = [], index;
      if (subLayerId !== null) {
        if (visible) {
          ary = lang.clone(this.originOperLayer.layerObject.visibleLayers);
          index = array.indexOf(ary, subLayerId);
          if(index < 0) {
            ary.push(subLayerId);
            this.originOperLayer.layerObject.setVisibleLayers(ary);
          }
        } else {
          ary = lang.clone(this.originOperLayer.layerObject.visibleLayers);
          index = array.indexOf(ary, subLayerId);
          if (index >= 0) {
            ary.splice(index, 1);
          }
          if (ary.length === 0) {
            ary.push(-1);
          }
          this.originOperLayer.layerObject.setVisibleLayers(ary);
        }
      }
    },
    //---------------new section-----------------------------------------

    obtainNewSubLayers: function() {
      var newSubLayers = [];
      var layer = this.originOperLayer.layerObject;

                              //if(layer instanceof esri.layers.ArcGISDynamicMapServiceLayer) {
      array.forEach(layer.layerInfos, function(layerInfo, index) {
        var featureLayer = null, i;
        var url = layer.url + "/" + layerInfo.id;
        var featureLayerId = layer.id + "_" + layerInfo.id;
        
        for(i = 0; i < this.layerCache.length; i++) {
          if(this.layerCache[i].url === url) {
            featureLayer = this.layerCache[i].layerObj;
            break;
          }
        }

        // featureLayer already in cache or it is a group layer.
        if(featureLayer || (layerInfo.subLayerIds && layerInfo.subLayerIds.length > 0)) {
          newSubLayers.push({
            layerObject: featureLayer,
            title: layerInfo.name || layerInfo.id || " ",
            id: featureLayerId || " ",
            subLayers: [],
            mapService: {"layerInfo": this, "subId": layerInfo.id}
          });
        } else {
          featureLayer = new FeatureLayer(url);
          newSubLayers.push(featureLayer);
          //featureLayer.on('load', lang.hitch(this, this._addNewSubLayer, newSubLayers, index, featureLayerId, layerInfo.id, deferreds[index], url, layerInfo));
          //featureLayer.on('error', lang.hitch(this, this._handleErrorSubLayer, newSubLayers, index, featureLayerId, layerInfo.id, deferreds[index], url, layerInfo));
          this._addNewSubLayer(newSubLayers, index, featureLayerId,  url, layerInfo);
        }
      }, this);
                            /*
                                  } else {
                                  //title layer
                                    array.forEach(layer.layerInfos, function(layerInfo, index) {
                                      newSubLayers.push({
                                        layerObject: layer,
                                        title:  layerInfo.name || layerInfo.id || " ",
                                        id: layer.id + "_" + layerInfo.id,
                                        subLayers: []
                                      });
                                      deferreds[index].resolve();
                                    }, this);
                                  }
                            */

      //afer load all featureLayers.
      var finalNewSubLayerInfos = [];
      //reorganize newSubLayers, newSubLayers' element now is:
      //{
      // layerObject:
      // title:
      // id:
      // subLayers:
      //}
      array.forEach(layer.layerInfos, function(layerInfo, i){
        var parentId = layerInfo.parentLayerId;
        //if fetchs a FeatrueLayer error. does not add it;
        if(parentId !== -1 /*&& !newSubLayers[layerInfo.id].error && !newSubLayers[parentId].error*/) {//****
          newSubLayers[parentId].subLayers.push(newSubLayers[i]);
        }
      });

      array.forEach(layer.layerInfos, function(layerInfo, i){
        var subLayerInfo;
        //if fetchs a FeatrueLayer error. does not add it;
        if(layerInfo.parentLayerId === -1 /*&& !newSubLayers[layerInfo.id].error*/) {
          if(layer instanceof ArcGISDynamicMapServiceLayer) {
            subLayerInfo = new LayerInfoForDefault(newSubLayers[i], this.map);
          } else {
            subLayerInfo = new LayerInfoForDefaultTile(newSubLayers[i], this.map);
          }
          finalNewSubLayerInfos.push(subLayerInfo);
          subLayerInfo.init();
        }
      }, this);

      return finalNewSubLayerInfos;
    },

/*
    _addNewSubLayer: function(newSubLayers, index, layerId, subId, url, layerInfo) {
      var layer = newSubLayers[index];
      newSubLayers[index] = {
        layerObject: layer,
        title: layer.label || layer.title || layer.name || layer.id || " ",
        id: layerId || " ",
        subLayers: [],
        mapService: {"layerInfo": this, "subId": subId}
      };

      this.layerCache.push({
        url: url,
        layerObj: layer
      });

    },
*/
    _addNewSubLayer: function(newSubLayers, index, layerId, url, layerInfo) {
      var layer = newSubLayers[index];
      newSubLayers[index] = {
        layerObject: layer,
        title: layerInfo.name || layerInfo.id || " ",
        id: layerId || " ",
        subLayers: [],
        mapService: {"layerInfo": this, "subId": layerInfo.id}
      };

      /*
      this.layerCache.push({
        url: url,
        layerObj: layer
      });
      */
    },



    _handleErrorSubLayer: function(newSubLayers, index, layerId, subId, url, layerInfo) {
      //newSubLayers[index] = {error: true};
      //var layer = newSubLayers[index];
      newSubLayers[index] = {
        layerObject: null,
        title: layerInfo.name || layerInfo.id || " ",
        id: layerId || " ",
        subLayers: [],
        mapService: {"layerInfo": this, "subId": subId}
      };
    },

    getOpacity: function() {
      if (this.layerObject.opacity) {
        return this.layerObject.opacity;
      } else {
        return 1;
      }
    },

    setOpacity: function(opacity) {
      if (this.layerObject.setOpacity) {
        this.layerObject.setOpacity(opacity);
      }
    }

  });
});
