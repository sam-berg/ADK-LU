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
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-construct',
  'dojo/dom-geometry',
  'dojo/on',
  'dojo/aspect',
  'dojo/query',
  'jimu/dijit/CheckBox',
  'dijit/_TemplatedMixin',
  'dojo/text!./LayerListView.html',
  'esri/dijit/Legend',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-style',
  './PopupMenu',
  'dojo/topic'
], function(_WidgetBase, declare, lang, array, domConstruct, domGeometry, on, aspect, query,
  CheckBox, _TemplatedMixin, template, Legend, domAttr, domClass, domStyle, PopupMenu, topic) {

  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: template,

    postCreate: function() {
      array.forEach(this.operLayerInfos.finalLayerInfos, function(layerInfo) {
        this.drawListNode(layerInfo, 0, this.layerListTable, true);
      }, this);
    },

    drawListNode: function(layerInfo, level, toTableNode, hasPopupMenu) {
      if(layerInfo.newSubLayers.length === 0) {
        //addLayerNode
        layerInfo.layerNode = this.addLayerNode(layerInfo, level, toTableNode, hasPopupMenu);
        //add legend node
        if(this.config.showLegend) {
          this.addLegendNode(layerInfo, level, layerInfo.layerNode.subNode, hasPopupMenu);
        }
        return;
      }
      //addLayerNode
      layerInfo.layerNode = this.addLayerNode(layerInfo, level, toTableNode, hasPopupMenu);
      array.forEach(layerInfo.newSubLayers, lang.hitch(this ,function(level, subLayerInfo){
        this.drawListNode(subLayerInfo, level+1, layerInfo.layerNode.subNode);
      }, level));
    },

    addLayerNode: function(layerInfo, level, toTableNode, hasPopupMenu) {

      var layerTrNode = domConstruct.create('tr', {
        'class': 'jimu-widget-row layer-row ' + ( /*visible*/ false ? 'jimu-widget-row-selected' : ''),
        'layerTrNodeId': layerInfo.id
      }, toTableNode), layerTdNode, ckSelectDiv, ckSelect, imageShowLegendNode, imageNoLegendDiv, imageNoLegendNode, popupMenuNode, i, imageShowLegendDiv, popupMenu, divLabel;
  
      layerTdNode = domConstruct.create('td', {
        'class': 'col'
      }, layerTrNode);

      for (i = 0; i < level; i++) {
        domConstruct.create('div', {
          'class': 'begin-blank-div'
        }, layerTdNode);
      }


      imageShowLegendDiv = domConstruct.create('div', {
        'class': 'showLegend-div'
      }, layerTdNode);

      imageShowLegendNode = domConstruct.create('img', {
        'class': 'showLegend-image',
        'src': this.layerListWidget.folderUrl + 'images/v_right.png',
        'alt': 'l'
      }, imageShowLegendDiv);

      ckSelectDiv = domConstruct.create('div', {
        'class': 'div-select'
      }, layerTdNode);

      ckSelect = new CheckBox({
        checked: layerInfo.visible
      });
      domConstruct.place(ckSelect.domNode, ckSelectDiv);

      imageNoLegendDiv = domConstruct.create('div', {
        'class': 'noLegend-div'
      }, layerTdNode);

      imageNoLegendNode = domConstruct.create('img', {
        'class': 'noLegend-image',
        'src': this.layerListWidget.folderUrl + 'images/noLegend.png',
        'alt': 'l'
      }, imageNoLegendDiv);

      if(layerInfo.noLegend) {
        domStyle.set(imageShowLegendDiv, 'display', 'none');
        domStyle.set(imageShowLegendNode, 'display', 'none');
        domStyle.set(ckSelectDiv, 'display', 'none');
      } else {
        domStyle.set(imageNoLegendDiv, 'display', 'none');
      }

      divLabel = domConstruct.create('div', {
        'innerHTML': layerInfo.title,
        'class': 'div-content'
      }, layerTdNode);

      domStyle.set(divLabel, 'width', 263 - level*13 + 'px');

      if (hasPopupMenu) {
        popupMenuNode = domConstruct.create('div', {
          'class': 'layers-list-popupMenu-div'
        }, layerTdNode);

        popupMenu = new PopupMenu({
          layerListWidget: this.layerListWidget,
          operLayerInfo: layerInfo,
          nls: this.layerListWidget.nls
        });
        domConstruct.place(popupMenu.domNode, popupMenuNode);

        domConstruct.create('img', {
          'class': 'layers-list-popupMenu-image',
          'src': this.layerListWidget.folderUrl + '/images/v.png',
          'alt': 'l'
        }, popupMenuNode);
      }
      
      //add a tr node to toTableNode.
      var trNode = domConstruct.create('tr', {
        'class': '',
        'layerContentTrNodeId': layerInfo.id
      }, toTableNode);

      var tdNode = domConstruct.create('td', {
        'class': ''
      }, trNode);

      var tableNode = domConstruct.create('table', {
        'class': 'layer-sub-node'
      }, tdNode);

      //bind event
      this.own(on(layerTrNode, 'click', lang.hitch(this, this._onRowTrClick, layerInfo, imageShowLegendNode)));
      this.own(on(layerTrNode, 'mouseover', lang.hitch(this, this._onLayerNodeMouseover, layerTrNode, imageShowLegendNode, popupMenuNode)));
      this.own(on(layerTrNode, 'mouseout', lang.hitch(this, this._onLayerNodeMouseout, layerTrNode, imageShowLegendNode, popupMenuNode)));
      this.own(on(imageShowLegendDiv, 'click', lang.hitch(this, this._onImageShowLegendClick, layerInfo, imageShowLegendNode)));
      this.own(on(ckSelect.domNode, 'click', lang.hitch(this, this._onCkSelectNodeClick, layerInfo, ckSelect)));
      if(hasPopupMenu) {
        this.own(on(popupMenuNode, 'click', lang.hitch(this, this._onPopupMenuClick, layerInfo, popupMenu)));
        this.own(topic.subscribe("popupMenuAll/hide", lang.hitch(this, this._onPopupMenuHide, popupMenu)));
      }
      this.own(on(this.layerListWidget.domNode.parentNode, "click", lang.hitch(this, this._onLayerListWidgetPaneClick, popupMenu)));
      return {currentNode: layerTrNode, subNode: tableNode};
    },

    addLegendNode: function(layerInfo, level, toTableNode) {
      var legendsDiv;
      var legendTrNode = domConstruct.create('tr', {
        'class': 'legend-node-tr'
      }, toTableNode), legendTdNode;
  
      legendTdNode = domConstruct.create('td', {
        'class': 'legend-node-td'
      }, legendTrNode);
      
/*
      array.forEach(layerInfo.legendInfos, function(legendInfo){
        var i;
        for (i = 0; i < level+1; i++) {
          domConstruct.create('div', {
            'class': 'begin-blank-div'
          }, legendTdNode);
        }
        domConstruct.place(legendInfo.legendDiv, legendTdNode);
      }, this);
*/
      legendsDiv = layerInfo.getLegendsNode();
      domStyle.set(legendsDiv, 'margin-left', (level+1)*12 + 'px');
      domConstruct.place(legendsDiv, legendTdNode);
    },

    _onImageShowLegendClick: function(layerInfo, imageShowLegendNode, evt) {
      layerInfo.fold(imageShowLegendNode, this.layerListWidget.folderUrl);
      if(evt) {
        evt.stopPropagation();
      }
      
    },

    _onCkSelectNodeClick: function(layerInfo, ckSelect, evt) {
      if (ckSelect.checked) {
        layerInfo.setTopLayerVisible(true);
      } else {
        layerInfo.setTopLayerVisible(false);
      }
      evt.stopPropagation();
    },

    _onPopupMenuClick: function(layerInfo, popupMenu, evt) {
      if (popupMenu.isShow) {
        if (popupMenu) {
          popupMenu.hide();
        }
      } else {
        topic.publish("popupMenuAll/hide");
        if (popupMenu) {
          //popupMenu.set("operLayerInfo", layerInfo);
          //popupMenu.set("layerListWidget", this.layerListWidget);
          popupMenu.show();
        }
      }
      evt.stopPropagation();
    },

    _onLayerNodeMouseover: function(layerTrNode, imageShowLegendNode, popupMenuNode) {
      domClass.add(layerTrNode, "layer-row-mouseover");
      if (popupMenuNode) {
        domClass.add(imageShowLegendNode, "layers-list-imageShowLegend-down-div");
        domClass.add(popupMenuNode, "layers-list-popupMenu-div-selected");
      }
    },

    _onLayerNodeMouseout: function(layerTrNode, imageShowLegendNode, popupMenuNode) {
      domClass.remove(layerTrNode, "layer-row-mouseover");
      if (popupMenuNode) {
        domClass.remove(imageShowLegendNode, "layers-list-imageShowLegend-down-div");
        domClass.remove(popupMenuNode, "layers-list-popupMenu-div-selected");
      }
    },

    _onPopupMenuHide: function(popupMenu) {
      if (popupMenu) {
        popupMenu.hide();
      }
    },

    _onLayerListWidgetPaneClick: function(popupMenu) {
      if (popupMenu) {
        popupMenu.hide();
      }
    },

    _onRowTrClick: function(layerInfo, imageShowLegendNode) {
      this._onImageShowLegendClick(layerInfo, imageShowLegendNode);
    }


  });
});
