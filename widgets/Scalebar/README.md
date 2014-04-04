## Scalebar ##
### Overview ###
The Scalebar widget displays a scalebar on the map or in a specified HTML node. The widget respects various coordinate systems and displays units in English or metric values. When working with Web Mercator or geographic coordinate systems, the scalebar takes into account projection distortion and dynamically adjusts the scalebar.

### Attributes ###
* `scalebar`: An object of ArcGIS API for JavaScript. See the params for [Scalebar constructor](https://developers.arcgis.com/en/javascript/jsapi/scalebar-amd.html#scalebar1).

Example:
```
{
  "scalebar": {
    "scalebarStyle": "line",
    "scalebarUnit": "dual"
  }
}
```
