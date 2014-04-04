## HomeButton ##
### Overview ###
HomeButton provides a basic button to return to the map’s default starting extent.

### Attributes ###
* `homeButton`: An object of ArcGIS API for JavaScript. See the params of  [HomeButton Constructor](https://developers.arcgis.com/en/javascript/jsapi/homebutton-amd.html#homebutton1).
    - `extent`: Object. A JSON object for the Extent in ArcGIS JavaScript API. The default is null —The extent used to zoom to when clicked. If null, uses the starting extent. See the JSON parameter of  [Extent Constructor](https://developers.arcgis.com/en/javascript/jsapi/extent-amd.html#extent2).

Example:
```
{
  "homeButton": {
    "extent": {
      "xmin": -122.68,
      "ymin": 45.53,
      "xmax": -122.45,
      "ymax": 45.6,
      "spatialReference": {
        "wkid": 4326
      }
    }
  }
}
```
