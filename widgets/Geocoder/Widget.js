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
    "esri/dijit/Geocoder",
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/lang'
  ],
  function(
    declare, BaseWidget, Geocoder,
    html, on, lang) {
    var clazz = declare([BaseWidget], {

      name: 'Geocoder',
      baseClass: 'jimu-widget-geocoder',
      
      startup: function() {
        this.inherited(arguments);

        var json = this.config.geocoder;
        json.map = this.map;
        var geocoder = new Geocoder(json);
        on(geocoder, 'select', lang.hitch(this, "findComplete"));
        html.place(geocoder.domNode, this.domNode);
        geocoder.startup();
      },

      findComplete: function(response){
        if (response && response.result){
          var feature = response.result.feature;

          this.map.infoWindow.setTitle("Location");
          this.map.infoWindow.setContent(response.result.name || null);
          this.map.infoWindow.show(feature.geometry);
        }
      }
    });
    return clazz;
  });