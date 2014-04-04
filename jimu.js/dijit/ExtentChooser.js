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
  'dojo/_base/array',
  'dojo/on',
  'dijit/_WidgetBase',
  'esri/arcgis/utils',
  'esri/geometry/Point',
  'esri/geometry/Extent',
  'esri/geometry/webMercatorUtils',
  'jimu/portalUrlUtils'
],
function(declare, lang, html, array, on, _WidgetBase, agolUtils, Point, Extent, webMercatorUtils,portalUrlUtils) {
  return declare([_WidgetBase], {
    baseClass: 'jimu-extent-chooser',

    //itemId: String
    //  the webmap item id. For now, we only support webmap
    itemId: null,

    initExtent: null,
    //bingMapsKey: String
    //  required if working with Microsoft Bing Maps
    bingMapsKey: '',

    postCreate:function(){
      this.inherited(arguments);

      var mapNode = html.create('div', {
        style: {
          width: '100%',
          height: '100%'
        }
      }, this.domNode);
      
      if(!this.itemId){
        return;
      }
      var args = {
        bingMapsKey: this.bingMapsKey
      };
      if(this.initExtent){
        if(!this.initExtent instanceof Extent){
          this.initExtent = new Extent(this.initExtent);
        }
        args.mapOptions = {
          extent:this.initExtent
        };
      }
      if (window.appConfig.portalUrl) {
        var url = portalUrlUtils.getStandardPortalUrl(window.appConfig.portalUrl);
        agolUtils.arcgisUrl = url + "/sharing/content/items/";
      }
      var mapDeferred = agolUtils.createMap(this.itemId, mapNode, args);

      mapDeferred.then(lang.hitch(this, function(response) {
        this.map = response.map;
        this.map.webMapResponse = response;
        this.own(on(this.map, 'extent-change', lang.hitch(this, function(evt){
          this.onExtentChange(evt.extent);
        })));

        if(!this.initExtent){
          this.onExtentChange(this.map.extent); // send map default extent
        }
      }));
    },

    getExtent: function(){
      return this.map.extent;
    },

    setExtent: function(extent){
      return this.map.setExtent(extent);
    },

    restoreToDefaultWebMapExtent:function(){
      var itemInfo = this.map && this.map.webMapResponse && this.map.webMapResponse.itemInfo;
      if (itemInfo) {
        var points = itemInfo.item && 　itemInfo.item.extent;
        if (points) {
          var wkid = parseInt(this.map.spatialReference.wkid, 10);
          var p1 = new Point(points[0][0], points[0][1]);
          var p2 = new Point(points[1][0], points[1][1]);
          if (wkid !== 4326) {
            p1 = webMercatorUtils.geographicToWebMercator(p1);
            p2 = webMercatorUtils.geographicToWebMercator(p2);
          }
          var extent = new Extent(p1.x, p1.y, p2.x, p2.y, this.map.spatialReference);
          this.map.setExtent(extent);
        }
      }
    },

    onExtentChange: function(extent){
      /* jshint unused:false */
    }

  });
});