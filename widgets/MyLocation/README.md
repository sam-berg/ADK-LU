## MyLocation ##
### Overview ###
MyLocation provides a basic button to locate and zoom to the user’s current location.

### Attributes ###
* `locateButton`: An object of ArcGIS API for JavaScript. See the params for the [LocateButton constructor](https://developers.arcgis.com/en/javascript/jsapi/locatebutton-amd.html#locatebutton1).

Example:
```
{
  "locateButton": {
    "geolocationOptions": {
      "timeout": 10000
    },
    "highlightLocation": true
  }
}
```
