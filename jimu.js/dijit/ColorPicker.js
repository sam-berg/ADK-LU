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
    'dojo/on',
    'dojo/_base/Color',
    'dijit/TooltipDialog',
    'dijit/ColorPalette',
    'dijit/popup'
  ],
  function(declare, _WidgetBase, _TemplatedMixin, lang, html, on, Color, TooltipDialog, ColorPalette, Popup) {
    return declare([_WidgetBase, _TemplatedMixin], {
      baseClass: 'jimu-color-picker',
      templateString: '<div></div>',
      color: null,

      postCreate: function() {
        this.inherited(arguments);
        if(this.color){
          if(!(this.color instanceof Color)){
            this.color = new Color(this.color);
          }
        }
        else{
          this.color = new Color('#ccc');
        }

        html.setStyle(this.domNode,'backgroundColor',this.color.toHex());
        this._createTooltipDialog(this.domNode);
      },

      _createTooltipDialog: function(dom) {
        var myTooltipDialog = new TooltipDialog({
          style: "width: 250px;cursor:pointer",
          content: "" //,
          // onMouseLeave: function() {
          //   Popup.close(myTooltipDialog);
          // }
        });
        var myPalette = new ColorPalette({
          palette: "7x10",
          cellClass: "cursor:pointer",
          onChange: lang.hitch(this, function(val) {
            html.setStyle(dom,'backgroundColor',val);
            Popup.close(myTooltipDialog);
            this.color = new Color(val);
            this.onChange(this.color);
          })
        });

        myPalette.startup();
        myTooltipDialog.set('content', myPalette.domNode);
        this.own(on(dom, 'click', lang.hitch(this, function(event){
          event.stopPropagation();
          event.preventDefault();
          Popup.close(myTooltipDialog);
          Popup.open({
            popup: myTooltipDialog,
            around: dom
          });
        })));
        this.own(on(window,'click',lang.hitch(this,function(){
          Popup.close(myTooltipDialog);
        })));
        return myTooltipDialog;
      },

      setColor:function(newColor){
        if(!(newColor instanceof Color)){
          return;
        }
        var oldColor = this.color;
        var oldHex = '';
        if(oldColor){
          oldHex = oldColor.toHex();
        }
        var newHex = newColor.toHex();
        this.color = newColor;
        html.setStyle(this.domNode,'backgroundColor',newHex);
        if(oldHex !== newHex){
          this.onChange(new Color(newHex));
        }
      },

      getColor:function(){
        return this.color;
      },

      onChange:function(newColor){/*jshint unused: false*/}

    });
  });