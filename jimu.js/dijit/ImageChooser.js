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
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/sniff',
  '../utils'
],
function(declare, _WidgetBase, lang, html, on, has, utils) {
  //summary:
  //  popup the image file chooser dialog, when choose an image file,
  //  display the image file and return the image's base64 code
  return declare(_WidgetBase, {
    'class': 'jimu-image-chooser',

    //imageType: String
    imageType: 'image/png, image/jpeg, image/bmp, image/gif',

    postCreate: function(){
      this._createFileInput();
    },

    show: function(){
      this.fileInput.click();
    },

    _createFileInput: function(){
      this.fileInput = html.create('input', {
        accept: this.imageType,
        type: 'file',
        style: {
          opacity:0,
          visibility:'hidden',
          width:0,
          height:0
        }
      }, this.domNode);

      this.own(on(this.fileInput, 'change', lang.hitch(this, function(evt){
        if(!utils.file.supportHTML5()){
          alert('TODO: not suport file reader API');
          return;
        }
        utils.file.readFile(evt.target.files[0], 'image/*', 50000, lang.hitch(this, function(err, fileName, fileData){
          this.onImageChange(fileData);
          if(this.displayImg){
            html.setAttr(this.displayImg, 'src', fileData);
          }
        }));
      })));
    },

    onImageChange: function(fileData){
      /*jshint unused:false*/
    }

  });
});