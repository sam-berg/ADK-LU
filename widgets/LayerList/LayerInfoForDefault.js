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
  './LayerInfo',
  'dojox/gfx',
  'dojo/dom-construct',
  'dojo/dom-attr',
  'esri/geometry/webMercatorUtils',
  'dojo/Deferred',
  'esri/symbols/jsonUtils'
], function(declare, array, lang, graphicsUtils, aspect, LayerInfo, gfx, domConstruct, domAttr, webMercatorUtils,  Deferred, jsonUtils) {
  var clazz = declare(LayerInfo, {


    constructor: function( operLayer, map ) {
      if(this.layerObject) {
        this.layerObject.on('load', lang.hitch(this, this.initLegendsNode));
      }
      this.initLegendsNode();
      /*jshint unused: false*/
    },

    getExtent: function() {
      return this._convertGeometryToMapSpatialRef(this.originOperLayer.layerObject.initialExtent) || this._convertGeometryToMapSpatialRef(this.originOperLayer.layerObject.fullExtent);
    },

    _obtainIsVisible: function() {
      /*jshint unused: false*/
      var visible = false, i;
      var mapService = this.originOperLayer.mapService;
      if(this.originOperLayer.mapService) {
      // layer or group in map service.
        if(this.originOperLayer.subLayers.length > 0) {
        //group in map service.
          /*
          for(i=0; i<this.newSubLayers.length; i++) {
            visible = visible || this.newSubLayers[i]._obtainIsVisible();
          }*/
          visible = true;
        } else {
        //layer in map service.
          if(mapService.layerInfo.subLayerVisible[mapService.subId] > 0) {
            visible = true;
          }
        }
      } else {
        visible = this.originOperLayer.layerObject.visible;
      }
      return visible;
    },

    setTopLayerVisible: function(visible) {
      var mapService, subId, i;
      // mapservice
      if(this.originOperLayer.mapService) {
        //this.originOperLayer.mapService.layerInfo.setSubLayerVisible(this.originOperLayer.mapService.subId, visible);
        mapService = this.originOperLayer.mapService;
        if(this.originOperLayer.subLayers.length > 0) {
        //group in map service.
          for(i=0; i<this.newSubLayers.length; i++) {
            subId = this.newSubLayers[i].originOperLayer.mapService.subId;
            if(visible) {
              mapService.layerInfo.subLayerVisible[subId]++;
            } else {
              mapService.layerInfo.subLayerVisible[subId]--;
            }
            if(mapService.layerInfo.subLayerVisible[subId] > 0) {
              mapService.layerInfo.setSubLayerVisible(subId, true);
            } else {
              mapService.layerInfo.setSubLayerVisible(subId, false);
            }
          }
        } else {
        //layer in map service.
          if(visible) {
            mapService.layerInfo.subLayerVisible[mapService.subId] ++;
          } else {
            mapService.layerInfo.subLayerVisible[mapService.subId] --;
          }
          if(mapService.layerInfo.subLayerVisible[mapService.subId] > 0) {
            mapService.layerInfo.setSubLayerVisible(mapService.subId, true);
          } else {
            mapService.layerInfo.setSubLayerVisible(mapService.subId, false);
          }
          
        }
        //console.log(mapService.layerInfo.subLayerVisible);
        //console.log(mapService.layerInfo.layerObject.visibleLayers);
      } else if(this.originOperLayer.collection){
        //collection
        //click directly
        if(this.originOperLayer.collection.layerInfo.visible) {
          if(visible) {
            this.layerObject.show();
            this.visible = true;
          } else {
            this.layerObject.hide();
            this.visible = false;
          }
        } else {
          if(visible) {
            this.layerObject.hide();
            this.visible = true;
          } else {
            this.layerObject.hide();
            this.visible = false;
          }
        }
      } else {
        if (visible) {
          this.layerObject.show();
        } else {
          this.layerObject.hide();
        }
      }
    },

    setLayerVisiblefromTopLayer: function() {
      //click from top collecton
      if(this.originOperLayer.collection.layerInfo.visible) {
        if(this.visible) {
          this.layerObject.show();
        }
      } else {
        this.layerObject.hide();
      }
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
      var legendInfos = [];
      var layer = operLayer.layerObject;

      if( this.layerObject && (!operLayer.subLayer || operLayer.subLayers.length === 0)) {
        if (layer.renderer) {
          if (layer.renderer.infos) {
            legendInfos = lang.clone(layer.renderer.infos); // todo
          } else {
            legendInfos.push({
              label: layer.renderer.label,
              symbol: layer.renderer.symbol
            });
          }

          array.forEach(legendInfos, function(legendInfo) {
            legendInfo.legendDiv = domConstruct.create("div", {
              "class": "legend-div"
            });

            legendInfo.symbolDiv= domConstruct.create("div", {
              "class": "legend-symbol"
            }, legendInfo.legendDiv);
            legendInfo.labelDiv= domConstruct.create("div", {
              "class": "legend-label",
              "innerHTML": legendInfo.label || " "
            }, legendInfo.legendDiv);

            if(legendInfo.symbol.type === "textsymbol") {
              domAttr.set(legendInfo.symbolDiv, "innerHTML", legendInfo.symbol.text);
            } else {
              var mySurface = gfx.createSurface(legendInfo.symbolDiv, 50, 50);
              var descriptors = jsonUtils.getShapeDescriptors(legendInfo.symbol);
              var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
              shape.setTransform(gfx.matrix.translate(25, 25));
            }
          });
        }
      }
      return legendInfos;
    },

    initLegendsNode: function() {
      var legendInfos = [];
      var layer = this.originOperLayer.layerObject;

      if( this.layerObject && (!this.originOperLayer.subLayer || this.originOperLayer.subLayers.length === 0)) {
        // layer has renderer that means the layer has loadded.
        if (layer.renderer) {
          if (layer.renderer.infos) {
            legendInfos = lang.clone(layer.renderer.infos); // todo
          } else {
            legendInfos.push({
              label: layer.renderer.label,
              symbol: layer.renderer.symbol
            });
          }

          array.forEach(legendInfos, function(legendInfo) {
            legendInfo.legendDiv = domConstruct.create("div", {
              "class": "legend-div"
            }, this.legendsNode);

            legendInfo.symbolDiv= domConstruct.create("div", {
              "class": "legend-symbol"
            }, legendInfo.legendDiv);
            legendInfo.labelDiv= domConstruct.create("div", {
              "class": "legend-label",
              "innerHTML": legendInfo.label || " "
            }, legendInfo.legendDiv);

            if(legendInfo.symbol.type === "textsymbol") {
              domAttr.set(legendInfo.symbolDiv, "innerHTML", legendInfo.symbol.text);
            } else {
              var mySurface = gfx.createSurface(legendInfo.symbolDiv, 50, 50);
              var descriptors = jsonUtils.getShapeDescriptors(legendInfo.symbol);
              var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
              shape.setTransform(gfx.matrix.translate(25, 25));
            }
          }, this);
        }
      }
    },

    obtainNewSubLayers: function() {
      var newSubLayers = [];
      /*
      if(!this.originOperLayer.subLayers || this.originOperLayer.subLayers.length === 0) {
        //***
      } else {
      */
      if(this.originOperLayer.subLayers && this.originOperLayer.subLayers.length !== 0) {
        array.forEach(this.originOperLayer.subLayers, function(subOperLayer){
          var subLayerInfo = new clazz(subOperLayer, this.map);
          newSubLayers.push(subLayerInfo);

          subLayerInfo.init();
        }, this);
      }
      return newSubLayers;
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
  return clazz;
});
