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
  'esri/graphicsUtils',
  'dojo/aspect',
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/dom-attr',
  './NlsStrings',
  'dojo/dom-construct',
  'esri/geometry/webMercatorUtils'
], function(declare, array, lang, Deferred, graphicsUtils, aspect, domStyle, domClass, domAttr, NlsStrings, domConstruct, webMercatorUtils) {
  return declare(null, {
    // use to cache some layers that are requested from server.
    // layerCache:[{
    //  url:
    //  layerObj:
    // }, ... ]
    layerCache: [],
    isFold: true,

    constructor: function(operLayer, map) {
      this.originOperLayer = operLayer;
      this.layerObject = operLayer.layerObject;

      this.map = map;
      this.popupMenuInfo = {descriptionTitle: NlsStrings.value.itemDesc};

      this.title = this.originOperLayer.title;
      this.id = this.originOperLayer.id;

      // legends node. 
      this.legendsNode = domConstruct.create("div", {
        "class": "legends-div"
      });

    },

    init: function() {

      //new section
      this.newSubLayers = this.obtainNewSubLayers();
      //this.legendInfos = this._obtainLegendInfos(this.originOperLayer);

      //old section
      //this.layerIndexesInMap = this._obtainLayerIndexesInMap();
      var layerIndexesInMap = this._obtainLayerIndexesInMap();

      this.visible = this._obtainIsVisible();

      // to decide layer display in whitch group, now only has two groups: graphic or nographic
      this.isGraphicLayer = layerIndexesInMap.length ? layerIndexesInMap[0].isGraphicLayer : null;
    },


    //indexes:[{
    //  isGraphicLayer:
    //  index:
    //},{}]
    //
    _obtainLayerIndexesInMap: function() {
      var indexes = [];
      var index;
      index = this._getLayerIndexesInMapByLayerId(this.id);
      if (index) {
        indexes.push(index);
      }
      return indexes;
    },

    _getLayerIndexesInMapByLayerId: function(id) {
      var i;
      for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
        if (this.map.graphicsLayerIds[i] === id) {
          return {
            isGraphicLayer: true,
            index: i
          };
        }
      }

      for (i = 0; i < this.map.layerIds.length; i++) {
        if (this.map.layerIds[i] === id) {
          return {
            isGraphicLayer: false,
            index: i
          };
        }
      }
      return null;
    },

    _convertGeometryToMapSpatialRef: function(geometry) {
      if (this.map.spatialReference.isWebMercator()) {
        if (!geometry.spatialReference.isWebMercator()) {
          return webMercatorUtils.geographicToWebMercator(geometry);
        }
      } else {
        if (geometry.spatialReference.isWebMercator()) {
          return webMercatorUtils.webMercatorToGeographic(geometry);
        }
      }
      return geometry;
    },


    getOpacity: function() {
      var i, opacity = 0;
      for (i = 0; i < this.newSubLayers.length; i++) {
        if (this.newSubLayers[i].layerObject.opacity) {
          opacity = this.newSubLayers[i].layerObject.opacity > opacity ? this.newSubLayers[i].layerObject.opacity : opacity;
        } else {
          return 1;
        }
      }
      return opacity;
    },


    setOpacity: function(opacity) {
      array.forEach(this.newSubLayers, function(subLayer) {
        if (subLayer.layerObject.setOpacity) {
          subLayer.layerObject.setOpacity(opacity);
        }
      });
    },


    moveLeftOfIndex: function(index) {
      this.map.reorderLayer(this.layerObject, index);
    },

    moveRightOfIndex: function(index) {
      this.map.reorderLayer(this.layerObject, index);
    },



    /*
    _onSubLayerVisibleChange: function(subLayerInfo, visibleFlage, visible) {
      if(this.responseVisibleChangeFlag) {
        subLayerInfo.visible = visible;
        if(visible && this.originOperLayer.featureCollection) {
          this.visible = visible;
        }
      } 
      this.responseVisibleChage = true;
    },*/

    // new section--------------------------------------------------------------------

    _obtainLegendInfos: function( /*operLayer*/ ) {
      return [];
    },

    obtainNewSubLayers: function( /*operLayer*/ ) {
      var newSubLayers = [];
      return newSubLayers;

    },

    fold: function(imageShowLegendNode, foldUrl) {
      if (this.isFold) {
        //unfold
        domStyle.set(this.layerNode.subNode, 'display', 'block');
        this.isFold = false;
        //domClass.add(imageShowLegendNode, "layers-list-imageShowLegend-down");
        domAttr.set(imageShowLegendNode, 'src', foldUrl + 'images/v.png');
      } else {
        //fold
        domStyle.set(this.layerNode.subNode, 'display', 'none');
        this.isFold = true;
        //domClass.remove(imageShowLegendNode, "layers-list-imageShowLegend-down");
        domAttr.set(imageShowLegendNode, 'src', foldUrl + 'images/v_right.png');
      }
    },

    getLegendsNode: function() {
      //return lang.clone(this.legendsNode);
      return this.legendsNode;
    }

  });
});
