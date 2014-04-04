define([
    'doh/runner'
],function(doh){
  var url = '/webapp/jimu.js/tests/my-test-loader.html';
   doh.register('widget manager tests',url + "?file=test-widgetmanager",30000);
   //doh.register('app config tests',url + "?file=test-config",30000);
   doh.register('data manager tests',url + "?file=test-datamanager",30000);
   doh.register('utils tests',url + "?file=test-utils",30000);
   doh.register('jquery loader tests',url + "?file=test-jquery-loader",30000);
   doh.register('order loader tests',url + "?file=test-order-loader",30000);
});
