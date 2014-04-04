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
  'dojo/aspect',
  'dojo/Deferred',
  'esri/layers/WMSLayer',
  'esri/layers/GeoRSSLayer',
  'esri/layers/KMLLayer',
  'esri/layers/FeatureLayer',
  './LayerInfoForCollection',
  './LayerInfoForMapService',
  './LayerInfoForKML',
  './LayerInfoForGeoRSS',
  './LayerInfoForDefault',
  './LayerInfoForWMS'
], function(declare, array, lang, aspect, Deferred, WMSLayer, GeoRSSLayer, KMLLayer, FeatureLayer, LayerInfoForCollection, LayerInfoForMapService, LayerInfoForKML, LayerInfoForGeoRSS, LayerInfoForDefault, LayerInfoForWMS) {

  return declare(null, {
    operLayers: null,
    map: null,
    //layerInfos: null,
    finalLayerInfos: null,

    //basemapLayers  = {
    // layerObject:
    // id:
    //}
    basemapLayers: null,

    constructor: function(basemapLayers, operLayers, map) {
      this.basemapLayers = basemapLayers;
      this.operLayers = operLayers;
      this.map = map;
      this.finalLayerInfos = [];
      this.update();
      aspect.after(this.map, "onBaseChange", lang.hitch(this, this._onBasemapChange));
    },

    initLayerInfos: function() {
      var layerInfo;
      var layerInfos = [];
      array.forEach(this.operLayers, function(operLayer) {
        layerInfo = this.layerInfoFactory(operLayer);
        if (layerInfo) {
          layerInfos.push(layerInfo);
          layerInfo.init();
        }
      }, this);

      //layerInfos.reverse();
      this.layerInfos = layerInfos;
    },

    update: function() {
      this.initLayerInfos();
      this._clearAddedFlag(this.layerInfos);
      this._initFinalLayerInfos(this.layerInfos);
      this.markFirstOrLastNode();
    },

    layerInfoFactory: function(operLayer) {
      if (operLayer.featureCollection) {
        return new LayerInfoForCollection(operLayer, this.map);
      //} else if (operLayer.type === "KML") {
      } else if (operLayer.layerObject instanceof KMLLayer) {
        return new LayerInfoForKML(operLayer, this.map);
      } else if (operLayer.layerObject instanceof GeoRSSLayer) {
        return new LayerInfoForGeoRSS(operLayer, this.map);
      } else if (operLayer.layerObject instanceof WMSLayer) {
        return new LayerInfoForWMS(operLayer, this.map);
      } else if (operLayer.layerObject && operLayer.layerObject.layerInfos) {
        return new LayerInfoForMapService(operLayer, this.map);
      } else if (operLayer.layerObject) {
        return new LayerInfoForDefault(operLayer, this.map);
      }
    },

    _initFinalLayerInfos: function(layerInfos) {
      //handle order to dicide finalLayerInfos order
      var i, id;
      this.finalLayerInfos.length = 0;
      //for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
      for (i = this.map.graphicsLayerIds.length - 1;  i >= 0; i--) {
        id = this.map.graphicsLayerIds[i];
        if (!this._isBasemap(id)) {
          this._addToFinalLayerInfos(this._findLayerFromLayerInfos(id, layerInfos), id, true);
        }
      }

      //for (i = 0; i < this.map.layerIds.length; i++) {
      for (i = this.map.layerIds.length - 1; i >= 0; i--) {
        id = this.map.layerIds[i];
        if (!this._isBasemap(id)) {
          this._addToFinalLayerInfos(this._findLayerFromLayerInfos(id, layerInfos), id, false);
        }
      }
    },

    _isBasemap: function(id) {
      var i;
      for (i = 0; i < this.basemapLayers.length; i++) {
        if (this.basemapLayers[i].id === id) {
          return id;
        }
      }
      return false;
    },

    _addToFinalLayerInfos: function(layerInfo, id, isGraphicLayer) {
      var newLayer;
      var newLayerInfo;
      if (layerInfo) {
        if (!layerInfo._addedFlag && (layerInfo.isGraphicLayer === isGraphicLayer)) {
          this.finalLayerInfos.push(layerInfo);
          layerInfo._addedFlag = true;
        }
      } else {
        newLayer = this.map.getLayer(id);
        // if newLayer is featueLayer add it.
        //if (newLayer.type && ((newLayer.type === "Feature Layer") || (newLayer.type === "Table"))) {
        if (newLayer instanceof FeatureLayer) {
          newLayerInfo = this.layerInfoFactory({
            layerObject: newLayer,
            title: newLayer.label || newLayer.title || newLayer.name || newLayer.id || " ",
            id: newLayer.id || " "
          }, this.map);
          this.finalLayerInfos.push(newLayerInfo);
          newLayerInfo.init();
        }
      }
    },

    _findLayerFromLayerInfos: function(id, layerInfos) {//****************************need improve
      var i, j;
      for (i = 0; i < layerInfos.length; i++) {
        for (j = 0; j < layerInfos[i].newSubLayers.length; j++) {
          if (layerInfos[i].newSubLayers[j].id === id) {
            return layerInfos[i];
          }
        }
        //find parentLayer after subLayer.
        if (layerInfos[i].id === id) {
          return layerInfos[i];
        }
      }
      return null;
    },

    _clearAddedFlag: function(layerInfos) {
      array.forEach(layerInfos, function(operLayer) {
        operLayer._addedFlag = false;
      });
    },

    markFirstOrLastNode: function() {
      var i;
      if (this.finalLayerInfos.length) {
        //clearing first
        for (i = 0; i < this.finalLayerInfos.length; i++) {
          this.finalLayerInfos[i].isFirst = false;
          this.finalLayerInfos[i].isLast = false;
        }

        this.finalLayerInfos[0].isFirst = true;
        this.finalLayerInfos[this.finalLayerInfos.length - 1].isLast = true;

        for (i = 0; i < this.finalLayerInfos.length; i++) {
          if (!this.finalLayerInfos[i].isGraphicLayer) {
            if (i) {
              (this.finalLayerInfos[i - 1].isLast = true);
            }
            this.finalLayerInfos[i].isFirst = true;
            return;
          }
        }
      }
    },

    getFinalLayerInfoIndexById: function(id) {
      var i;
      for (i = 0; i < this.finalLayerInfos.length; i++) {
        if (this.finalLayerInfos[i].id === id) {
          return i;
        }
      }
    },

    /*
    moveUpLayer: function(id) {
      var beChangedId = null;
      var index = this.getFinalLayerInfoIndexById(id);
      if (index > 0) {
        this.finalLayerInfos[index].moveLeftOfIndex(this.finalLayerInfos[index - 1]._obtainLayerIndexesInMap()[0].index);
        beChangedId = this.finalLayerInfos[index - 1].id;
        this.update();
      }
      return beChangedId;
    },
    */

    moveDownLayer: function(id) {
      var beChangedId = null, tempLayerInfo;
      var index = this.getFinalLayerInfoIndexById(id);
      if (index < (this.finalLayerInfos.length - 1)) {
        this.finalLayerInfos[index].moveLeftOfIndex(this.finalLayerInfos[index + 1]._obtainLayerIndexesInMap()[0].index);
        beChangedId = this.finalLayerInfos[index + 1].id;
        //this.update();
        tempLayerInfo = this.finalLayerInfos[index+1];
        this.finalLayerInfos.splice(index+1, 1);
        this.finalLayerInfos.splice(index, 0, tempLayerInfo);
        this.markFirstOrLastNode();

      }
      return beChangedId;
    },



    /*
    moveDownLayer: function(id) {
      var beChangedId = null;
      var index = this.getFinalLayerInfoIndexById(id), l;
      if (index < (this.finalLayerInfos.length - 1)) {
        l = this.finalLayerInfos[index + 1]._obtainLayerIndexesInMap().length;
        this.finalLayerInfos[index].moveRightOfIndex(this.finalLayerInfos[index + 1]._obtainLayerIndexesInMap()[l - 1].index);
        beChangedId = this.finalLayerInfos[index + 1].id;
        this.update();
      }
      return beChangedId;
    },
    */

    moveUpLayer: function(id) {
      var beChangedId = null, tempLayerInfo;
      var index = this.getFinalLayerInfoIndexById(id), l;
      if (index > 0) {
        l = this.finalLayerInfos[index - 1]._obtainLayerIndexesInMap().length;
        this.finalLayerInfos[index].moveRightOfIndex(this.finalLayerInfos[index - 1]._obtainLayerIndexesInMap()[l - 1].index);
        beChangedId = this.finalLayerInfos[index - 1].id;
        //this.update();
        tempLayerInfo = this.finalLayerInfos[index];
        this.finalLayerInfos.splice(index, 1);
        this.finalLayerInfos.splice(index - 1, 0, tempLayerInfo);
        this.markFirstOrLastNode();
      }
      return beChangedId;
    },



    //need modify
    _onBasemapChange: function(current) {
      var i;
      this.basemapLayers.length = 0;
      for (i = 0; i < current.layers.length; i++) {
        this.basemapLayers.push({
          layerObject: current.layer[i],
          id: current.layers[i].id
        });
      }
    }

  });
});
