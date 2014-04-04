define([
    'doh/runner'
],function(doh){
  var url = '/webapp/jimu.js/tests/my-test-loader.html';
  doh.register('current tests',url + "?file=test-widgetmanager",30000);
});
