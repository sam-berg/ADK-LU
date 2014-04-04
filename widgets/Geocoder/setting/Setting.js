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
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'dijit/form/ValidationTextBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Table) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-geocoder-setting',

      startup: function() {
        this.inherited(arguments);
        if (!this.config.geocoder) {
          this.config.geocoder = {};
        }
        if (!this.config.geocoder.arcgisGeocoder) {
          this.config.geocoder.arcgisGeocoder = {};
        }

        var fields = [{
          name: 'url',
          title: 'Url',
          type: 'text',
          editable: true,
          unique: true
        }, {
          name: 'name',
          title: this.nls.name,
          type: 'text',
          editable: true,
          unique: true
        }, {
          name: 'singleLineFieldName',
          title: this.nls.singleLineFieldName,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['up', 'down', 'delete']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableGeocoders);
        this.displayFieldsTable.startup();
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if (config.geocoder.arcgisGeocoder.placeholder) {
          this.placeholder.set('value', config.geocoder.arcgisGeocoder.placeholder);
        }
        this.displayFieldsTable.clear();
        if (config.geocoder.geocoders) {
          var json = [];
          var len = config.geocoder.geocoders.length;
          for (var i = 0; i < len; i++) {
            json.push({
              url: config.geocoder.geocoders[i].url,
              name: config.geocoder.geocoders[i].name,
              singleLineFieldName: config.geocoder.geocoders[i].singleLineFieldName
            });
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      add: function() {
        var json = {};
        json.url = this.url.value;
        json.name = this.name.value;
        json.singleLineFieldName = this.singleLineFieldName.value;
        if (!json.url || !json.name || !json.singleLineFieldName) {
          alert(this.nls.warning);
          return;
        }
        this.displayFieldsTable.addRow(json);
      },

      getConfig: function() {
        this.config.geocoder.arcgisGeocoder.placeholder = this.placeholder.value;
        var data = this.displayFieldsTable.getData();
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          json.push(data[i]);
        }
        this.config.geocoder.geocoders = json;
        return this.config;
      }

    });
  });