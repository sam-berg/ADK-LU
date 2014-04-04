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
    'dojo/_base/lang'
  ],
  function(lang) {
    var mo = {};

    String.prototype.startWith = function(str) {
      if (this.substr(0, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    String.prototype.endWith = function(str) {
      if (this.substr(this.length - str.length, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    mo.getServerByUrl = function(_url){
      //test: http://www.arcgis.com/sharing/rest => www.arcgis.com
      //test: https://www.arcgis.com/ => www.arcgis.com
      //test: http://10.112.18.151:6080/arcgis/rest/services => 10.112.18.151:6080
      _url = lang.trim(_url||'');
      _url = _url.replace(/http(s?):\/\//gi,'');
      return _url.split('/')[0];
    };

    mo.isSameServer = function(_url1,_url2){
      _url1 = mo.getServerByUrl(_url1);
      _url2 = mo.getServerByUrl(_url2);
      return _url1 === _url2;
    };

    mo.fromOnline = function(_url){
      var server = mo.getServerByUrl(_url).toLowerCase();
      return server.indexOf('.arcgis.com') >= 0;
    };

    mo.isArcGIScom = function(_url){
      var server = mo.getServerByUrl(_url).toLowerCase();
      return server === 'www.arcgis.com' || server === 'arcgis.com';
    };

    mo.isPortal = function(_url){
      return !mo.isArcGIScom(_url);
    };

    mo.getStandardPortalUrl = function(_portalUrl){
      //test: http://www.arcgis.com/sharing/rest//// => http://www.arcgis.com
      //test: www.arcgis.com => http://www.arcgis.com
      //test: http://www.arcgis.com/ => http://www.arcgis.com
      //test: https://www.arcgis.com/ => https://www.arcgis.com
      //test: 10.112.18.151 => http://10.112.18.151/arcgis
      //test: 10.112.18.151/gis => http://10.112.18.151/gis
      //test: http://analysis.arcgis.com => http://www.arcgis.com
      var server = mo.getServerByUrl(_portalUrl);
      if (server === '') {
        return '';
      }
      if (mo.fromOnline(server)) {
        if(mo.isArcGIScom(server)){
          server = 'www.arcgis.com';
        }
        var protocol = mo.getProtocol(_portalUrl)||'http';
        _portalUrl = protocol + '://'+server;
      } else {
        _portalUrl = lang.trim(_portalUrl || '').replace(/sharing(.*)/gi, '').replace(/\/*$/g, '');
        _portalUrl = mo.addProtocol(_portalUrl);
        var pattStr = 'http(s?):\/\/' + server;
        var pattern = new RegExp(pattStr, 'g');
        var nail = _portalUrl.replace(pattern, '');
        if (!nail) {
          _portalUrl = _portalUrl + '/arcgis';
        }
      }
      
      return _portalUrl;
    };

    mo.isSamePortalUrl = function(_portalUrl1,_portalUrl2){
      //test: http://www.arcgis.com/sharing/rest === https://www.arcgis.com
      //test: http://www.arcgis.com/ === https://www.arcgis.com
      var patt = /^http(s?):\/\//gi;
      _portalUrl1 = mo.getStandardPortalUrl(_portalUrl1).toLowerCase().replace(patt,'');
      _portalUrl2 = mo.getStandardPortalUrl(_portalUrl2).toLowerCase().replace(patt,'');
      return _portalUrl1 === _portalUrl2;
    };

    mo.getBaseSearchUrl = function(_portalUrl){
      var searchUrl = '';
      var portalUrl = mo.getStandardPortalUrl(_portalUrl);
      portalUrl = portalUrl.replace(/\/*$/g, '');
      if(portalUrl){
        searchUrl = portalUrl + '/' + 'sharing/rest/search';
      }
      return searchUrl;
    };

    mo.getBaseItemUrl = function(_portalUrl){
      var baseItemUrl = '';
      _portalUrl = mo.getStandardPortalUrl(_portalUrl);
      if(_portalUrl){
        baseItemUrl = _portalUrl + '/sharing/rest/content/items';
      }
      return baseItemUrl;
    };

    mo.getItemUrl = function(_portalUrl,_itemId){
      var itemUrl = '';
      var baseItemUrl = mo.getBaseItemUrl(_portalUrl);
      if(baseItemUrl && _itemId){
        itemUrl = baseItemUrl + '/' + _itemId;
      }
      return itemUrl;
    };

    mo.getItemDataUrl = function(_portalUrl,_itemId){
      var itemDataUrl = '';
      var itemUrl = mo.getItemUrl(_portalUrl,_itemId);
      if(itemUrl){
        itemDataUrl = itemUrl + '/data';
      }
      return itemDataUrl;
    };

    mo.getGenerateTokenUrl = function(_portalUrl){
      var tokenUrl = '';
      if(_portalUrl){
        _portalUrl = mo.getStandardPortalUrl(_portalUrl);
        tokenUrl = _portalUrl + '/sharing/generateToken';
      }
      return tokenUrl;
    };

    mo.getItemDetailsPageUrl = function(_portalUrl,_itemId){
      var url = '';
      if(_portalUrl && _itemId){
        _portalUrl = mo.getStandardPortalUrl(_portalUrl);
        url = _portalUrl + "/home/item.html?id=" + _itemId;
      }
      return url;
    };

    mo.getUserProfilePageUrl = function(_portalUrl,_user){
      var url = '';
      if(_portalUrl && _user){
        _portalUrl = mo.getStandardPortalUrl(_portalUrl);
        url = _portalUrl + '/home/user.html?user=' + _user;
      }
      return url;
    };

    mo.addProtocol = function(url){
      var noProtocol = url.indexOf('http://') <= -1 && url.indexOf('https://') <= -1;
      if(noProtocol){
        url = 'http://'+url;
      }
      return url;
    };

    mo.getProtocol = function(url){
      var protocol = '';
      if(url.indexOf('https://') === 0){
        protocol = 'https';
      }
      else if(url.indexOf('http://') === 0){
        protocol = 'http';
      }
      return protocol;
    };

    return mo;
  });