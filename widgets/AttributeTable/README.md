## AttributeTable ##
### Overview ###
The Attribute Table widget displays a tabular view of a feature layer’s attributes.

### Attributes ###
* `*layers`: Object[]; default: no default —An array of feature layers.
    - `*name`: String; default: no default —The name of the feature layer.
    - `*layer`: Object[]; default: no default —Reference to the feature layer.
        - `*url`: String; default: no default —URL to the ArcGIS Server REST resource that represents a feature service.
    - `selectionSymbol`: Object, a JSON object of symbol of ArcGIS JavaScript API; default: no default; Set’s the selection symbol for the feature layer.
    - `linkfield`:  String, default: no default —Refers to a field that contains URL values.
* `table`: Object; default: —No default.
    - `pageSizeOptions`: Number[]; default: no default —An optional array specifying choices to present for the rowsPerPage property in a drop-down. If unspecified or empty, no drop-down displays (the default behavior).
* `hideExportButton`: Boolean; default: false —There is not a function of exporting CSV file.

  Example:
```
{
  "layers": [{
    "name": "Wildfire Response Points",
    "layer": {
      "url": "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0"
    },
  }, {
    "name": "USA Earthquake Faults",
    "layer": {
      "url": "http://maps1.arcgisonline.com/ArcGIS/rest/services/USGS_Earthquake_Faults/MapServer/1"
    },
    "linkfield": "WWWURL"
  }],
  "table": {
    "pageSizeOptions": [25, 50, 100, 1000]
  }
}
```
