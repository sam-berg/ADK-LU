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
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/promise/all',
  'dojo/store/Memory',
  'dojo/store/Observable',
  'dijit/tree/ObjectStoreModel',
  'dijit/Tree',
  'dijit/form/ComboBox',
  'esri/request',
  'jimu/dijit/Message',
  'jimu/tokenUtils',
  'jimu/dijit/LoadingShelter',
  'dojo/i18n'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, html, array, on, all,Memory,
  Observable, ObjectStoreModel, Tree, ComboBox, esriRequest, Message, tokenUtils, LoadingShelter, i18n) {
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-service-browser',
    templateString:'<div style="width:320px;"></div>',
    _store:null,
    _id : 0,
    _currentUrl:'',
    _selectedItem:null,
    _shelter:null,

    url:'',

    postMixInProperties:function(){
      var mainNls = window.jimuConfig && window.jimuConfig.nls;
      if(!mainNls){
        mainNls = i18n.getLocalization('jimu','main');
      }
      this.nls = mainNls.serviceBrowser;
    },

    postCreate: function(){
      this.inherited(arguments);
      this._shelter = new LoadingShelter({hidden:true});
      this._shelter.placeAt(this.domNode);
      this._shelter.startup();
      this._createTree();
      if(this.url){
        this.setUrl(this.url);
      }
    },

    destroy:function(){
      if(this._shelter){
        this._shelter.destroy();
        this._shelter = null;
      }
      this.inherited(arguments);
    },

    onTaskUrlSelected:function(taskUrl){/*jshint unused: false*/},

    getTaskUrl:function(){
      var url = '';
      if(this._selectedItem && this._selectedItem.type === 'task'){
        url = this._selectedItem.url;
      }
      return url;
    },

    setUrl:function(url){
      var theUrl = lang.trim(url);
      var pattern1 = /^http(s?):\/\//gi;
      var matchResult = theUrl.match(pattern1);
      if(!(matchResult && matchResult.length > 0)){
        theUrl = 'http://'+theUrl;
      }
      if(this._isStringEndWidth(theUrl,'/')){
        theUrl = theUrl.slice(0,theUrl.length-1);
      }
      var pattern2 = /arcgis\/rest\/services/i;
      if(theUrl.search(pattern2) <= 0){
        theUrl += '/arcgis/rest/services';
      }
      
      // if(this._currentUrl === theUrl){
      //   return;
      // }
      this._clear();
      this._currentUrl = theUrl;
      if(!this._currentUrl){
        return;
      }
      var root = this._getRootItem();
      if(this._isStringEndWidth(this._currentUrl,'rest/services')){
        var baseUrl = this._currentUrl;
        this._searchBaseServiceUrl(baseUrl,root);
      }
      else if(this._currentUrl.indexOf('GPServer') < 0){
        var folderUrl = this._currentUrl;
        this._searchFolderServiceUrl(folderUrl,root);
      }
      else{
        if(this._isStringEndWidth(this._currentUrl,'GPServer')){
          var gpUrl = this._currentUrl;
          this._searchGpServiceUrl(gpUrl,root);
        }
        else{
          var taskUrl = this._currentUrl;
          this._searchTaskUrl(taskUrl,root);
        }
      }
    },

    _getStringEndWidth:function(str,endStr){
      var result = '';
      var index = str.indexOf(endStr);
      if(index >= 0){
        var a = index + endStr.length;
        result = str.slice(0,a);
      }
      return result;
    },

    _getBaseServiceUrl:function(){
      return this._getStringEndWidth(this._currentUrl,'rest/services');
    },

    _getGpServiceUrl:function(){
      return this._getStringEndWidth(this._currentUrl,'GPServer');
    },

    _getServiceName:function(serviceName){
      var result = '';
      var splits = serviceName.split('/');
      result = splits[splits.length-1];
      return result;
    },

    _searchBaseServiceUrl:function(baseUrl,root){
      //url is end with 'rest/services'
      this._shelter.show();
      var def = this._getRestInfo(baseUrl);
      def.then(lang.hitch(this,function(response){
        array.forEach(response.services,lang.hitch(this,function(service){
          if(service.type === 'GPServer'){
            var item = {
              name:this._getServiceName(service.name),
              type:service.type,
              url:baseUrl+'/'+service.name+'/'+service.type,
              parent:root.id
            };
            this._addItem(item);
          }
        }));
        var folders = array.map(response.folders,lang.hitch(this,function(folderName){
          return {
            name:folderName,
            type:'folder',
            url:baseUrl+"/"+folderName,
            parent:root.id
          };
        }));
        if(folders.length === 0){
          this._shelter.hide();
          return;
        }
        var defs = array.map(folders,lang.hitch(this,function(folder){
          return this._getRestInfo(folder.url);
        }));
        all(defs).then(lang.hitch(this,function(responses){
          this._shelter.hide();
          array.forEach(responses,lang.hitch(this,function(response,index){
            var folder = folders[index];
            var specificServices = array.filter(response.services,lang.hitch(this,function(service){
              return service.type === 'GPServer';
            }));
            if(specificServices.length > 0){
              folder = this._addItem(folder);
              array.forEach(specificServices,lang.hitch(this,function(service){
                var item = {
                  name:this._getServiceName(service.name),
                  type:service.type,
                  url:baseUrl+'/'+service.name+'/'+service.type,
                  parent:folder.id
                };
                this._addItem(item);
              }));
            }
          }));
          this._checkSpecifiedServiceNum();
        }),lang.hitch(this,function(error){
          this._shelter.hide();
          console.error(error);
          this._checkSpecifiedServiceNum();
        }));
      }),lang.hitch(this,function(error){
        this._shelter.hide();
        console.error('request layer info failed',error);
        this._showRequestError();
      }));
    },

    _searchFolderServiceUrl:function(folderUrl,root){
      //url is end with folder name
      var baseUrl = this._getBaseServiceUrl();
      this._shelter.show();
      var def  = this._getRestInfo(folderUrl);
      def.then(lang.hitch(this,function(response){
        this._shelter.hide();
        if(response.services instanceof Array){
          array.forEach(response.services,lang.hitch(this,function(service){
            if(service.type === 'GPServer'){
              var item = {
                name:this._getServiceName(service.name),
                type:service.type,
                url:baseUrl+'/'+service.name+'/'+service.type,
                parent:root.id
              };
              this._addItem(item);
            }
          }));
        }
        this._checkSpecifiedServiceNum();
      }),lang.hitch(this,function(error){
        this._shelter.hide();
        console.error(error);
        this._showRequestError();
      }));
    },

    _searchGpServiceUrl:function(gpUrl,root){
      //url is end with 'GPServer'
      var splits = gpUrl.split('/');
      var gpName = splits[splits.length-2];
      this._shelter.show();
      var def = this._getRestInfo(gpUrl);
      def.then(lang.hitch(this,function(response){
        this._shelter.hide();
        var serviceItem = {
          name:gpName,
          type:'GPServer',
          url:gpUrl,
          parent:root.id
        };
        serviceItem = this._addItem(serviceItem);
        if(response.tasks instanceof Array){
          array.forEach(response.tasks,lang.hitch(this,function(taskName){
            var taskItem = {
              name:taskName,
              type:'task',
              url:gpUrl+'/'+taskName,
              parent:serviceItem.id
            };
            this._addItem(taskItem);
          }));
        }
      }),lang.hitch(this,function(error){
        this._shelter.hide();
        console.error(error);
        this._showRequestError();
      }));
    },

    _searchTaskUrl:function(taskUrl,root){
      //url is end with task name
      this._shelter.show();
      var def = this._getRestInfo(taskUrl);
      def.then(lang.hitch(this,function(response){
        this._shelter.hide();
        if(response.name){
          var taskItem = {
            name:response.name,
            type:'task',
            url:taskUrl,
            parent:root.id
          };
          this._addItem(taskItem);
          this.onTaskUrlSelected(taskUrl);
        }
        this._checkSpecifiedServiceNum();
      }),lang.hitch(this,function(error){
        this._shelter.hide();
        console.error(error);
        this._showRequestError();
      }));
    },

    _getRestInfo:function(url){
      var args = {
        url:url,
        content:{f:"json"},
        handleAs:"json",
        callbackParamName:"callback",
        timeout:10000
      };
      if(tokenUtils.userHaveSignIn()){
        var credential = tokenUtils.getCredential();
        if(credential && credential.token){
          args.content.token = credential.token;
        }
      }
      var def = esriRequest(args);
      return def;
    },

    _isStringEndWidth:function(s,endS){
      return (s.lastIndexOf(endS) + endS.length === s.length);
    },

    _clear:function(){
      this._selectedItem = null;
      var items = this._store.query({parent:'root'});
      array.forEach(items,lang.hitch(this,function(item){
        if(item && item.id !== 'root'){
          this._store.remove(item.id);
        }
      }));
    },

    _checkSpecifiedServiceNum:function(){
      var items = this._store.query({parent:'root'});
      if(items.length === 0){
        new Message({
          message:this.nls.noGpFound
        });
      }
    },

    _showRequestError:function(){
      new Message({
        message:this.nls.unableConnectTo + " " + this._currentUrl
      });
    },

    //item:{name,type,url,parent}
    _addItem:function(item){
      this._id++;
      item.id = this._id+'';
      this._store.add(item);
      return item;
    },

    _getRootItem:function(){
      return { id: 'root', name:'Services Root', type:'root'};
    },

    _createTree:function(){
      var rootItem = this._getRootItem();
      var myMemory = new Memory({
        data: [rootItem],
        getChildren: function(object){
          return this.query({parent: object.id});
        }
      });

      // Wrap the store in Observable so that updates to the store are reflected to the Tree
      this._store = new Observable(myMemory);

      var myModel = new ObjectStoreModel({
        store: this._store,
        query: { id: "root" },
        mayHaveChildren:function(item){
          return item.type !== 'task';
        }
      });

      var tree = new Tree({
        model: myModel,
        showRoot:false,
        style:{
          width:"100%"
        },
        getIconStyle:function(item, opened){
          var icon = null;
          if(item){
            var a = {
              width: "20px",
              height: "20px",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center'
            };
            var baseUrl = window.location.protocol + "//" + window.location.host + require.toUrl("jimu");
            if (item.type === 'folder'){
              icon = a;
              if(opened){
                icon.backgroundImage = "url("+baseUrl+"/css/images/folder_open.png)";
              }
              else{
                icon.backgroundImage = "url("+baseUrl+"/css/images/folder_close.png)";
              }
            }
            else if (item.type === 'GPServer') {
              icon = a;
              icon.backgroundImage = "url("+baseUrl+"/css/images/toolbox.png)";
            }
            else if(item.type === 'task'){
              icon = a;
              icon.backgroundImage = "url("+baseUrl+"/css/images/tool.png)";
            }
          }
          return icon;
        }
      });
      html.addClass(tree.domNode,'service-browser-tree');
      this.own(tree.on('open',lang.hitch(this,this._onTreeOpen)));
      this.own(tree.on('click',lang.hitch(this,this._onTreeClick)));
      tree.placeAt(this.domNode);
    },

    _onTreeOpen:function(item,node){/*jshint unused: false*/
      var children = this._store.query({parent:item.id});
      if(item.type === 'GPServer' && children.length === 0){
        var def = this._getRestInfo(item.url);
        def.then(lang.hitch(this,function(response){
          var tasks = response.tasks;
          array.forEach(tasks,lang.hitch(this,function(taskName){
            var taskItem = {
              name:taskName,
              type:"task",
              url:item.url+'/'+taskName,
              parent:item.id
            };
            this._addItem(taskItem);
          }));
        }),lang.hitch(this,function(error){
          console.error(error);
        }));
      }
    },

    _onTreeClick:function(item, node, evt){/*jshint unused: false*/
      this._selectedItem = item;
      var taskUrl = this.getTaskUrl();
      if(taskUrl){
        this.onTaskUrlSelected(taskUrl);
      }
    }

  });
});