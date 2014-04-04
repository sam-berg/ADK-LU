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
    'jimu/BaseWidget',
    "esri/dijit/HomeButton",
    "esri/geometry/Extent",
    'dojo/_base/html',
    'dojo/dom-construct'
  ],
  function(
    declare,
    BaseWidget,
    HomeButton,
    Extent,
    html,
    domConstruct) {
    var clazz = declare([BaseWidget], {

      name: 'HomeButton',
      baseClass: 'jimu-widget-homebutton',

      startup: function() {
        this.inherited(arguments);

        if (this.config.homeButton && this.config.homeButton.extent) {
          this.config.homeButton.extent = new Extent(this.config.homeButton.extent);
        }
        this.config.homeButton.map = this.map;
        var home = new HomeButton(this.config.homeButton, domConstruct.create("div"));
        html.place(home.domNode, this.domNode);
        home.startup();
      }

    });
    return clazz;
  });