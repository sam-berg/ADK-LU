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
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/Deferred',
    'dojo/topic',
    'esri/request',
    './portalUrlUtils',
    './tokenUtils'
  ],
  function(lang, declare, array, Deferred, topic, esriRequest, portalUrlUtils, tokenUtils) {

    var PortalClass = declare([],{
      declaredClass:'jimu.Portal',
      portalUrl:null,
      credential:null,
      user:null,//PortalUser

      constructor:function(_portalUrl){
        this.portalUrl = portalUrlUtils.getStandardPortalUrl(_portalUrl);
      },

      signIn:function(){
        var defUser = new Deferred();
        if(this.user || this.credential){
          defUser = this.getUser();
        }
        else{
          if(this.portalUrl){
            var appid = (window.appConfig && window.appConfig.appId)||'';
            tokenUtils.signIn(this.portalUrl,appid).then(lang.hitch(this,function(credential){
              this.credential = credential;
              this.getUser().then(lang.hitch(this,function(/*PortalUser*/ user){
                this.user = user;
                defUser.resolve(this.user);
              }),lang.hitch(this,function(error){
                defUser.reject(error);
              }));
            }),lang.hitch(this,function(error){
              defUser.reject(error);
            }));
          }
          else{
            setTimeout(function(){
              defUser.reject('portalUrl is undefined');
            },0);
          }
        }

        return defUser;
      },

      haveSignIn:function(){
        return tokenUtils.userHaveSignIn(this.portalUrl);
      },

      signOut:function(){
        this.credential = null;
        this.user = null;
        var credential = tokenUtils.getCredential(this.portalUrl);
        if(credential){
          tokenUtils.signOut(this.portalUrl);
        }
      },

      getUser:function(){
        var def = new Deferred();
        if(this.user){
          setTimeout(lang.hitch(this,function(){
            def.resolve(this.user);
          }),0);
        }
        else{
          if(this.credential){
            def = this._getUser(this.credential);
          }
          else{
            setTimeout(function(){
              def.reject();
            },0);
          }
        }
        return def;
      },

      queryItems:function(params){
        var def = new Deferred();

        var searchUrl = this.portalUrl + '/sharing/rest/search';
        var content = {
          f: 'json'
        };
        if (params) {
          content = lang.mixin(content, params);
        }
        var token = this.credential && this.credential.token;
        if (token) {
          content.token = token;
        }

        if (!content.sortField && !content.sortOrder) {
          content.sortField = 'title';
          content.sortOrder = 'asc';
        }

        esriRequest({
          url: searchUrl,
          handleAs: 'json',
          content: content,
          callbackParamName: 'callback',
          preventCache:true
        }).then(lang.hitch(this, function(response) {
          response.results = array.map(response.results,lang.hitch(this,function(item){
            item.credential = this.credential;
            item.portalUrl = this.portalUrl;
            return new PortalItem(item);
          }));
          def.resolve(response);
        }), lang.hitch(this, function(error) {
          def.reject(error);
        }));

        return def;
      },

      getItemData:function(itemId){
        var itemDataUrl = portalUrlUtils.getItemDataUrl(this.portalUrl,itemId);
        var args = {
          url:itemDataUrl,
          handleAs:'json',
          content:{f:'json'},
          callbackParamName:'callback',
          preventCache:true
        };
        var token = this.credential && this.credential.token;
        if(token){
          args.content.token = token;
        }
        return esriRequest(args);
      },

      _getUser:function(credential){
        var def = new Deferred();
        if(credential){
          var token = credential.token;
          var userUrl = this.portalUrl+'/sharing/rest/community/users/'+credential.userId;
          esriRequest({
            url:userUrl,
            content:{
              f:"json",
              token:token
            },
            handleAs:'json',
            callbackParamName:'callback',
            preventCache:true
          },{
            useProxy:false
          }).then(lang.hitch(this,function(user){
            user.portalUrl = this.portalUrl;
            user.credential = credential;
            this.user = new PortalUser(user);
            def.resolve(this.user);
          }),lang.hitch(this,function(error){
            def.reject(error);
          }));
        }
        else{
          setTimeout(function(){
            def.reject();
          },0);
        }
        return def;
      }
    });

    var PortalUser = declare([],{
      declaredClass: "jimu.PortalUser",
      portalUrl:null,
      credential:null,

      constructor:function(args){
        if(args){
          lang.mixin(this,args);
        }
      },

      getGroups:function(){
        var groups = [];
        if(this.groups){
          groups = array.map(this.groups,lang.hitch(this,function(group){
            group.credential = this.credential;
            group.portalUrl = this.portalUrl;
            return new PortalGroup(group);
          }));
        }
        return groups;
      }
    });

    var PortalGroup = declare([],{
      declaredClass:"jimu.PortalGroup",
      portalUrl:null,
      credential:null,

      constructor:function(args){
        if(args){
          lang.mixin(this,args);
        }
      }
    });

    var PortalItem = declare([],{
      declaredClass:"jimu.PortalItem",
      credential:null,
      portalUrl:null,
      itemUrl:null,
      token:null,
      detailsPageUrl:null,
      ownerPageUrl:null,

      constructor:function(args){
        if(args){
          lang.mixin(this,args);
        }
        this.itemUrl = portalUrlUtils.getItemUrl(this.portalUrl,this.id);
        if(!this.thumbnailUrl && this.thumbnail && this.itemUrl){
          this.thumbnailUrl = this.itemUrl + '/info/' + this.thumbnail;
        }
        this.token = this.credential && this.credential.token;
        if(this.thumbnailUrl && this.token){
          this.thumbnailUrl += '?token='+this.token;
        }
        if(this.portalUrl && this.id){
          this.detailsPageUrl = portalUrlUtils.getItemDetailsPageUrl(this.portalUrl,this.id);
        }
        if(this.portalUrl && this.owner){
          this.ownerPageUrl = portalUrlUtils.getUserProfilePageUrl(this.portalUrl,this.owner);
        }
      }
    });

    var mo = {},portals = [];

    mo.getPortal = function(portalUrl){
      for(var i=0;i<portals.length;i++){
        var portal = portals[i];
        var isSame = portalUrlUtils.isSamePortalUrl(portalUrl,portal.portalUrl);
        if(isSame){
          return portal;
        }
      }
      var newPortal = new PortalClass(portalUrl);
      portals.push(newPortal);
      return newPortal;
    };

    mo.getDefaultWebMap = function(_portalUrl){
      var def = new Deferred();
      _portalUrl = _portalUrl||'';
      _portalUrl = portalUrlUtils.getStandardPortalUrl(_portalUrl);
      var selfUrl = _portalUrl + '/sharing/portals/self';
      var def2 = esriRequest({
        url: selfUrl,
        content:{
          f:'json'
        },
        handleAs:'json',
        callbackParamName:'callback',
        timeout:40000,
        preventCache:true
      },{
        useProxy: false
      });
      def2.then(function(response){
        var id = response.defaultBasemap && response.defaultBasemap.id;
        if(id){
          def.resolve(id);
        }
        else{
          var title = response.defaultBasemap && response.defaultBasemap.title;
          var groupUrl = _portalUrl + '/sharing/rest/community/groups';
          var def3 = esriRequest({
            url: groupUrl,
            content:{
              q:response.basemapGalleryGroupQuery,
              f:'json'
            },
            handleAs:'json',
            callbackParamName: 'callback',
            preventCache:true
          },{
            useProxy: false
          });
          def3.then(function(groupResponse){
            var groups = groupResponse.results;
            if(groups.length > 0){
              var group = groups[0];
              var searchUrl = _portalUrl + '/sharing/rest/search';
              var webMapQueryStr = ' type:"Web Map" -type:"Web Mapping Application"  -type:"Layer" -type: "Map Document" -type:"Map Package" -type:"ArcPad Package" -type:"Explorer Map" -type:"Globe Document" -type:"Scene Document" -type:"Published Map" -type:"Map Template" -type:"Windows Mobile Package" -type:"Layer Package" -type:"Explorer Layer" -type:"Geoprocessing Package" -type:"Application Template" -type:"Code Sample" -type:"Geoprocessing Package" -type:"Geoprocessing Sample" -type:"Locator Package" -type:"Workflow Manager Package" -type:"Windows Mobile Package" -type:"Explorer Add In" -type:"Desktop Add In" -type:"File Geodatabase" -type:"Feature Collection Template" -type:"Code Attachment" -type:"Featured Items" -type:"Symbol Set" -type:"Color Set" -type:"Windows Viewer Add In" -type:"Windows Viewer Configuration" ';
              var queryStr = webMapQueryStr;
              queryStr += ' AND group:'+group.id + ' AND title:'+title;
              var def4 = esriRequest({
                url: searchUrl,
                content: {
                  start: 1,
                  num: 1,
                  f:'json',
                  q: queryStr
                },
                handleAs:'json',
                callbackParamName:'callback',
                preventCache:true
              },{
                useProxy: false
              });
              def4.then(function(searchResponse){
                var items = searchResponse.results;
                if(items.length > 0){
                  var item = items[0];
                  def.resolve(item.id);
                }
                else{
                  var def5 = esriRequest({
                    url: searchUrl,
                    content:{
                      start:1,
                      num:1,
                      f:'json',
                      q:webMapQueryStr,
                      sortField:'numViews',
                      sortOrder:'desc'
                    },
                    preventCache:true
                  });
                  def5.then(function(response){
                    var items = response.results;
                    if(items.length > 0){
                      var item = items[0];
                      def.resolve(item.id);
                    }
                  },function(err){
                    console.error(err);
                    def.reject(err);
                  });
                }
              },function(err){
                console.err(err);
                def.reject(err);
              });
            }
            else{
              def.reject('find none group');
            }
          },function(err){
            console.error(err);
            def.reject(err);
          });
        }
      },function(err){
        console.error('get default web map info failed',err);
        def.reject(err);
      });
      return def;
    };

    topic.subscribe('userSignIn',function(credential){
      array.forEach(portals,function(portal){
        if(!portal.credential){
          var isSame = portalUrlUtils.isSameServer(credential.server,portal.portalUrl);
          if(isSame){
            portal.credential = credential;
          }
        }
      });
    });

    topic.subscribe('userSignOut',function(portalUrl){
      array.forEach(portals,function(portal){
        var isSame = portalUrlUtils.isSamePortalUrl(portal.portalUrl,portalUrl);
        if(isSame){
          portal.signOut();
        }
      });
    });

    return mo;
  });