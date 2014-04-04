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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/SymbolChooser.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/query',
  'dojox/gfx',
  'dojo/_base/Color',
  'dijit/form/Select',
  'dijit/form/NumberSpinner',
  'jimu/dijit/ColorPicker',
  'esri/request',
  'esri/symbols/jsonUtils',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/CartographicLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/TextSymbol',
  'esri/symbols/Font',
  'dojo/i18n'
],
function(declare, _WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin, template, lang, html, array, on, query,gfx,Color,Select,ColorPicker,NumberSpinner,
  esriRequest,jsonUtils,SimpleMarkerSymbol,PictureMarkerSymbol,SimpleLineSymbol,CartographicLineSymbol,SimpleFillSymbol,TextSymbol,Font,i18n) {
  return declare([_WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin], {
    templateString:template,
    baseClass: 'jimu-symbol-chooser',
    symbol:null,
    type:null,//available values:marker,line,fill,text
    nls:null,
    _pointEventsBinded:false,
    _lineEventBinded:false,
    _fillEventBinded:false,
    _textEventBinded:false,
    _invokeSymbolChangeEvent:true,

    postMixInProperties:function(){
      var mainNls = window.jimuConfig && window.jimuConfig.nls;
      if(!mainNls){
        mainNls = i18n.getLocalization('jimu','main');
      }
      this.nls = mainNls.symbolChooser;
    },

    postCreate:function(){
      this.inherited(arguments);
      if(this.symbol){
        this.showBySymbol(this.symbol);
      }
      else if(this.type){
        this.showByType(this.type);
      }
    },

    showBySymbol:function(symbol){
      this.symbol = null;
      this.type = null;
      this.symbol = symbol;
      if(this.symbol instanceof SimpleMarkerSymbol || this.symbol instanceof PictureMarkerSymbol){
        this.type = 'marker';
        this._initPointSection();
      }
      else if(this.symbol instanceof SimpleLineSymbol){
        this.type = 'line';
        this._initLineSection();
      }
      else if(this.symbol instanceof SimpleFillSymbol){
        this.type = 'fill';
        this._initFillSection();
      }
      else if(this.symbol instanceof TextSymbol){
        this.type = 'text';
        this._initTextSection();
      }
    },

    showByType:function(type){
      this.symbol = null;
      this.type = null;
      if(type === 'marker' || type === 'line' || type === 'fill' || type === 'text'){
        this.type = type;
      }
      else{
        return;
      }
      if(this.type === 'marker'){
        this._initPointSection();
      }
      else if(this.type === 'line'){
        this._initLineSection();
      }
      else if(this.type === 'fill'){
        this._initFillSection();
      }
      else if(this.type === 'text'){
        this._initTextSection();
      }
    },

    getSymbol:function(){
      var symbol = null;

      if(this.type === 'marker'){
        symbol = this._getPointSymbolBySetting();
      }
      else if(this.type === 'line'){
        symbol = this._getLineSymbolBySetting();
      }
      else if(this.type === 'fill'){
        symbol = this._getFillSymbolBySetting();
      }
      else if(this.type === 'text'){
        symbol = this._getTextSymbolBySetting();
      }
      return symbol;
    },

    onChange:function(newSymbol){/*jshint unused: false*/},

    _showSection:function(type){
      query('.symbol-section',this.domNode).style('display','none');
      var s = '.' + type + '-symbol-section';
      query(s,this.domNode).style('display','block');
    },

    _getAncestor:function(dom,checkFunc,maxLoop){
      if(typeof maxLoop !== 'number' || maxLoop <= 0){
        maxLoop = null;
      }
      var ancestor = dom;
      var count = 0;
      while(ancestor){
        if(checkFunc(ancestor)){
          return ancestor;
        }
        ancestor = ancestor.parentNode;
        if(maxLoop){
          count++;
          if(count >= maxLoop){
            return null;
          }
        }
      }
      return null;
    },

    _getAbsoluteUrl:function(module){
      return window.location.protocol + "//" + window.location.host +  require.toUrl(module);
    },

    _cloneSymbol:function(symbol){
      if(!symbol){
        return null;
      }
      var jsonSym = symbol.toJson();
      var clone = jsonUtils.fromJson(jsonSym);
      return clone;
    },

    _createSymbolIconTable:function(fileName,jsonSyms){
      var countPerRow = 8;
      var class0 = 'icon-table';
      var class1 = this.type+"-icon-table";
      var class2 = class1+"-"+fileName;
      var className = class0 + " " + class1+" "+class2;
      var table = html.toDom('<table class="'+className+'"><tbody></tbody></table>');
      var tbody = query('tbody',table)[0];
      var rowCount = Math.ceil(jsonSyms.length / countPerRow);
      for(var i=0;i<rowCount;i++){
        html.create('tr',{},tbody);
      }
      var trs = query('tr',table);
      array.forEach(jsonSyms,lang.hitch(this,function(jsonSym,index){
        var jsonSymClone = lang.clone(jsonSym);
        var sym = jsonUtils.fromJson(jsonSym);
        var rowIndex = Math.floor(index / countPerRow);
        var tr = trs[rowIndex];
        var td = html.create('td',{},tr);
        html.addClass(td,'symbol-td-item');
        var symNode = this._createSymbolNode(sym);
        html.addClass(symNode,'symbol-div-item');
        symNode.symbol = jsonSymClone;
        html.place(symNode,td);
      }));
      return table;
    },

    _updatePreview:function(previewNode){
      var node = previewNode;
      var symbol = this._cloneSymbol(this.symbol);

      html.empty(node);

      var sWidth = 80;
      var sHeight = 30;
      if (symbol.type === "simplemarkersymbol") {
        // extra padding for the outline width
        sWidth = Math.min(symbol.size + 12, 125);
        sHeight = sWidth;
      } else if (symbol.type === "picturemarkersymbol") {
        if (!symbol.url || symbol.url === "http://" || (symbol.url.indexOf("http://") === -1 && symbol.url.indexOf("https://") === -1 && symbol.url.indexOf("data:") === -1)) {
          // bad URL
          return;
        }
        sWidth = Math.min(Math.max(symbol.width, symbol.height), 125);
        sHeight = sWidth;
      } else if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol") {
        sWidth = 190;
        sHeight = 20;
      }

      var surface = gfx.createSurface(node, sWidth, sHeight);
      if (gfx.renderer === "vml") {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        var source = surface.getEventSource();
        html.setStyle(source, "position", "relative");
        html.setStyle(source.parentNode, "position", "relative");
      }
      var shapeDesc = null;
      if(symbol instanceof SimpleLineSymbol || symbol instanceof CartographicLineSymbol){
        shapeDesc = this._getLineShapeDesc(symbol);
      }
      else{
        shapeDesc = jsonUtils.getShapeDescriptors(symbol);
      }

      var gfxShape;
      try {
        gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
      } catch (e) {
        surface.clear();
        surface.destroy();
        return;
      }

      var dim = surface.getDimensions();
      var transform = {
        dx: dim.width / 2,
        dy: dim.height / 2
      };

      var bbox = gfxShape.getBoundingBox(),
        width = bbox.width,
        height = bbox.height;
      if (width > sWidth || height > sHeight) {
        var actualSize = width > height ? width : height;
        var refSize = sWidth < sHeight ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        lang.mixin(transform, {
          xx: scaleBy,
          yy: scaleBy
        });
      }

      gfxShape.applyTransform(transform);
      return surface;
    },

    _createSymbolNode:function(symbol){
      var nodeWidth = 36;
      var nodeHieght = 36;
      var node = html.create('div',{style:{width:nodeWidth+'px',height:nodeHieght+'px'}});
      var sWidth = 32;
      var sHeight = 32;

      var surface = gfx.createSurface(node, sWidth, sHeight);
      if (gfx.renderer === "vml") {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        var source = surface.getEventSource();
        html.setStyle(source, "position", "relative");
        html.setStyle(source.parentNode, "position", "relative");
      }
      var shapeDesc = jsonUtils.getShapeDescriptors(symbol);

      var gfxShape;
      try {
        gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
      } catch (e) {
        surface.clear();
        surface.destroy();
        return;
      }
      
      var transform = {
        dx: nodeWidth / 2,
        dy: nodeHieght / 2
      };

      var bbox = gfxShape.getBoundingBox();
      var width = bbox.width;
      var height = bbox.height;

      if (width > sWidth || height > sHeight) {
        var actualSize = width > height ? width : height;
        var refSize = sWidth < sHeight ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        lang.mixin(transform,{
          xx: scaleBy,
          yy: scaleBy
        });
      }

      gfxShape.applyTransform(transform);
      // return surface;
      return node;
    },

    _getLineShapeDesc:function(symbol){
      var result = null;
      if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol") {
        // we want a longer line
        var shape = {
          type: "path",
          path: "M -90,0 L 90,0 E"
        };
        result = {
          defaultShape: shape,
          fill: null,
          stroke: symbol.getStroke()
        };
      }
      return result;
    },

    /* point section */
    _initPointSection:function(){
      this._showSection('point');
      if (!this._pointEventsBinded) {
        this._pointEventsBinded = true;
        this._bindPointEvents();
        this._onPointSymClassSelectChange();
      }
      
      if(this.symbol instanceof PictureMarkerSymbol){
        this._showPictureMarkerSymSettings();
      }
      else if(this.symbol instanceof SimpleMarkerSymbol){
        this._showSimpleMarkerSymSettings();
      }
      else{
        var args = {"style":"esriSMSCircle","color":[0,0,128,128],"name":"Circle","outline":{"color":[0,0,128,255],"width":1},"type":"esriSMS","size":18};
        this.symbol = new SimpleMarkerSymbol(args);
        this._showSimpleMarkerSymSettings();
      }
      this._initPointSettings(this.symbol);
      this._getPointSymbolBySetting();
    },

    _bindPointEvents:function(){
      this.own(on(this.pointIconTables,'.symbol-div-item:click',lang.hitch(this,this._onPointSymIconItemClick)));
      this.own(on(this.pointSymClassSelect,'Change',lang.hitch(this,this._onPointSymClassSelectChange)));
      this.own(on(this.pointSize,'change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.pointColor,'Change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.pointAlpha,'change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.pointOutlineColor,'change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.pointOutlineWidth,'change',lang.hitch(this,this._onPointSymbolChange)));
    },

    _onPointSymbolChange:function(){
      if(this._invokeSymbolChangeEvent){
        this._getPointSymbolBySetting();
        this.onChange(this.symbol);
      }
    },

    _initPointSettings:function(symbol){
      if(!symbol){
        return;
      }
      this._invokeSymbolChangeEvent = false;
      if(symbol instanceof SimpleMarkerSymbol){
        this.pointSize.set('value',symbol.size);
        this.pointColor.setColor(symbol.color);
        this.pointAlpha.set('value',parseFloat(symbol.color.a.toFixed(2)));
        var outlineSymbol = symbol.outline;
        if(outlineSymbol){
          this.pointOutlineColor.setColor(outlineSymbol.color);
          this.pointOutlineWidth.set('value',parseFloat(outlineSymbol.width.toFixed(0)));
        }
      }
      else if(symbol instanceof PictureMarkerSymbol){
        this.pointSize.set('value',symbol.width);
      }
      this._invokeSymbolChangeEvent = true;
    },

    _onPointSymClassSelectChange:function(){
      this._showSelectedPointSymIconTable();
      var fileName = this.pointSymClassSelect.get('value');
      var defName = 'def' + fileName;
      var def = this.pointSymClassSelect[defName];
      if (!def) {
        this._requestPointSymJson(fileName);
      }
    },

    _showSelectedPointSymIconTable:function(){
      var fileName = this.pointSymClassSelect.get('value');
      query('.marker-icon-table',this.pointIconTables).style('display','none');
      var tables = query('.marker-icon-table-'+fileName,this.pointIconTables);
      if(tables.length > 0){
        tables.style('display','table');
      }
    },

    _requestPointSymJson:function(fileName){
      var defName = 'def'+fileName;
      var def = this.pointSymClassSelect[defName];
      if(def){
        return;
      }
      var module = "jimu/dijit/SymbolsInfo/"+fileName+".json";
      var url = this._getAbsoluteUrl(module);
      def = esriRequest({
        url:url,
        handleAs:'json',
        callbackParamName:'callback'
      });
      this.pointSymClassSelect[defName] = def;
      def.then(lang.hitch(this,function(jsonSyms){
        var table = this._createSymbolIconTable(fileName,jsonSyms);
        html.place(table,this.pointIconTables);
        this._showSelectedPointSymIconTable();
      }),lang.hitch(this,function(error){
        console.error('get point symbol failed',error);
      }));
    },

    _onPointSymIconItemClick:function(event){
      var target = event.target||event.srcElement;
      var symDivItem = this._getAncestor(target,function(dom){
        return html.hasClass(dom,'symbol-div-item');
      },5);

      if(!symDivItem){
        return;
      }

      var td = symDivItem.parentNode;
      var tr = td.parentNode;
      var tbody = tr.parentNode;
      query('.selected-symbol-div-item',tbody).removeClass('selected-symbol-div-item');
      html.addClass(symDivItem,'selected-symbol-div-item');

      var jsonSym = symDivItem.symbol;
      if(!jsonSym){
        return;
      }
      this.symbol = jsonUtils.fromJson(jsonSym);
      if(this.symbol instanceof SimpleMarkerSymbol){
        this._showSimpleMarkerSymSettings();
      }
      else{
        this._showPictureMarkerSymSettings();
      }
      this._onPointSymbolChange();
    },

    _showSimpleMarkerSymSettings:function(){
      html.setStyle(this.pointColorTr,'display','');
      html.setStyle(this.pointOpacityTr,'display','');
      html.setStyle(this.pointOutlineColorTr,'display','');
      html.setStyle(this.pointOulineWidthTr,'display','');
    },

    _showPictureMarkerSymSettings:function(){
      html.setStyle(this.pointColorTr,'display','none');
      html.setStyle(this.pointOpacityTr,'display','none');
      html.setStyle(this.pointOutlineColorTr,'display','none');
      html.setStyle(this.pointOulineWidthTr,'display','none');
    },

    _getPointSymbolBySetting:function(){
      if(!this.symbol){
        return null;
      }
      var size = parseFloat(this.pointSize.get('value'));
      if(this.symbol instanceof SimpleMarkerSymbol){
        this.symbol.setSize(size);
        var color = this.pointColor.getColor();
        var opacity = parseFloat(this.pointAlpha.get('value'));
        color.a = opacity;
        this.symbol.setColor(color);
        var outlineColor = this.pointOutlineColor.getColor();
        var outlineWidth = parseFloat(this.pointOutlineWidth.get('value'));
        var outlineSym = new SimpleLineSymbol();
        outlineSym.setStyle(SimpleLineSymbol.STYLE_SOLID);
        outlineSym.setColor(outlineColor);
        outlineSym.setWidth(outlineWidth);
        this.symbol.setOutline(outlineSym);
      }
      else if(this.symbol instanceof PictureMarkerSymbol){
        this.symbol.setWidth(size);
        this.symbol.setHeight(size);
      }
      this._updatePreview(this.pointSymPreview);
      return this.symbol;
    },

    /* line section */
    _initLineSection:function(){
      this._showSection('line');
      if (!this._lineEventBinded) {
        this._lineEventBinded = true;
        this._bindLineEvents();
        this._requestLineSymJson('line');
      }
      
      this._initLineSettings(this.symbol);
      this._getLineSymbolBySetting();
    },

    _bindLineEvents:function(){
      this.own(on(this.lineIconTables,'.symbol-div-item:click',lang.hitch(this,this._onLineSymIconItemClick)));
      this.own(on(this.lineColor,'Change',lang.hitch(this,this._onLineSymbolChange)));
      this.own(on(this.lineStylesSelect,'change',lang.hitch(this,this._onLineSymbolChange)));
      this.own(on(this.lineAlpha,'change',lang.hitch(this,this._onLineSymbolChange)));
      this.own(on(this.lineWidth,'change',lang.hitch(this,this._onLineSymbolChange)));
    },

    _onLineSymbolChange:function(){
      if(this._invokeSymbolChangeEvent){
        this._getLineSymbolBySetting();
        this.onChange(this.symbol);
      }
    },

    _initLineSettings:function(symbol){
      if(!symbol){
        return;
      }
      this._invokeSymbolChangeEvent = false;
      this.lineColor.setColor(symbol.color);
      this.lineAlpha.set('value',parseFloat(symbol.color.a.toFixed(2)));
      this.lineWidth.set('value',parseFloat(symbol.width.toFixed(0)));
      this.lineStylesSelect.set('value',symbol.style);
      this._invokeSymbolChangeEvent = true;
    },

    _requestLineSymJson:function(fileName){
      var module = "jimu/dijit/SymbolsInfo/"+fileName+".json";
      var url = this._getAbsoluteUrl(module);
      var def = esriRequest({
        url:url,
        handleAs:'json',
        callbackParamName:'callback'
      });
      def.then(lang.hitch(this,function(jsonSyms){
        var table = this._createSymbolIconTable(fileName,jsonSyms);
        html.place(table,this.lineIconTables);
      }),lang.hitch(this,function(error){
        console.error('get line symbol failed',error);
      }));
    },

    _onLineSymIconItemClick:function(event){
      var target = event.target||event.srcElement;
      var symDivItem = this._getAncestor(target,function(dom){
        return html.hasClass(dom,'symbol-div-item');
      },5);

      if(!symDivItem){
        return;
      }

      var td = symDivItem.parentNode;
      var tr = td.parentNode;
      var tbody = tr.parentNode;
      query('.selected-symbol-div-item',tbody).removeClass('selected-symbol-div-item');
      html.addClass(symDivItem,'selected-symbol-div-item');

      var jsonSym = symDivItem.symbol;
      if(!jsonSym){
        return;
      }
      var symbol = jsonUtils.fromJson(jsonSym);
      this._initLineSettings(symbol);
      this._onLineSymbolChange();
    },

    _getLineSymbolBySetting:function(){
      this.symbol = new SimpleLineSymbol();
      var color = this.lineColor.getColor();
      var style = this.lineStylesSelect.get('value');
      color.a = parseFloat(this.lineAlpha.get('value'));
      var width = parseFloat(this.lineWidth.get('value'));
      this.symbol.setStyle(style);
      this.symbol.setColor(color);
      this.symbol.setWidth(width);
      this._updatePreview(this.lineSymPreview);
      return this.symbol;
    },


    /* fill section */
    _initFillSection:function(){
      this._showSection('fill');
      if(!this._fillEventBinded){
        this._fillEventBinded = true;
        this._bindFillEvents();
        this._requestFillSymJson('fill');
      }
      
      this._initFillSettings(this.symbol);
      this._getFillSymbolBySetting();
    },

    _bindFillEvents:function(){
      this.own(on(this.fillIconTables,'.symbol-div-item:click',lang.hitch(this,this._onFillSymIconItemClick)));
      this.own(on(this.fillColor,'Change',lang.hitch(this,this._onFillSymbolChange)));
      this.own(on(this.fillAlpha,'change',lang.hitch(this,this._onFillSymbolChange)));
      this.own(on(this.fillOutlineColor,'Change',lang.hitch(this,this._onFillSymbolChange)));
      this.own(on(this.fillOutlineWidth,'change',lang.hitch(this,this._onFillSymbolChange)));
    },

    _onFillSymbolChange:function(){
      if(this._invokeSymbolChangeEvent){
        this._getFillSymbolBySetting();
        this.onChange(this.symbol);
      }
    },

    _initFillSettings:function(symbol){
      if(!symbol){
        return;
      }
      this._invokeSymbolChangeEvent = false;
      this.fillColor.setColor(symbol.color);
      this.fillAlpha.set('value',parseFloat(symbol.color.a.toFixed(2)));
      if(symbol.outline){
        this.fillOutlineColor.setColor(symbol.outline.color);
        this.fillOutlineWidth.set('value',parseInt(symbol.outline.width,10));
      }
      this._invokeSymbolChangeEvent = true;
    },

    _requestFillSymJson:function(fileName){
      var module = "jimu/dijit/SymbolsInfo/"+fileName+".json";
      var url = this._getAbsoluteUrl(module);
      var def = esriRequest({
        url:url,
        handleAs:'json',
        callbackParamName:'callback'
      });
      def.then(lang.hitch(this,function(jsonSyms){
        var table = this._createSymbolIconTable(fileName,jsonSyms);
        html.place(table,this.fillIconTables);
      }),lang.hitch(this,function(error){
        console.error('get fill symbol failed',error);
      }));
    },

    _onFillSymIconItemClick:function(event){
      var target = event.target||event.srcElement;
      var symDivItem = this._getAncestor(target,function(dom){
        return html.hasClass(dom,'symbol-div-item');
      },5);

      if(!symDivItem){
        return;
      }

      var td = symDivItem.parentNode;
      var tr = td.parentNode;
      var tbody = tr.parentNode;
      query('.selected-symbol-div-item',tbody).removeClass('selected-symbol-div-item');
      html.addClass(symDivItem,'selected-symbol-div-item');

      var jsonSym = symDivItem.symbol;
      if(!jsonSym){
        return;
      }
      var symbol = jsonUtils.fromJson(jsonSym);
      this._initFillSettings(symbol);
      this._onFillSymbolChange();
    },

    _getFillSymbolBySetting:function(){
      this.symbol = new SimpleFillSymbol();
      var color = this.fillColor.getColor();
      color.a = parseFloat(this.fillAlpha.get('value').toFixed(2));
      var outlineColor = this.fillOutlineColor.getColor();
      var outlineWidth = parseInt(this.fillOutlineWidth.get('value'),10);
      this.symbol.setColor(color);
      this.symbol.setStyle(SimpleFillSymbol.STYLE_SOLID);
      var outlineSym = new SimpleLineSymbol();
      outlineSym.setStyle(SimpleLineSymbol.STYLE_SOLID);
      outlineSym.setColor(outlineColor);
      outlineSym.setWidth(outlineWidth);
      this.symbol.setOutline(outlineSym);
      this._updatePreview(this.fillSymPreview);
      return this.symbol;
    },


    /* text section */
    _initTextSection:function(){
      this._showSection('text');
      if(!this._textEventBinded){
        this._textEventBinded = true;
        this._bindTextEvents();
      }
      
      this._initTextSettings();
      this._getTextSymbolBySetting();
    },

    _bindTextEvents:function(){
      this.own(on(this.inputText,'change',lang.hitch(this,this._onTextSymbolChange)));
      this.own(on(this.textColor,'Change',lang.hitch(this,this._onTextSymbolChange)));
      this.own(on(this.textFontSize,'change',lang.hitch(this,this._onTextSymbolChange)));
    },

    _onTextSymbolChange:function(){
      if (this._invokeSymbolChangeEvent) {
        this._getTextSymbolBySetting();
        this.onChange(this.symbol);
      }
    },

    _initTextSettings:function(symbol){
      if(!symbol){
        return;
      }
      this._invokeSymbolChangeEvent = false;
      this.inputText.value = symbol.text;
      this.textColor.setColor(symbol.color);
      var size = parseInt(symbol.font.size,10);
      this.textFontSize.set('value',size);
      this._invokeSymbolChangeEvent = true;
    },

    _updateTextPreview:function(){
      var colorHex = this.textColor.getColor().toHex();
      var size = parseInt(this.textFontSize.get('value'),10)+'px';
      html.setStyle(this.textPreview,{color:colorHex,fontSize:size});
      this.textPreview.innerHTML = this.inputText.value;
    },

    _getTextSymbolBySetting:function(){
      this.symbol = new TextSymbol();
      var text = this.inputText.value;
      var color = this.textColor.getColor();
      var size = parseInt(this.textFontSize.get('value'),10);
      var font = new Font();
      font.setSize(size);
      this.symbol.setText(text);
      this.symbol.setColor(color);
      this.symbol.setFont(font);
      this._updateTextPreview();
      return this.symbol;
    }

  });
});