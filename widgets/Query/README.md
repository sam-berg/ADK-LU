## Query ##
### Overview ###
The Query widget enables end users to query information from a map service by executing a predefined query. It works on a single layer.

### Attributes ###
* `layer`: Object. There is no default.
    - `url`: String.There is no default.  A layer URL for the layer you want to query.
    - `expression`:  String. There is no default. This takes the form of a basic SQL statement.
    - `textsearchlabel`: String. There is no default. This is the text search label in the widget.
    - `textsearchhint`: String. There is no default. This is the text search hint.
    - `titlefield`: String. The default is the displayFieldName attribute of the layer. The main field to display for query results. If not specified, uses the layer's displayFieldName attribute.
    - `linkfield`: String. There is no default. This refers to a field that contains URL values. If the URL link has an extension of .jpg, .png, or .gif, the image displays; otherwise, a clickable link displays. When the link is clicked, a new tab opens to display content referenced by the link.
    - `fields`:Object[]—There is no default. Choose the field you want to display in the output result.

Example:
```
"layer": {
    "url": "http://maps1.arcgisonline.com/ArcGIS/rest/services/USGS_Earthquake_Faults/MapServer/1",
    "expression": "NAME like '[value]'",
    "textsearchlabel": "Filter by Name  [ Example: Diamond Springs fault ]",
    "textsearchhint": "Name",
    "titlefield": "Name",
    "linkfield": "",
    "fields": {
      "all": false,
      "field": [{
        "name": "NAME",
        "alias": "Name"
      }]
    }
  }
```

* `defaultValue`: String. The default is:‘’—The default value for the query.

Example:
```
"default": 'NAME'
```

* `zoomscale`: Number; The default is —50000. For features with an unknown extent, a zoom scale can be set; otherwise, it zooms into the extent of the feature.

Example:
```
"zoomscale": 50000
```

* `symbol`:  Object. There is no default. The symbol used to represent the features.


* `shareResult`: boolean—The default is false. If true, adds the query result as an operational layer to the map.

Example:
```
"shareResult": false
```
