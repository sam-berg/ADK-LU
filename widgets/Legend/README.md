## Legend ##
### Overview ###
The Legend widget displays a label and symbol for some or all layers on the map. If specified, the legend respects scale dependencies, and only displays layers and sub layers currently visible on the map. The legend automatically updates if the visibility of a layer or sub layer changes.

### Attributes ###
* `legend`: An object of ArcGIS API for JavaScript. See the params of  [Legend Constructor](https://developers.arcgis.com/en/javascript/jsapi/legend-amd.html#legend1).

Example:
```
{
  "legend":{
    "arrangement": 0,
    "autoUpdate": true,
    "respectCurrentMapScale": true
  }
}
```
