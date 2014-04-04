var dojoConfig, jimuConfig, path = getPath();
/*global apiUrl:true , weinreUrl, loadResource, loadResources */

if(apiUrl.substr(apiUrl.length - 1, apiUrl.length) !== '/'){
  apiUrl = apiUrl + '/';
}

var loading = document.querySelector('#main-loading .loading');

var resources = [];
if(window.debug){
  resources.push({type: 'js', url: weinreUrl});
}

resources = resources.concat([
  {type: 'css', url: apiUrl + 'js/dojo/dojo/resources/dojo.css'},
  {type: 'css', url: apiUrl + 'js/dojo/dijit/themes/claro/claro.css'},
  {type: 'css', url: apiUrl + 'js/esri/css/esri.css'},
  {type: 'js', url: apiUrl},
  {type: 'css', url: path + 'jimu.js/css/jimu.css'}
]);

var progress;
loadResources(resources, null, function(url, i){
  loading.setAttribute('title', url);
  if(!progress){
    progress = document.createElement('div');
    progress.setAttribute('class', 'loading-progress');
    loading.appendChild(progress);
  }
  progress.style.width = (((i - 1)/resources.length) * 100) + '%';
}, function(){
  require(['jimu'], function(jimuMain){
    progress.style.width = '100%';
    jimuMain.initApp();
  });
});


if(!path){
  console.error('error path.');
}else{
  /*jshint unused:false*/
  dojoConfig = {
    parseOnLoad: false,
    async: true,
    tlmSiblingOfDojo: false,

    has: {
      'extend-esri': 1
    },
    packages : [{
      name : "widgets",
      location : path + "widgets"
    }, {
      name : "jimu",
      location : path + "jimu.js"
    }, {
      name : "themes",
      location : path + "themes"
    }]
  };

  jimuConfig = {
    loadingId: 'main-loading',
    mainPageId: 'main-page',
    layoutId: 'jimu-layout-manager',
    mapId: 'map'
  };
}

function getPath() {
  var fullPath, path;

  fullPath = window.location.pathname;
  if(fullPath === '/' || fullPath.substr(fullPath.length - 1) === '/'){
    path = fullPath;
  }else if(fullPath.split('/').pop() === 'index.html'){
    var sections = fullPath.split('/');
    sections.pop();
    path = sections.join('/') + '/';
  }else{
    return false;
  }
  return path;
}

