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
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/aspect',
    'dojo/Deferred',
    'dojo/cookie',
    'dojo/json',
    'dojo/topic',
    'dojo/sniff',
    'dojo/_base/url',
    'dojo/io-query',
    'esri/IdentityManager',
    './OAuthHelper',
    './portalUrlUtils',
    'jimu/dijit/Message',
    'dojo/i18n!./nls/main'
  ],
  function(lang, array, on, aspect, Deferred, cookie, json, topic, sniff, Url, ioquery,
    IdentityManager, OAuthHelper, portalUrlUtils, Message, mainNls) {
    /* global esri */
    var mo = {}, portalUrl;
    this.mo = mo;

    var cookiePath = '/',esri_auth_prefix = 'esri_auth_';

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

    mo.getPortalUrlByCredential = function(credential){
      var thePortalUrl = '';
      if(credential._portalUrl){
        thePortalUrl = credential._portalUrl;
      }
      else{
        if(portalUrlUtils.isSameServer(credential.server,portalUrl)){
          thePortalUrl = portalUrl;
        }
        else{
          thePortalUrl = portalUrlUtils.getStandardPortalUrl(credential.server);
        }
      }
      credential._portalUrl = thePortalUrl;
      return thePortalUrl;
    };

    aspect.after(IdentityManager,'signIn',function(def){
      aspect.before(def,'callback',function(credential){
        //always write cookie when user IdentityManager
        signInSuccess(credential, true);
      });
      return def;
    });

    topic.subscribe('appConfigChanged',function(appConfig){
      portalUrl = appConfig.portalUrl;
    });

    //signin from other app
    topic.subscribe('userSignIn', lang.hitch(this, function(credential) {
      if(!IdentityManager.findCredential(portalUrl, credential && credential.userId || credential && credential.username)){
        IdentityManager.registerToken(credential);
      }
    }));

    topic.subscribe('needSignOut', lang.hitch(this,function(_portalUrl,_options){
      mo.signOut(_portalUrl||portalUrl,_options);
    }));

    registerAllCredentialsFromCookie();

    mo.setPortalUrl = function(_portalUrl){
      if(_portalUrl){
        if(!_portalUrl.endWith('/')){
          _portalUrl += '/';
        }
        portalUrl = lang.trim(_portalUrl);
      }
    };

    mo.getPortalUrl = function(){
      return portalUrl;
    };

    mo.signIn = function(_portalUrl, /*optional*/ appId) {
      var def = null;
      _portalUrl = lang.trim(_portalUrl);
      mo.setPortalUrl(_portalUrl);

      var credential = mo.getCredential();

      if (credential) {
        var options = {};
        options[getAppMode()] = true;
        topic.publish('userSignIn', credential, options);
        def = new Deferred();
        setTimeout(function(){
          def.resolve(credential);
        },0);
      } else {
        if(portalUrlUtils.fromOnline(portalUrl)){
          if(sniff("ie") && location.hostname === 'localhost'){
            new Message({
              message: mainNls.tokenUtils.changeHostTip
            });
            setTimeout(function(){
              def.reject();
            },0);
          }
          else{
            def = oAuth2Signin(appId);
          }
        }
        else {
          // initIDMSignin();
          def = IdentityManager.getCredential(portalUrl + 'sharing/');
        }
      }
      return def;
    };

    mo.signOut = function(/*optional*/ _portalUrl, /*optional*/ _options) {
      _portalUrl = lang.trim(_portalUrl||portalUrl||'');
      var credential = mo.getCredential(_portalUrl);
      cookie(getCookieKey(_portalUrl), null, {
        expires: -1,
        path: cookiePath
      });
      mo.removeCredential(_portalUrl);
      var options = {};
      if(_options){
        options = lang.mixin({},_options);
      }
      options[getAppMode()] = true;
      if(credential){
        topic.publish('userSignOut', _portalUrl, options);
      }
    };

    mo.userHaveSignIn = function(/*optional*/ _portalUrl){
      return !!mo.getCredential(lang.trim(_portalUrl||portalUrl||''));
    };

    mo.getCredential = function(/*optional*/ _portalUrl){
      var credential = null;
      _portalUrl = lang.trim(_portalUrl||portalUrl||'');
      credential = IdentityManager.findCredential(_portalUrl);
      if(credential){
        return credential;
      }
      else{
        var cookieKey = getCookieKey(_portalUrl);
        credential = getCredentialFromCookie(cookieKey);
        return credential;
      }
      return null;
    };

    mo.removeCredential = function(/*optional*/ _portalUrl){
      var c = IdentityManager.findCredential(lang.trim(_portalUrl||portalUrl||''));
      if(c){
        var credentials = IdentityManager.credentials;
        IdentityManager.credentials = array.filter(credentials,function(c2){
          return  !(c.server === c2.server && c.userId === c2.userId && c.token === c2.token);
        });
      }
    };

    function oAuth2Signin(appId) {
      OAuthHelper.init({
        appId: appId,
        portal: portalUrl, //http://www.arcgis.com
        expiration: (7 * 24 * 60), // 1 weeks, in minutes
        popup: true
      });
      var def = new Deferred();
      OAuthHelper.signIn().then(function(credential) {
        //the cookie has bee writen by OAuthHelper
        signInSuccess(credential, credential.persist);
        def.resolve(credential);
      },function(error){
        def.reject(error);
      });
      return def;
    }

    function getCredentialFromCookie(cookieKey) {
      cookieKey = lang.trim(cookieKey);
      var ckie = cookie(cookieKey);
      var credential = null;
      if (ckie) {
        var authResponse = json.parse(ckie);
        IdentityManager.registerToken(authResponse);
        var _portalUrl = authResponse.server;
        if(_portalUrl.toLowerCase().indexOf('.arcgis.com') < 0){
          _portalUrl += '/arcgis';
        }
        credential = IdentityManager.findCredential(_portalUrl, authResponse.userId || authResponse.username);
      }
      return credential;
    }

    function getCookieKey(/*optional*/ _portalUrl){
      var cookieKey = esri_auth_prefix + lang.trim(_portalUrl||portalUrl);
      if(!cookieKey.endWith('/')){
        cookieKey += '/';
      }
      return cookieKey;
    }

    function registerAllCredentialsFromCookie(){
      var strAllCookie = document.cookie;
      if(!strAllCookie){
        return;
      }
      var strCookies = strAllCookie.split(';');
      var keys = array.map(strCookies,function(strCookie){
        return lang.trim(strCookie.split('=')[0]);
      });
      keys = array.filter(keys,function(cookieKey){
        return cookieKey.startWith(esri_auth_prefix);
      });
      array.forEach(keys,function(cookieKey){
        getCredentialFromCookie(cookieKey);
      });
    }

    function signInSuccess(credential, persist) {
      //credential.server doesn't include adapter info,it's a bug,override credential.server
      if(!portalUrlUtils.isArcGIScom(credential.server)){
        credential.server = portalUrlUtils.getStandardPortalUrl(mo.getPortalUrlByCredential(credential)) + '/sharing';
      }

      esri.id.registerToken(credential);
      if (persist) {
        var _portalUrl = mo.getPortalUrlByCredential(credential);
        if(!_portalUrl.endWith('/')){
          _portalUrl += '/';
        }

        cookie(getCookieKey(_portalUrl), json.stringify(credential), {
          expires: new Date(credential.expires),
          path: cookiePath
        });
      }
      if(portalUrlUtils.isSameServer(portalUrl,credential.server)){
        var options = {};
        options[getAppMode()] = true;
        topic.publish('userSignIn', credential, options);
      }
    }

    function getAppMode(){
      var mode = 'builder';
      var url = new Url(window.location.href);
      if(url && url.query){
        var args = ioquery.queryToObject(url.query);
        mode = args.mode||'builder';
      }
      return mode;
    }

    return mo;
  });