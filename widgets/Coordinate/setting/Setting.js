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
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'dojo/query',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/Message',
    'dojo/text!./wkid.json',
    'dojo/text!./transform.json',
    'dijit/form/Button',
    'dijit/form/ValidationTextBox',
    'dijit/form/NumberTextBox'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    query,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    Table,
    Message,
    wkids,
    transforms) {

    try{
      var spatialRefs = JSON.parse(wkids);
      var datumTrans = JSON.parse(transforms);
    }catch(err){
      throw err;
    }

    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-coordinate-setting',
      beforeChangeData: null,

      postCreate: function(){
        this.inherited(arguments);

        this.own(on(this.wkid, 'Change', lang.hitch(this, this.onWkidChange)));
        this.own(on(this.transformationWkid, 'Change', lang.hitch(this, this.ontfWkidChange)));
      },

      startup: function() {
        this.inherited(arguments);

        var fields = [{
          name: 'wkid',
          title: this.nls.wkid,
          type: 'text',
          'class': "wkid",
          unique: true,
          editable: true
        }, {
          name: 'label',
          title: this.nls.label,
          type: 'text',
          unique: true,
          editable: true
        }, {
          name: 'transformationWkid',
          title: this.nls.transformationWkid,
          type: 'text',
          'class': 'transformationWkid',
          editable: true
        }, {
          name: 'transformationLabel',
          title: this.nls.transformationLabel,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          'class': "actions",
          actions: ['up', 'down', 'delete']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableCoordinate);
        this.displayFieldsTable.startup();
        this.setConfig(this.config);

        this.own(query('.editable-input', this.displayFieldsTable.domNode).on('change', lang.hitch(this, 'onTableCellChange')));
        this.own(query('.editable-input', this.displayFieldsTable.domNode).on('focus', lang.hitch(this, 'onTableCellFocus')));
      },

      setConfig: function(config) {
        this.config = config;
        this.displayFieldsTable.clear();
        if (!config.outputunit) {
          config.outputunit = "geo";
        }
        this.selectOutputunit.set('value', config.outputunit);
        if (config.spatialReferences) {
          var json = [];
          var len = config.spatialReferences.length;
          for (var i = 0; i < len; i++) {
            json.push({
              wkid: config.spatialReferences[i].wkid,
              label: config.spatialReferences[i].label,
              transformationWkid: config.spatialReferences[i].transformationWkid,
              transformationLabel: config.spatialReferences[i].transformationLabel
            });
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      add: function() {
        var json = {};
        json.wkid = this.wkid.value;
        json.label = this.label.value;
        json.transformationWkid = this.transformationWkid.value;
        json.transformationLabel = this.transformationLabel.value;
        if (!json.wkid || !json.label) {
          alert(this.nls.warning);
          return;
        }
        var status = this.displayFieldsTable.addRow(json);
        if (!status.success) {
          alert(status.errorMessage);
        }
      },

      getConfig: function() {
        this.config.outputunit = this.selectOutputunit.value;

        var data = this.displayFieldsTable.getData();
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          json.push(data[i]);
        }
        this.config.spatialReferences = json;
        return this.config;
      },

      onTableCellFocus: function(evt){
        if (evt && evt.target && evt.target.value){
          var tr = evt.target.parentNode.parentNode;
          this.beforeChangeData = this.displayFieldsTable.getRowData(tr);
        }
      },

      onTableCellChange: function(evt){
        if (evt && evt.target && evt.target.value){
          var idTd = evt.target.parentNode;
          var newValue = parseInt(evt.target.value, 10);

          if (idTd && html.hasClass(idTd, 'wkid')){
            var i = 0, wkid = 0, label = "";
            if ((i = array.indexOf(spatialRefs.wkid, newValue)) > -1) {
              wkid = newValue;
              label = spatialRefs.label[i];

              this.displayFieldsTable.editRow(idTd.parentNode, {
                "wkid": wkid,
                "label": label
              });
            }else {
              new Message({
                message: this.nls.tfWarning
              });

              this.displayFieldsTable.editRow(idTd.parentNode, this.beforeChangeData);
              return;
            }
          }

          if (idTd && html.hasClass(idTd, 'transformationWkid')){
            var j = 0, tfid = 0, tflabel = "";
            if ((j = array.indexOf(datumTrans.tfWkid, newValue)) > -1) {
              tfid = newValue;
              tflabel = datumTrans.label[j];

              this.displayFieldsTable.editRow(idTd.parentNode, {
                "transformationWkid": tfid,
                "transformationLabel": tflabel
              });
            }else {
              new Message({
                message: this.nls.tfWarning
              });
              this.displayFieldsTable.editRow(idTd.parentNode, this.beforeChangeData);
              return;
            }
          }
        }
      },

      onWkidChange: function(newValue) {
        if (newValue){
          var i = 0,
          wkid = "",
          label = "";
          newValue = parseInt(newValue, 10);
          if ((i = array.indexOf(spatialRefs.wkid, newValue)) > -1) {
            wkid = newValue;
            label = spatialRefs.label[i];
          }else {
            new Message({
              message: this.nls.warning + "<a target='blank' href='https://developers.arcgis.com/javascript/jshelp/ref_coordsystems.html'>wkid</a>"
            });
          }
          this.wkid.set('value', wkid);
          this.label.set('value' ,label);
        }
      },

      ontfWkidChange: function(newValue) {
        if (newValue) {
          var i = 0,
          tfid = "",
          label = "";
          newValue = parseInt(newValue, 10);
          if ((i = array.indexOf(datumTrans.tfWkid, newValue)) > -1) {
            tfid = newValue;
            label = datumTrans.label[i];
          }else {
            new Message({
              message: this.nls.tfWarning + "<a target='blank' href='http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000r8000000'>Datum transformations</a>"
            });
          }
          this.transformationWkid.set('value' ,tfid);
          this.transformationLabel.set('value' ,label);
        }
      }
    });
  });