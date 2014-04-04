define(['dojo/_base/declare', 'jimu/BaseWidget'],
  function(declare, BaseWidget){
  return declare([BaseWidget], {
    templateString: '<div></div>',

    noData: false,

    onReceiveData: function(name, widgetId, data) {
      this.widget2Data = data;
    },

    onNoData: function(widgetId) {
      this.noData = true;
    }
  });
});