## BasemapGallery ##
### Overview ###
The BasemapGallery widget displays a collection of basemaps from ArcGIS.com or a user-defined set of maps or image services. When a new basemap is selected from the BasemapGallery, the basemap layers are removed from the map and the new layers are added. All basemaps added to the gallery need to have the same spatial reference. If default ArcGIS.com basemaps are used, all additional items added to the gallery need to be in Web Mercator (WKIDs: 102100, 102113, and 3857). If default basemaps are not used, you can add basemaps in any spatial reference as long as all the items added to the gallery share that spatial reference. To achieve the best performance, all basemaps added to the gallery are cached (tiled) layers.

### Attributes ###
* `basemapGallery`:An object of ArcGIS API for JavaScript. See the params of [BasemapGallery Constructor](https://developers.arcgis.com/en/javascript/jsapi/basemapgallery-amd.html#basemapgallery1).
    - `basemaps`: Object[]; default: no default —An array of user-defined basemaps to display in the BasemapGallery. See the params of [Basemap Constructor](https://developers.arcgis.com/en/javascript/jsapi/basemap-amd.html#basemap1).
        - `layers`: Object[]; default: no default —An array of layers to add to the basemap. See the params of [BasemapLayer Constructor](https://developers.arcgis.com/en/javascript/jsapi/basemaplayer-amd.html#basemaplayer1).

Example:
```
{
  "basemapGallery": {
    "showArcGISBasemaps": true,
    "basemaps": [{
      "layers": [{
        "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
      }],
      "title": "Street (Customized)",
      "thumbnailUrl": "images/streets.jpg"
    }, {
      "layers": [{
        "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
      }],
      "title": "Topo (Customized)",
      "thumbnailUrl": "images/topo.jpg"
    }, {
      "layers": [{
        "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
      }],
      "title": "Imagery (Customized)",
      "thumbnailUrl": "images/imagery.jpg"
    }]
  }
}
```   
