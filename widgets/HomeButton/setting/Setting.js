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
    'dojo/_base/lang',
    'dojo/on',
    'esri/SpatialReference',
    "esri/geometry/Extent",
    'jimu/BaseWidgetSetting',
    'jimu/dijit/ExtentChooser',
    'jimu/dijit/CheckBox',
    'dijit/form/RadioButton'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    lang,
    on,
    SpatialReference,
    Extent,
    BaseWidgetSetting,
    ExtentChooser,
    CheckBox) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-homebutton-setting',
      extentChooser: null,
      firstExtent: null,
      useDefault: false,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.homeButton) {
          this.config.homeButton = {};
        }

        this.extentChooser = new ExtentChooser({
          itemId: this.appConfig.map.itemId,
          initExtent: this._getInitialExtent()
        }, this.extentChooserNode);

        this.useDefaultExtent = new CheckBox({
          label: this.nls.check,
          checked: true
        }, this.useDefaultExtent);

        this.own(on(this.useDefaultExtent, "click", lang.hitch(this, this.clickCheckBox)));
        this.own(on(this.extentChooser, 'extentChange', lang.hitch(this, this.onExtentChanged)));
        this.setConfig(this.config);
      },

      _getInitialExtent: function(){
        var extent = null;
        if (this.config && this.config.homeButton && this.config.homeButton.extent){
          extent = new Extent(this.config.homeButton.extent);
        }else if (this.appConfig && this.appConfig.map && this.appConfig.map.mapOptions && this.appConfig.map.mapOptions.extent){
          extent = new Extent(this.appConfig.map.mapOptions.extent);
        }

        return extent;
      },

      _getDefaultExtent: function(){
        var extent = null;
        if (this.appConfig && this.appConfig.map && this.appConfig.map.mapOptions && this.appConfig.map.mapOptions.extent){
          extent = new Extent(this.appConfig.map.mapOptions.extent);
        }else if (this.firstExtent){
          extent = this.firstExtent;
        }else if (this.map && this.map.extent){
          extent = this.map.extent;
        }

        return extent;
      },

      clickCheckBox: function() {
        if (this.useDefaultExtent.checked) {
          if(this.extentChooser.map&&this.firstExtent){
            this.extentChooser.map.setExtent(this._getDefaultExtent());
          }
          this.useDefault = true;
        }else{
          this.useDefault = false;
        }
      },

      onExtentChanged: function(extent) {
        if (!this.firstExtent){
          this.firstExtent = extent;
        }else{
          if (!this.useDefault){
            this.useDefaultExtent.setValue(false);
          }else {
            this.useDefaultExtent.setValue(true);
            this.useDefault = false;
          }
        }
      },

      setConfig: function(config){
        this.config = config;
        if (config.homeButton.extent) {
          this.useDefaultExtent.setValue(false);
        } else {
          this.useDefaultExtent.setValue(true);
        }
      },

      getConfig: function() {
        if (this.extentChooser.map && !this.useDefaultExtent.checked){
          this.config.homeButton.extent = this.extentChooser.map.extent.toJson();
        }else{
          this.config.homeButton.extent = null;
        }
        return this.config;
      }
    });
  });