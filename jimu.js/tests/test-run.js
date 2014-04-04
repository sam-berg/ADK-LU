document.write('<script src="' + apiUrl + '"></script>');

jimuConfig = {};

require({
  packages : [{
    name : "dojo",
    location : "/dojo/dojo"
  },{
    name : "dijit",
    location : "/dojo/dijit"
  },{
    name : "dojox",
    location : "/dojo/dojox"
  },{
    name : "widgets",
    location : "/webapp/widgets"
  }, {
    name : "jimu",
    location : "/webapp/jimu.js"
  }, {
    name : "doh",
    location : "/dojo/util/doh"
  }, {
    name : "esri",
    location : apiUrl + "js/esri"
  }]
},['dojo/io-query'], function (query) {
  var search = window.location.search,file;
  file = query.queryToObject(search.substring(1, search.length)).file;
  require(['jimu/tests/' + file]);
});