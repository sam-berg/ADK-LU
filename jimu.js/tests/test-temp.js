require(["doh/runner",
 'jimu/WidgetManager',
 'jimu/ConfigManager',
 'dojo/dom',
 'dojo/dom-construct',
 'dojo/query',
 'dojo/promise/all',
 'dojo/NodeList-dom'],
  function(doh, WidgetManager, ConfigManager, dom, domConstruct, query, all, nld) {
  path = '/webapp/jimu.js/tests/';
  ConfigManager.getInstance()._setConfig({
    locale: 'en-US'
  });
  doh.register("load widget tests", [
  {
    name: 'testWidgetConfigRPath',
    runTest: function (){
      var wm = WidgetManager.getInstance();
      var dohDeferred = new doh.Deferred();
      var widgetConfig = {
        "id": "testwidget34",
        "clazz": "testwidgets/Widget1/Widget.js"
      };
      wm.clearWidgets();
      wm.load(widgetConfig).then(function(widget) {
        dohDeferred.getTestCallback(function(widget) {
          doh.assertEqual('testwidgets/Widget1/Widget.js', widget.module);
          doh.assertEqual('/webapp/jimu.js/tests/testwidgets/Widget1/', widget.folderUrl);
        })(widget);
      }, function(err) {
        dohDeferred.errback(err);
      });
      return dohDeferred;
    },
    timeout: 1000
  } 
  ]);

doh.runOnLoad();
});