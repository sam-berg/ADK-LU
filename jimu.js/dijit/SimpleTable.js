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

define(['dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/on',
    'dojo/query',
    "dojo/mouse"
  ],
  function(declare, _WidgetBase, _TemplatedMixin, lang, html, array, on, query, mouse) {
    return declare([_WidgetBase, _TemplatedMixin], {
      baseClass: 'jimu-simple-table',
      templateString: '<div>' +
        '<div class="head-section" data-dojo-attach-point="headDiv"></div>' +
        '<div class="body-section" data-dojo-attach-point="bodyDiv">' +
        '<table class="table" data-dojo-attach-point="table" cellspacing="0" onselectstart="return false;">' +
        '<thead class="simple-table-thead" data-dojo-attach-point="thead"></thead>' +
        '<tbody class="simple-table-tbody" data-dojo-attach-point="tbody"></tbody>' +
        '</table>' +
        '</div>' +
        '</div>',
      _name: null,
      selectable: false,
      maxHeight: '',
      fields: null,
      _rowIndex: 0,
      //name:field name
      //title:field title
      //type:text radio checkbox actions empty
      //class:class name of th and td
      //if text
      //editable:the text can be edited if true.
      //unique:field value is unique in the column.
      //if actions
      //actions:['up','down','edit','delete']

      postCreate: function() {
        this.inherited(arguments);
        this._initSelf();
      },

      startup: function() {
        this.inherited(arguments);
        this._updateHeadDiv();
      },

      _updateHeadDiv: function() {
        html.empty(this.headDiv);
        var table = lang.clone(this.table);
        var radios = query("input[type=radio]", table);
        var random = 0;
        array.forEach(radios, function(radio) {
          radio.name = "" + random;
        });
        html.place(table, this.headDiv);
      },

      _initSelf: function() {
        html.setStyle(this.bodyDiv, 'maxHeight', this.maxHeight);

        var num = Math.random().toString();
        this._name = 'jimu_table_' + num.slice(2, num.length);
        this.thead = query('thead', this.domNode)[0];
        this.tbody = query('tbody', this.domNode)[0];

        if (this.fields instanceof Array) {
          var tr = html.create('tr', {}, this.thead);

          array.forEach(this.fields,lang.hitch(this,function(item){
            var th = html.create('th', {
              innerHTML: item.title,
              title: item.title
            }, tr);
            if (item.type === 'actions') {
              item.name = 'actions';
              // var width = this._calculateActionsWidth(item) + 'px';
              // html.setStyle(th,'width',width);
            }
            
            if (item['class']) {
              html.addClass(th, item['class']);
            }
          }));

          this.addEmptyRow();
        } else {
          this.fields = null;
        }
      },

      clear: function() {
        var trs = this._getNotEmptyRows();
        html.empty(this.tbody);
        this.addEmptyRow();
        this._updateHeadDiv();
        array.forEach(trs, lang.hitch(this, function(tr) {
          this.onDelete(tr);
        }));
        this._rowIndex = 0;
        this.onClear(trs);
      },

      clearEmptyRows: function() {
        var trs = this._getEmptyRows();
        array.forEach(trs, lang.hitch(this, function(tr) {
          html.destroy(tr);
        }));
        this._updateHeadDiv();
      },

      addEmptyRow: function() {
        if (!this.fields) {
          return;
        }

        this.clearEmptyRows();
        var length = this.fields.length;
        var tr = html.create('tr', {
          'class': 'simple-table-tr empty'
        }, this.tbody);
        for (var i = 0; i < length; i++) {
          html.create('td', {
            'class': 'simple-table-td empty-td'
          }, tr);
        }
        this._setRowOdevity();
      },

      addRows: function(rowsData) {
        var results = [];
        if (this.fields && rowsData instanceof Array) {
          array.forEach(rowsData, lang.hitch(this, function(item) {
            results.push(this.addRow(item));
          }));
        }
        this._updateHeadDiv();
        return results;
      },

      //example:{name1:value1,name2:value2...}
      addRow: function(rowData) {
        this._rowIndex++;
        var result = {
          success: false,
          tr: null,
          errorMessage: null
        };
        if (!this.fields || (typeof rowData !== 'object')) {
          return result;
        }

        var uniqueFieldMetas = array.filter(this.fields, lang.hitch(this, function(item) {
          return item.type === 'text' && item.unique === true;
        }));

        var repeat = array.some(uniqueFieldMetas, lang.hitch(this, function(item) {
          var sameValueRows = this.getRowDataArrayByFieldValue(item.name, rowData[item.name]);
          return sameValueRows.length > 0;
        }));

        if (repeat) {
          result.errorMessage = "repeating data";
          return result;
        }

        this.clearEmptyRows();
        var tr = html.create("tr", {
          'class': "simple-table-tr"
        }, this.tbody);
        var rowId = 'row'+this._rowIndex;
        html.setAttr(tr,'rowId',rowId);
        if (this.selectable) {
          this.own(on(tr, 'click', lang.hitch(this, function() {
            var trs = query('.simple-table-tr', this.tbody);
            trs.removeClass('selected');
            html.addClass(tr, 'selected');
            this.onSelect(tr);
          })));
          this.own(on(tr, 'dblclick', lang.hitch(this, function(tr) {
            this.onDblClick(tr);
          })));
        }
        array.forEach(this.fields, lang.hitch(this, function(fieldMeta) {
          var fieldData = rowData[fieldMeta.name];
          var type = fieldMeta.type;
          if (type === 'actions') {
            this._createActionsTd(tr, fieldMeta);
          } else {
            if (type === "text") {
              this._createTextTd(tr, fieldMeta, fieldData);
            } else if (type === "radio") {
              this._createRadioTd(tr, fieldMeta, fieldData);
            } else if (type === 'checkbox') {
              this._createCheckboxTd(tr, fieldMeta, fieldData);
            } else if (type === "empty") {
              this._createEmptyTd(tr, fieldMeta);
            }
          }
        }));
        this._setRowOdevity();
        this._updateHeadDiv();
        result.success = true;
        result.tr = tr;
        result.errorMessage = null;
        this.onAdd(tr);
        return result;
      },

      deleteRow:function(tr){
        if(tr){
          html.destroy(tr);
          this._setRowOdevity();
          this._updateHeadDiv();
          this.onDelete(tr);
        }
      },

      _setRowOdevity: function() {
        var trs = query('.simple-table-tr', this.tbody);
        trs.removeClass('odd');
        trs.removeClass('even');
        array.forEach(trs, lang.hitch(this, function(tr, index) {
          if (index % 2 === 0) {
            html.addClass(tr, 'odd');
          } else {
            html.addClass(tr, 'even');
          }
        }));
      },

      _createTextTd: function(tr, fieldMeta, fieldData) {
        if (fieldMeta.editable) {
          this._createEditableTextTd(tr, fieldMeta, fieldData);
        } else {
          this._createNormalTextTd(tr, fieldMeta, fieldData);
        }
      },

      _createNormalTextTd: function(tr, fieldMeta, fieldData) {
        var td = html.create('td', {
          'class': fieldMeta.name,
          innerHTML: fieldData || ""
        }, tr);
        html.addClass(td, 'normal-text-td');
        html.addClass(td, 'simple-table-td');
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
      },

      _createEditableTextTd: function(tr, fieldMeta, fieldData) {
        var tdStr = '<td class="editable-text-td ' + fieldMeta.name + '"><div class="editable-div"></div><input class="editable-input" type="text" style="display:none;" /></td>';
        var td = html.toDom(tdStr);
        html.addClass(td, 'simple-table-td');
        html.place(td, tr);
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
        var editableDiv = query('div', td)[0];
        var editableInput = query('input', td)[0];
        editableDiv.innerHTML = fieldData || "";
        if (editableDiv.innerHTML !== "") {
          editableDiv.title = editableDiv.innerHTML;
        }
        editableInput.value = editableDiv.innerHTML;
        this.own(on(editableDiv, 'dblclick', lang.hitch(this, function(event) {
          event.stopPropagation();
          editableInput.value = editableDiv.innerHTML;
          html.setStyle(editableDiv, 'display', 'none');
          html.setStyle(editableInput, 'display', 'inline');
          editableInput.focus();
          this._updateHeadDiv();
        })));
        this.own(on(editableInput, 'blur', lang.hitch(this, function() {
          editableInput.value = lang.trim(editableInput.value);
          var oldValue = editableDiv.innerHTML;
          var newValue = editableInput.value;
          if (newValue !== '') {
            if (fieldMeta.unique) {
              var sameValueRows = this.getRowDataArrayByFieldValue(fieldMeta.name, newValue, tr);
              if (sameValueRows.length > 0) {
                editableInput.value = oldValue;
              } else {
                editableDiv.innerHTML = newValue;
              }
            } else {
              editableDiv.innerHTML = newValue;
            }
          } else {
            editableInput.value = oldValue;
          }

          html.setStyle(editableInput, 'display', 'none');
          html.setStyle(editableDiv, 'display', 'block');
          this._updateHeadDiv();
        })));
      },

      _createRadioTd: function(tr, fieldMeta, fieldData) {
        var tdStr = '<td class="radio-td ' + fieldMeta.name + '"><input type="radio" /></td>';
        var td = html.toDom(tdStr);
        html.addClass(td, 'simple-table-td');
        html.place(td, tr);
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
        var radio = query('input', td)[0];
        if (fieldMeta.radio && fieldMeta.radio === "row") {
          radio.name = this._name + this._rowIndex;
        } else {
          radio.name = this._name + fieldMeta.name;
        }

        radio.checked = fieldData === true;
      },

      _createCheckboxTd: function(tr, fieldMeta, fieldData) {
        var tdStr = '<td class="checkbox-td ' + fieldMeta.name + '"><input type="checkbox" /></td>';
        var td = html.toDom(tdStr);
        html.addClass(td, 'simple-table-td');
        html.place(td, tr);
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
        var checkbox = query('input', td)[0];
        checkbox.checked = fieldData === true;
      },

      _createActionsTd: function(tr, fieldMeta) {
        var tdStr = '<td class="actions-td"><div class="action-item-parent"></div></td>';
        var td = html.toDom(tdStr);
        html.addClass(td, 'simple-table-td');
        var actionItemParent = query(".action-item-parent", td)[0];
        html.place(td, tr);
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
        array.forEach(fieldMeta.actions, lang.hitch(this, function(item) {
          if (item === 'up') {
            var moveupDiv = html.create('div', {
              'class': 'action-item row-up-div'
            }, actionItemParent);
            this.own(on(moveupDiv, 'click', lang.hitch(this, function(event) {
              event.stopPropagation();
              var trs = query('.simple-table-tr', this.tbody);
              var index = array.indexOf(trs, tr);
              if (index > 0) {
                var newIndex = index - 1;
                var trRef = trs[newIndex];
                if (trRef) {
                  html.place(tr, trRef, 'before');
                }
              }
              this._setRowOdevity();
              this._updateHeadDiv();
            })));
          } else if (item === 'down') {
            var movedownDiv = html.create('div', {
              'class': 'action-item row-down-div'
            }, actionItemParent);
            this.own(on(movedownDiv, 'click', lang.hitch(this, function(event) {
              event.stopPropagation();
              var trs = query('.simple-table-tr', this.tbody);
              var index = array.indexOf(trs, tr);
              if (index < trs.length - 1) {
                var newIndex = index + 1;
                var trRef = trs[newIndex];
                if (trRef) {
                  html.place(tr, trRef, 'after');
                }
              }
              this._setRowOdevity();
              this._updateHeadDiv();
            })));
          } else if (item === 'edit') {
            var editDiv = html.create('div', {
              'class': 'action-item row-edit-div'
            }, actionItemParent);
            this.own(on(editDiv, 'click', lang.hitch(this, function(event) {
              event.stopPropagation();
              this._updateHeadDiv();
              this.onEdit(tr);
            })));
            this.own(on(editDiv, mouse.enter, lang.hitch(this, function(event) {
              event.stopPropagation();
              this._updateHeadDiv();
              this.onMouseover(tr);
            })));
          } else if (item === 'delete') {
            var deleteDiv = html.create('div', {
              'class': 'action-item row-delete-div'
            }, actionItemParent);
            this.own(on(deleteDiv, 'click', lang.hitch(this, function(event) {
              event.stopPropagation();
              html.destroy(tr);
              this._setRowOdevity();
              this._updateHeadDiv();
              this.onDelete(tr);
            })));
          }
        }));
        var width = this._calculateActionsWidth(fieldMeta) + 'px';
        html.setStyle(actionItemParent,'width',width);
      },

      _calculateActionsWidth:function(fieldMeta){
        var items = array.map(fieldMeta.actions,function(item){
          return item === 'up' || item === 'down' || item === 'edit' || item === 'delete';
        });
        var width = items.length * 20;
        return width;
      },

      _createEmptyTd: function(tr, fieldMeta) {
        var td = html.create('td', {
          'class': fieldMeta.name
        }, tr);
        html.addClass(td, 'simple-table-td');
        html.addClass(td, 'empty-text-td');
        if (fieldMeta['class']) {
          html.addClass(td, fieldMeta['class']);
        }
      },

      editRow: function(tr, rowData) {
        var result = {
          success: false,
          tr: null,
          errorMessage: null
        };
        if (!this.fields || (typeof rowData !== 'object')) {
          return result;
        }
        if (!html.isDescendant(tr, this.tbody)) {
          return result;
        }
        var uniqueFieldMetas = array.filter(this.fields, lang.hitch(this, function(item) {
          return item.type === 'text' && item.unique === true;
        }));

        var repeat = array.some(uniqueFieldMetas, lang.hitch(this, function(item) {
          var sameValueRows = this.getRowDataArrayByFieldValue(item.name, rowData[item.name], tr);
          return sameValueRows.length > 0;
        }));

        if (repeat) {
          result.errorMessage = "repeating data";
          return result;
        }
        var tds = query('.simple-table-td', tr);
        array.forEach(this.fields, lang.hitch(this, function(fieldMeta, idx) {
          if (!rowData.hasOwnProperty(fieldMeta.name)) {
            return;
          }
          var td = tds[idx];
          var fieldData = rowData[fieldMeta.name];
          var type = fieldMeta.type;
          if (type === 'text') {
            if (fieldMeta.editable) {
              this._editEditableText(td, fieldMeta, fieldData);
            } else {
              this._editNormalText(td, fieldMeta, fieldData);
            }
          } else if (type === 'radio') {
            this._editRadio(td, fieldMeta, fieldData);
          } else if (type === 'checkbox') {
            this._editCheckbox(td, fieldMeta, fieldData);
          }
        }));
        result.success = true;
        result.tr = tr;
        result.errorMessage = null;
        this.onEdit(tr);
        return result;
      },

      _editNormalText: function(td, fieldMeta, fieldData) {
        td.innerHTML = fieldData || "";
      },

      _editEditableText: function(td, fieldMeta, fieldData) {
        var editableDiv = query('div', td)[0];
        editableDiv.innerHTML = fieldData || "";
        var editableInput = query('input', td)[0];
        editableInput.value = editableDiv.innerHTML;
      },

      _editRadio: function(td, fieldMeta, fieldData) {
        var radio = query('input', td)[0];
        radio.checked = fieldData === true;
      },

      _editCheckbox: function(td, fieldMeta, fieldData) {
        var checkbox = query('input', td)[0];
        checkbox.checked = fieldData === true;
      },

      _getNotEmptyRows: function() {
        var trs = query('.simple-table-tr', this.tbody);
        var result = array.filter(trs, lang.hitch(this, function(tr) {
          return !html.hasClass(tr, 'empty');
        }));
        return result;
      },

      _getEmptyRows: function() {
        var trs = query('.simple-table-tr', this.tbody);
        var result = array.filter(trs, lang.hitch(this, function(tr) {
          return html.hasClass(tr, 'empty');
        }));
        return result;
      },

      getRows: function() {
        return this._getNotEmptyRows();
      },

      getSelectedRow: function() {
        var result = null;
        var trs = query('.simple-table-tr', this.tbody);
        var filterTrs = array.filter(trs, lang.hitch(this, function(tr) {
          return !html.hasClass(tr, 'empty') && html.hasClass(tr, 'selected');
        }));
        if (filterTrs.length > 0) {
          result = filterTrs[0];
        }
        return result;
      },

      getSelectedRowData: function() {
        var result = null;
        var tr = this.getSelectedRow();
        if (tr) {
          result = this._getRowDataByTr(tr);
        }
        return result;
      },

      getData: function(/*optional*/ ignoredTr) {
        var trs = this._getNotEmptyRows();
        if(ignoredTr){
          trs = array.filter(trs,lang.hitch(this,function(tr){
            return tr !== ignoredTr;
          }));
        }
        var result = array.map(trs, lang.hitch(this, function(tr) {
          return this._getRowDataByTr(tr);
        }));
        return result;
      },

      getRowData: function(tr) {
        return this._getRowDataByTr(tr);
      },

      _getRowDataByTr: function(tr) {
        var rowData = null;
        if (tr) {
          rowData = {};
        } else {
          return null;
        }
        array.forEach(this.fields, lang.hitch(this, function(fieldMeta) {
          var type = fieldMeta.type;
          if (type === 'actions') {
            return;
          }
          var name = fieldMeta.name;
          rowData[name] = null;
          var td = query('.' + name, tr)[0];
          if (td) {
            if (type === 'text') {
              if (fieldMeta.editable) {
                var editableDiv = query('div', td)[0];
                rowData[name] = editableDiv.innerHTML;
              } else {
                rowData[name] = td.innerHTML;
              }
            } else if (type === 'radio') {
              var radio = query('input', td)[0];
              rowData[name] = radio.checked;
            } else if (type === 'checkbox') {
              var checkbox = query('input', td)[0];
              rowData[name] = checkbox.checked;
            }
          }
        }));
        return rowData;
      },

      getRowDataArrayByFieldValue: function(fieldName, fieldValue, /*optional*/ ignoredTr) {
        var result = [];
        if (!this.fields) {
          return [];
        }
        var validField = array.some(this.fields, lang.hitch(this, function(item) {
          return item.name === fieldName;
        }));
        if (!validField) {
          return [];
        }
        var rows = this.getData(ignoredTr);
        result = array.filter(rows, lang.hitch(this, function(row) {
          /* jshint eqeqeq: false*/
          return row[fieldName] == fieldValue;
        }));
        return result;
      },

      onDblClick: function(tr) {/*jshint unused: false*/},

      onSelect: function(tr) {/*jshint unused: false*/},

      onClear: function(trs) {/*jshint unused: false*/},

      onAdd: function(tr) {/*jshint unused: false*/},

      onEdit: function(tr) {/*jshint unused: false*/},

      onMouseover: function(tr) {/*jshint unused: false*/},

      onDelete: function(tr) {/*jshint unused: false*/}

    });
  });