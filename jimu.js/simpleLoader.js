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


(function(global){

  //load js, css files
  function loadResources(ress, onOneBeginLoad, onOneLoad, onLoad){
    var loaded = [];
    function _onOneLoad(url){
      //to avoid trigger onload more then one time
      if(loaded.indexOf(url) > -1){
        return;
      }
      loaded.push(url);
      if(onOneLoad){
        onOneLoad(url, loaded.length);
      }
      if(loaded.length === ress.length){
        if(onLoad){
          onLoad();
        }
      }
    }

    for(var i = 0; i < ress.length; i ++){
      loadResource(ress[i].type, ress[i].url, onOneBeginLoad, _onOneLoad);
    }
  }

  function loadResource(type, url, onBeginLoad, onLoad){
    if(onBeginLoad){
      onBeginLoad();
    }
    if(type === 'css'){
      loadCss(url);
    }else{
      loadJs(url);
    }

    function createElement(config) {
      var e = document.createElement(config.element);
      for (var i in config) {
        if (i !== 'element' && i !== 'appendTo') {
          e[i] = config[i];
        }
      }
      var root = document.getElementsByTagName(config.appendTo)[0];
      return (typeof root.appendChild(e) === 'object');
    }

    function loadCss(url) {
      var result = createElement({
        element: 'link',
        rel: 'stylesheet',
        type: 'text/css',
        href: url,
        onload: elementLoaded.bind(this, url),
        appendTo: 'head'
      });

      //for the browser which doesn't fire load event
      //safari update documents.stylesheets when style is loaded.
      var ti = setInterval(function() {
        var styles = document.styleSheets;
        for(var i = 0; i < styles.length; i ++){
          // console.log(styles[i].href);
          if(styles[i].href && styles[i].href.substr(styles[i].href.indexOf(url), styles[i].href.length) === url){
            clearInterval(ti);
            elementLoaded(url);
          }
        }
      }, 500);
      
      return (result);
    }

    function loadJs(url) {
      var result = createElement({
        element: 'script',
        type: 'text/javascript',
        onload: elementLoaded.bind(this, url),
        onreadystatechange: elementReadyStateChanged.bind(this, url),
        src: url,
        appendTo: 'body'
      });
      return (result);
    }

    function elementLoaded(url){
      if(onLoad){
        onLoad(url);
      }
    }
    function elementReadyStateChanged(url){
      if (this.readyState === 'loaded' || this.readyState === 'complete') {
        elementLoaded(url);
      }
    }
  }

  global.loadResources = loadResources;
  global.loadResource = loadResource;
}
)(window);
