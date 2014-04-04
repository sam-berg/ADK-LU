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
    'jimu/BaseWidget',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom',
    'dojo/on',
    'dojo/_base/unload',
    'dojo/aspect',
    'dojo/query',
    'jimu/dijit/Selectionbox',
    './LayerListView',
    './PopupMenu',
    'dojo/dom-style',
    './NlsStrings',
    './LayerInfos'
  ],
  function(BaseWidget, declare, lang, array, domConstruct, domGeometry, dom, on, baseUnload, aspect, query,
    Selectionbox, LayerListView, PopupMenu, domStyle, NlsStrings, LayerInfos) {
    var clazz = declare([BaseWidget], {
      //these two properties is defined in the BaseWiget 
      baseClass: 'jimu-widget-layerList',
      name: 'layerList',

      //layerListView: Object{}
      //  A module is responsible for show layers list
      layerListView: null,

      //operLayerInfos: Object{}
      //  operational layer infos
      operLayerInfos: null,

      startup: function() {
        NlsStrings.value = this.nls;
        // summary:
        //    this function will be called when widget is started.
        // description:
        //    according to webmap or basemap to create LayerInfos instance and initialize operLayerInfos 
        //    show layers list
        //    bind events of layerList and create popup menu.
        var mapLayers;
        if (this.map.itemId) {
          this.operLayerInfos = new LayerInfos(this.map.itemInfo.itemData.baseMap.baseMapLayers, this.map.itemInfo.itemData.operationalLayers, this.map);
        } else {
          mapLayers = this._obtainMapLayers();
          this.operLayerInfos = new LayerInfos(mapLayers.basemapLayers, mapLayers.operationalLayers, this.map);
        }

        this.showLayers();
        this.bindEvents();
        dom.setSelectable(this.layersSection, false);
      },

      destroy: function() {
        this._clearLayers();
        this.inherited(arguments);
      },

      _obtainMapLayers: function() {
        // summary:
        //    obtain basemap layers and operational layers if the map is not webmap.
        var basemapLayers = [],
          operLayers = [],
          layer;
        array.forEach(this.map.layerIds.concat(this.map.graphicsLayerIds), function(layerId) {
          layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          } else {
            basemapLayers.push({
              layerObject: layer,
              id: layer.id || " "
            });
          }
        }, this);
        return {
          basemapLayers: basemapLayers || [],
          operationalLayers: operLayers || []
        };
      },

      showLayers: function() {
        // summary:
        //    create a LayerListView module used to draw layers list in browser.
        this.layerListView = new LayerListView({
          operLayerInfos: this.operLayerInfos,
          layerListTable: this.layerListTable,
          layerListWidget: this,
          config: this.config
        }).placeAt(this.layerListTable);
      },

      _createPopupMenu: function() {
        // summary:
        //    popup menu is a dijit used to do some operations of layer
        this.popupMenu = new PopupMenu({
          layerListWidget: this
        });
        domConstruct.place(this.popupMenu.domNode, this.domNode);
      },


      moveUpLayer: function(id) {
        // summary:
        //    move up layer in layer list.
        // description:
        //    call the moveUpLayer method of LayerInfos to change the layer order in map, and update the data in LayerInfos
        //    then, change layerNodeTr and layerContentTr domNode
        var beChangedId = this.operLayerInfos.moveUpLayer(id);
        if(beChangedId) {
          this._exchangeLayerTrNode(beChangedId, id);
        }
      },

      moveDownLayer: function(id) {
        // summary:
        //    move down layer in layer list.
        // description:
        //    call the moveDownLayer method of LayerInfos to change the layer order in map, and update the data in LayerInfos
        //    then, change layerNodeTr and layerContentTr domNode
        var beChangedId = this.operLayerInfos.moveDownLayer(id);

        if(beChangedId) {
          this._exchangeLayerTrNode(id, beChangedId);
        }

      },


      // befor exchange:  id1 -> id2
      // after exchanged: id2 -> id1
      _exchangeLayerTrNode: function(id1, id2) {
        var layer1TrNode = query("tr[layerTrNodeId='" + id1 + "']", this.layerListTable)[0];
        //var layer1ContentTrNode = query("tr[layerContentTrNodeId='" + id1 + "']", this.layerListTable)[0];
        var layer2TrNode = query("tr[layerTrNodeId='" + id2 + "']", this.layerListTable)[0];
        var layer2ContentTrNode = query("tr[layerContentTrNodeId='" + id2 + "']", this.layerListTable)[0];
        // change layerTr
        this.layerListTable.removeChild(layer2TrNode);
        this.layerListTable.insertBefore(layer2TrNode, layer1TrNode);
        // change LayerContentTr
        this.layerListTable.removeChild(layer2ContentTrNode);
        this.layerListTable.insertBefore(layer2ContentTrNode, layer1TrNode);
      },

      _clearLayers: function() {
        // summary:
        //    clear layer list 
        domConstruct.empty(this.layerListTable);
      },

      _createEmptyRow: function() {
        // summary:
        //    the purpose is layer list format 
        var node = domConstruct.create('tr', {
          'class': 'jimu-widget-row-selected'
        }, this.layerListTable);

        domConstruct.create('td', {
          'class': 'col col-showLegend'
        }, node);
        domConstruct.create('td', {
          'class': 'col-select'
        }, node);

        domConstruct.create('td', {
          'class': 'col-layer-label'
        }, node);
        domConstruct.create('td', {
          'class': 'col col-popupMenu'
        }, node);
      },

      bindEvents: function() {
        // summary:
        //    bind events are listened by this module
        var handleRemove, handleRemoves;
        this.own(aspect.after(this.map, "onLayerAddResult", lang.hitch(this, this._onLayersChange)));
        handleRemove = aspect.after(this.map, "onLayerRemove", lang.hitch(this, this._onLayersChange));
        this.own(handleRemove);
        //aspect.after(this.map, "onLayerReorder", lang.hitch(this, this._onLayersChange));
        this.own(aspect.after(this.map, "onLayersAddResult", lang.hitch(this, this._onLayersChange)));
        handleRemoves =  aspect.after(this.map, "onLayersRemoved", lang.hitch(this, this._onLayersChange));
        this.own(handleRemoves);
        //aspect.after(this.map, "onLayersReorder", lang.hitch(this, this._onLayersChange));

        baseUnload.addOnUnload(function(){
          handleRemove.remove();
          handleRemoves.remove();
        });
      },

      _onLayersChange: function(evt) {
        /*jshint unused: false*/
        // summary:
        //    response to any layer change.
        // description:
        //    udate LayerInfos data, cleare layer list and redraw
        this.operLayerInfos.update();
        this._clearLayers();
        this.showLayers();
      }

    });
    //clazz.hasConfig = false;
    return clazz;
  });
