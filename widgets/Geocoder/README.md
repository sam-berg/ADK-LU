## Geocoder ##
### Overview ###
Adds a geographic search box to an application. The widget defaults to the ArcGIS Online World Geocoding Service but is customizable to use one or more ArcGIS Server geocoding services.

### Attributes ###
* `geocoder`:  An object of ArcGIS API for JavaScript. See the params of [Geocoder Constructor](https://developers.arcgis.com/en/javascript/jsapi/geocoder-amd.html#geocoder1).

Example:
```
{
  "geocoder": {
    "autoComplete": true,
    "minCharacters": 3,
    "arcgisGeocoder": {
      "placeholder": "Find address or place"
    }
  }
}
```
