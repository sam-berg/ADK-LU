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
    "esri/geometry/Point",
    'esri/SpatialReference',
    'jimu/BaseWidget',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dijit/DropDownMenu",
    "dijit/MenuItem",
    "dijit/CheckedMenuItem",
    "dojo/aspect",
    "esri/tasks/ProjectParameters",
    "esri/config"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Point,
    SpatialReference,
    BaseWidget,
    lang,
    on,
    domStyle,
    domClass,
    domConstruct,
    DropDownMenu,
    MenuItem,
    CheckedMenuItem,
    aspect,
    ProjectParameters,
    esriConfig) {
    /**
     * The Coordinate widget displays the current mouse coordinates.
     * If the map's spatial reference is geographic or web mercator, the coordinates can be displayed as
     * decimal degrees or as degree-minute-seconds.
     * Otherwise, the coordinates will show in map units.
     *
     * @module widgets/Coordinate
     */
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-coordinate',
      name: 'Coordinate',
      popMenu: null,
      selectedWkid: null,
      selectedItem: null,
      selectedTfWkid: null,
      enableRealtime: false,

      startup: function() {
        this.selectedWkid = this.map.spatialReference.wkid;
      },

      onOpen: function() {
        domClass.add(this.coordinateInfo, "coordinate_background");
        this.own(on(this.map, "mouse-move", lang.hitch(this, this.onMouseMove)));
        this.own(on(this.map, "click", lang.hitch(this, this.onMapClick)));
        this.own(on(this.coordinateInfo, "mouseover", lang.hitch(this, this.onMouseOver)));
        this.own(on(this.coordinateInfo, "mouseout", lang.hitch(this, this.onMouseOut)));
        this.own(on(this.coordinateMenuContainer, "mouseover", lang.hitch(this, this.onMouseOverMenu)));
        this.own(on(this.coordinateMenuContainer, "mouseout", lang.hitch(this, this.onMouseOutMenu)));
        this.initPopMenu();
      },

      initPopMenu: function() {
        this.popMenu = new DropDownMenu({}, this.coordinateMenu);
        aspect.after(this.popMenu, "onItemClick", lang.hitch(this, this.onClickMenu), true);

        var len = this.config.spatialReferences.length;
        for (var i = 0; i < len; i++) {
          this.addMenuItem(
            this.config.spatialReferences[i].label,
            this.config.spatialReferences[i].wkid,
            this.config.spatialReferences[i].transformationWkid
          );
        }
        this.addMenuItem(this.nls.defaultLabel, this.selectedWkid);
        this.selectedItem = this.popMenu.getChildren()[len];

        if (this.canRealtimeShow(this.selectedWkid)) {
          this.enableRealtime = true;
        } else {
          this.enableRealtime = false;
        }
        this.popMenu.startup();
      },

      canRealtimeShow: function(wkid) {
        var sp = new SpatialReference(wkid);
        if (sp.isWebMercator() || sp.wkid === 4326) {
          return true;
        } else {
          return false;
        }
      },

      onClickMenu: function(event) {
        this.selectedItem.set({
          label: this.getStatusString(false, this.selectedItem.params.name, this.selectedItem.params.wkid)
        });
        this.selectedWkid = event.params.wkid;
        this.selectedTfWkid = event.params.tfWkid;
        event.set({
          label: this.getStatusString(true, event.params.name, event.params.wkid)
        });
        this.selectedItem = event;

        if (this.canRealtimeShow(this.selectedWkid)) {
          this.enableRealtime = true;
          this.coordinateInfo.innerHTML = this.nls.defaultLabel;
        } else {
          this.enableRealtime = false;
          this.coordinateInfo.innerHTML = this.nls.hintMessage;
        }
      },

      getStatusString: function(selected, name, wkid) {
        var label = "";
        if (selected) {
          label = "&nbsp;&nbsp;●&nbsp;&nbsp;" + "<b>" + label + name + "</b>[" + wkid + "]";
        } else {
          label = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + label + name + "[" + wkid + "]";
        }
        return label;
      },

      addMenuItem: function(name, wkid, tfWkid) {
        var label = this.getStatusString(false, name, wkid);
        if (this.selectedWkid === wkid) {
          label = this.getStatusString(true, name, wkid);
        }
        this.popMenu.addChild(new MenuItem({
          label: label || "",
          name: name || "",
          wkid: wkid || "",
          tfWkid: tfWkid || ""
        }));
      },

      onProjectComplete: function(wkid, geometries) {
        if (!this.selectedWkid || wkid !== this.selectedWkid) {
          return;
        }
        var point = geometries[0];
        this.coordinateInfo.innerHTML = point.x.toFixed(6) + ", " + point.y.toFixed(6);
      },

      onError: function(msg) {
        alert(msg);
      },

      onMapClick: function(evt) {
        if (!this.enableRealtime) {
          var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.map.spatialReference);
          var params = new ProjectParameters();
          params.geometries = [point];
          params.outSR = new SpatialReference(parseInt(this.selectedWkid, 10));
          if (this.selectedTfWkid) {
            params.transformation = new SpatialReference(parseInt(this.selectedTfWkid, 10));
          }
          this.coordinateInfo.innerHTML = this.nls.computing;

          esriConfig.defaults.geometryService.project(params,
            lang.hitch(this, this.onProjectComplete, this.selectedWkid),
            lang.hitch(this, this.onError));
        }
      },

      onMouseMove: function(evt) {
        if (!this.enableRealtime) {
          return;
        }
        var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.map.spatialReference);

        // check if geographic or webmercator (i.e., if getLatitude will work)
        if (point.spatialReference.wkid === 4326 || point.spatialReference.isWebMercator()) {
          // make sure longitude values stays within -180/180
          var normalizedPoint = point.normalize();
          if (this.config.outputunit === 'geo') {
            this.coordinateInfo.innerHTML = this.nls.latitudeLabel + ":&nbsp;" + normalizedPoint.getLatitude().toFixed(6) + "  " + this.nls.longitudeLabel + ":&nbsp;" + normalizedPoint.getLongitude().toFixed(6);
          } else if (this.config.outputunit === 'dms') {
            var lat_string = this.degToDMS(normalizedPoint.getLatitude(), 'LAT');
            var lon_string = this.degToDMS(normalizedPoint.getLongitude(), 'LON');
            this.coordinateInfo.innerHTML = lat_string + "  " + lon_string;
          } else {
            // else default to maps coords
            this.coordinateInfo.innerHTML = this.nls.latitudeLabel + ":&nbsp;" + normalizedPoint.getLatitude().toFixed(6) +
              "  " + this.nls.longitudeLabel + ":&nbsp;" + normalizedPoint.getLongitude().toFixed(6);
          }
        } else { // latlong not available
          this.coordinateInfo.innerHTML = point.x.toFixed(6) + ", " + point.y.toFixed(6);
        }
      },

      onMouseOver: function() {
        domStyle.set(this.coordinateMenuContainer, "display", "");
      },
      onMouseOut: function() {
        domStyle.set(this.coordinateMenuContainer, "display", "none");
      },
      onMouseOverMenu: function() {
        domStyle.set(this.coordinateMenuContainer, "display", "");
      },
      onMouseOutMenu: function() {
        domStyle.set(this.coordinateMenuContainer, "display", "none");
      },

      /**
       * Helper function to prettify decimal degrees into DMS (degrees-minutes-seconds).
       *
       * @param {number} decDeg The decimal degree number
       * @param {string} decDir LAT or LON
       *
       * @return {string} Human-readable representation of decDeg.
       */
      degToDMS: function(decDeg, decDir) {
        /** @type {number} */
        var d = Math.abs(decDeg);
        /** @type {number} */
        var deg = Math.floor(d);
        d = d - deg;
        /** @type {number} */
        var min = Math.floor(d * 60);
        /** @type {number} */
        var sec = Math.floor((d - min / 60) * 60 * 60);
        if (sec === 60) { // can happen due to rounding above
          min++;
          sec = 0;
        }
        if (min === 60) { // can happen due to rounding above
          deg++;
          min = 0;
        }
        /** @type {string} */
        var min_string = min < 10 ? "0" + min : min;
        /** @type {string} */
        var sec_string = sec < 10 ? "0" + sec : sec;
        /** @type {string} */
        var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (decDeg < 0 ? "W" : "E");

        return (decDir === 'LAT') ?
          deg + "&deg;&nbsp;" + min_string + "&prime;&nbsp;" + sec_string + "&Prime;&nbsp;" + dir :
          deg + "&deg;&nbsp;" + min_string + "&prime;&nbsp;" + sec_string + "&Prime;&nbsp;" + dir;
      }
    });

    return clazz;
  });