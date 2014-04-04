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
  'dojo/dom-style',
  'dojo/dom-attr',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./PopupMenu.html',
  'dojo/on',
  'dojo/dom-geometry',
  'dojo/dom-class',
  'dojo/dom',
  'dijit/form/HorizontalSlider',
  'dijit/form/HorizontalRuleLabels',
  'esri/layers/FeatureLayer',
  'dojo/_base/lang'
], function(declare, array, domStyle, domAttr, _WidgetBase, _TemplatedMixin, template, on, domGeometry,
  domClass, dom, HorizSlider, HorzRuleLabels, FeatureLayer, lang) {
  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: template,
    baseClass: 'popup-menu',
    popupMenuIsShow: false,
    isShow: false,
    transWidgetIsShow: false,
    operLayerInfo: null,
    layerListWidget: null,
    position: null,
    transWidget: null,

    postCreate: function() {
      //create transparency
      this._createTransparencyWidget();
      this.hide();
      this.initDescription();
      this.initToAttributeTable();
    },

    _createTransparencyWidget: function() {
      this.transWidget = new HorizSlider({
        minimum: 0,
        maximum: 1,
        intermediateChanges: true
      }, this.transparencyBody);

      this.transWidget.on("change", lang.hitch(this, this._onTransparencyChange));
      new HorzRuleLabels({
        container: "bottomDecoration"
      }, this.transparencyRule);
    },

    refresh: function() {
      /*
      domStyle.set(this.popupMenuBody, {
        top: this.position.t + 13 + "px",
        left: this.position.l - domGeometry.getContentBox(this.popupMenuBody).w + 12 + 'px'
      });

      domStyle.set(this.transparencyDiv, {
        top: this.position.t + 13 + "px",
        left: this.position.l - domGeometry.getContentBox(this.popupMenuBody).w + 12 - 185 + 'px'
      });*/
      domStyle.set(this.popupMenuBody, {
        top: "13px",
        left: "-114px"
      });
      domStyle.set(this.transparencyDiv, {
        top: "37px",
        left: "-299px"
      });
      this.initMovedownOrMoveup();
    },

    initDescription: function() {
      domAttr.set(this.descriptionLink, 'innerHTML', this.operLayerInfo.popupMenuInfo.descriptionTitle);
      if(this.operLayerInfo.layerObject && this.operLayerInfo.layerObject.url) {
        domAttr.set(this.descriptionLink, 'href', this.operLayerInfo.layerObject.url);
      } else {
        domClass.add(this.descriptionLink, "popup-menu-row-dissable");
      }
    },

    initToAttributeTable: function() {
      if(!(this.operLayerInfo.layerObject instanceof FeatureLayer)) {
        domClass.add(this.toAttributeTable, "popup-menu-row-dissable");
      }
    },

    initMovedownOrMoveup: function() {
      domClass.remove(this.moveUp, "popup-menu-row-dissable");
      domClass.remove(this.moveDown, "popup-menu-row-dissable");
      if (this.operLayerInfo.isFirst) {
        domClass.add(this.moveUp, "popup-menu-row-dissable");
      }
      if (this.operLayerInfo.isLast) {
        domClass.add(this.moveDown, "popup-menu-row-dissable");
      }
    },

    show: function() {
      domStyle.set(this.popupMenuBody, "display", "block");
      this.isShow = true;
      this.refresh();
    },

    hide: function() {
      domStyle.set(this.popupMenuBody, "display", "none");
      this.isShow = false;
      this.hideTransWidget();
    },

    showTransWidget: function() {
      this.transWidget.set("value", 1 - this.operLayerInfo.getOpacity());
      domStyle.set(this.transparencyDiv, "display", "block");
      this.transWidgetIsShow = true;
    },

    hideTransWidget: function() {
      domStyle.set(this.transparencyDiv, "display", "none");
      this.transWidgetIsShow = false;
    },

    _onMenuClick: function(evt) {
      evt.stopPropagation();
    },

    _onZoomToClick: function() {
      //console.debug("zoomto click");
      this.operLayerInfo.map.setExtent(this.operLayerInfo.getExtent());
      this.hide();
    },

    _onZoomToMouseover: function() {
      //domClass.remove(this.zoomTo, "popup-menu-row");
      domClass.add(this.zoomTo, "popup-menu-row-selected");
    },

    _onZoomToMouseout: function() {
      domClass.remove(this.zoomTo, "popup-menu-row-selected");
      //domClass.add(this.zoomTo, "popup-menu-row");
    },

    _onTransparencyClick: function() {
      //console.debug("Transparency click");
      if (this.transWidgetIsShow) {
        this.hideTransWidget();
      } else {
        this.showTransWidget();
      }
    },

    _onTransparencyChange: function(newValue) {
      //console.debug("transparency value chagen");
      this.operLayerInfo.setOpacity(1 - newValue);
    },

    _onTransparencyMouseover: function() {
      //domClass.remove(this.transparency, "popup-menu-row");
      domClass.add(this.transparency, "popup-menu-row-selected");
    },

    _onTransparencyMouseout: function() {
      domClass.remove(this.transparency, "popup-menu-row-selected");
      //domClass.add(this.transparency, "popup-menu-row");
    },

    _onMoveUpClick: function() {
      //console.debug(" moveup click");
      if (!this.operLayerInfo.isFirst) {
        this.layerListWidget.moveUpLayer(this.operLayerInfo.id);
        this.hide();
      }
    },

    _onMoveUpMouseover: function() {
      //domClass.remove(this.moveUp, "popup-menu-row");
      domClass.add(this.moveUp, "popup-menu-row-selected");
    },

    _onMoveUpMouseout: function() {
      domClass.remove(this.moveUp, "popup-menu-row-selected");
      //domClass.add(this.moveUp, "popup-menu-row");
    },

    _onMoveDownClick: function() {
      //console.debug("movedown click");
      if (!this.operLayerInfo.isLast) {
        this.layerListWidget.moveDownLayer(this.operLayerInfo.id);
        this.hide();
      }
    },

    _onMoveDownMouseover: function() {
      //domClass.remove(this.moveDown, "popup-menu-row");
      domClass.add(this.moveDown, "popup-menu-row-selected");
    },

    _onMoveDownMouseout: function() {
      domClass.remove(this.moveDown, "popup-menu-row-selected");
      //domClass.add(this.moveDown, "popup-menu-row");
    },

    _onToAttributeTableClick: function() {
      if(this.operLayerInfo.layerObject instanceof FeatureLayer) {
        this.layerListWidget.publishData({
          'target': 'AttributeTable',
          'layer': this.operLayerInfo.layerObject
        });
        this.hide();
      }
    },

    _onToAttributeTableMouseover: function() {
      domClass.add(this.toAttributeTable, "popup-menu-row-selected");
    },

    _onToAttributeTableMouseout: function() {
      domClass.remove(this.toAttributeTable, "popup-menu-row-selected");
    },

    _onDescriptionClick: function() {
      //console.debug("download click");
    },

    _onDescriptionMouseover: function() {
      //domClass.remove(this.description, "popup-menu-row");
      domClass.add(this.description, "popup-menu-row-selected");
    },

    _onDescriptionMouseout: function() {
      domClass.remove(this.description, "popup-menu-row-selected");
      //domClass.add(this.description, "popup-menu-row");
    },

    clearColor: function() {
      domStyle.set(this.createFromHere, "background-color", this.itemDefaultColor);
      domStyle.set(this.remove, "background-color", this.itemDefaultColor);
      domStyle.set(this.duplicate, "background-color", this.itemDefaultColor);
      domStyle.set(this.download, "background-color", this.itemDefaultColor);
    },

    _onTransparencyDivClick: function(evt) {
      // summary:
      //    response to click transparency in popummenu.
      evt.stopPropagation();
    }


  });
});
