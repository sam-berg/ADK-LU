## OverviewMap ##
### Overview ###
The OverviewMap widget displays the current extent of the map within the context of a larger area. The OverviewMap widget updates when the map extent changes. The extent of the main map is represented in the overview map area as a rectangle. Drag the extent rectangle to modify the extent of the main map.

### Attributes ###
* `overviewMap`: An object of ArcGIS API for JavaScript. See the params for [OverviewMap constructor](https://developers.arcgis.com/en/javascript/jsapi/overviewmap-amd.html#overviewmap1).
* `minWidth`: Number. The default is 200. This is the minimal width of OverviewMap.
* `minHeight`: Number. The default is 150. This is the minimal height of OverviewMap.
* `maxWidth`: Number. The default is 400. This is the maximum width of OverviewMap.
* `maxHeight`: Number. The default is 300. This is the maximum height of OverviewMap.

Example:
```
{
  "overviewMap":{
    "visible": false
  },
  "minWidth": 200,
  "minHeight": 150,
  "maxWidth": 400,
  "maxHeight": 300
}
```
