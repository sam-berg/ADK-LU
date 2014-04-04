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
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/fx',
  'dojo/on',
  'dojo/keys',
  'dojo/query',
  'dojo/NodeList-dom',
  'dojo/dnd/move',
  'dijit/_WidgetBase'
],
function(declare, lang, html, baseFx, on, keys,
  query, NodeListDom, Move, _WidgetBase) {
  /* global jimuConfig */
  return declare(_WidgetBase, {
    //summary:
    //  show a popup window

    'class': 'jimu-popup',

    //titleLabel: String
    //  the popup window title. if this property is empty, no title display
    titleLabel: '',

    //content: DOM|Dijit|String
    content: null,

    //container: String|DOM
    //  this popup parent dom node
    container: null,

    //buttons: Object[]
    //  this is the object format
    /*=====
      //label: String
      label: '',
      //onClick: function
      onClick: null, if this function return false, the popup will not close, or the popup will close after button click.
      //key: dojo/keys
      key: optional, if key is set, the button will response to the key event
    =====*/
    buttons: [],

    //onClose: function
    //  callback function when click the close button. If this function return false, the popup will not close
    onClose: null,

    maxHeight: 800,
    maxWidth: 1024,


    constructor: function(){
      this.buttons = [];
      this.container = jimuConfig.layoutId;
    },

    postCreate: function(){
      this.inherited(arguments);

      this.domNode.tabIndex = 1;
      // init dom node
      this._initDomNode();

      // moveable the popup
      this.moveable = new Move.boxConstrainedMoveable(this.domNode, {
        box: html.getMarginBox(this.container),
        handle: this.titleNode,
        within: true
      });
      this.own(on(this.moveable, 'Moving', lang.hitch(this, this.onMoving)));
      this.own(on(this.moveable, 'MoveStop', lang.hitch(this, this.onMoveStop)));

      //position the popup
      this._calculateSize();

      this.overlayNode = html.create('div', {
        'class': 'popup-overlay'
      }, this.container);

      this._increaseZIndex();

      baseFx.animateProperty({
        node: this.domNode,
        properties: {opacity: 1},
        duration: 200
      }).play();

      this.domNode.focus();
    },

    _initDomNode: function(){
      if(this.titleLabel){
        this.titleNode = html.create('div', {
          'class': 'title'
        }, this.domNode);
        this.titleLabeNode = html.create('span', {
          'class': 'title-label',
          innerHTML: this.titleLabel
        }, this.titleNode);
        this.closeBtnNode = html.create('div', {
          'class': 'close-btn'
        }, this.titleNode);
        this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
      }

      this.contentContainerNode = html.create('div', {
        'class': 'content'
      }, this.domNode);

      if(this.content){
        if(typeof this.content === 'string'){
          this.contentContainerNode.innerHTML = this.content;
        }else if(this.content.domNode){
          this.content.placeAt(this.contentContainerNode);
          this.content.popup = this;
        }else if(this.content instanceof HTMLElement){
          html.place(this.content, this.contentContainerNode);
        }
      }

      html.create('div', {
        'class': 'line'
      }, this.domNode);

      this.buttonContainer = html.create('div', {
        'class': 'button-container'
      }, this.domNode);

      if(this.buttons.length === 0){
        this.buttons.push({
          label: 'Ok',
          key: keys.ENTER,
          onClick: lang.hitch(this, this.close)
        });
      }
      for(var i = this.buttons.length - 1; i > -1; i --){
        this._createButton(this.buttons[i]);
      }
    },

    _calculateSize: function(){
      var box = html.getContentBox(this.container);
      var headerBox, footerBox;

      if (query('#header').length === 0){
        headerBox = {
          t: 0,
          l: 0,
          w: 0,
          h: 0
        };
      }else{
        headerBox = html.getMarginBox('header');
      }
      if(query('.footer', this.container).length === 0){
        footerBox = {
          t: 0,
          l: 0,
          w: 0,
          h: 0
        };
      }else{
        footerBox = html.getMarginBox(query('.footer', this.container)[0]);
      }

      var flexHeight = box.h - headerBox.h - footerBox.h - 40;
      this.height = this.height || (flexHeight > this.maxHeight ? this.maxHeight : flexHeight);
      var top = (flexHeight - this.height) / 2 + headerBox.h + 20;
      top = top < headerBox.h ? headerBox.h : top;

      this.width = this.width || this.maxWidth;
      var left = (box.w - this.width) / 2;

      html.setStyle(this.domNode, {
        left: left + 'px',
        top: top + 'px',
        width: this.width + 'px',
        height: this.height + 'px'
      });
      html.place(this.domNode, this.container);

      html.setStyle(this.contentContainerNode, {
        height: (this.height - 75 - 40 - 40) + 'px'
      });
    },

    _increaseZIndex: function() {
      var popups = query('.jimu-popup');
      if (popups.length > 1) {
        html.setStyle(this.domNode, 'zIndex', popups.length + 501);
        html.setStyle(this.overlayNode, 'zIndex', popups.length + 500);
      }
    },

    onMoving: function(mover){
      html.setStyle(mover.node, 'opacity', 0.9);
    },

    onMoveStop: function(mover){
      html.setStyle(mover.node, 'opacity', 1);
    },

    close: function(){
      if(this.onClose && this.onClose() === false){
        return;
      }

      var parent = this.domNode.parentNode;
      var cloneNode = lang.clone(this.domNode);
      html.setStyle(this.domNode,'display','none');
      html.destroy(this.overlayNode);
      this.destroy();
      this.moveable.destroy();
      html.place(cloneNode,parent);

      baseFx.animateProperty({
        node: cloneNode,
        properties: {opacity: 0},
        duration: 200,
        onEnd:function(){
          html.destroy(cloneNode);
        }
      }).play();
    },

    addButton: function(btn){
      this._createButton(btn);
    },

    _createButton: function(button){
      var node = html.create('div', {
        'class': 'jimu-btn',
        innerHTML: button.label
      }, this.buttonContainer);
      this.own(on(node, 'click', lang.hitch(this, function(evt){
        //we don't close popup because that maybe the
        //listener function is async
        if(button.onClick){
          button.onClick(evt);
        }else{
          this.close();
        }
      })));
      var existKey = false;
      if (typeof button.key === 'number') {
        for (var attr in keys) {
          if (keys[attr] === button.key) {
            existKey = true;
            break;
          }
        }
      }
      if(existKey){
        this.own(on(this.domNode,'keydown',lang.hitch(this,function(event){
          var keyCode = event.keyCode !== undefined ? event.keyCode : event.which;
          if(keyCode === button.key){
            node.click();
          }
        })));
      }
    }

  });
});