///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['esri3d/Camera',
  'esri/SpatialReference'],

function (Camera, SpatialReference) {
  var mo = {};

  mo.getCameraFromArray = function(arr){
    var camera = new Camera();
    camera.x = arr[0];
    camera.y = arr[1];
    camera.z = arr[2];
    camera.heading = arr[3];
    camera.tilt = arr[4];
    if(arr[5]){
      camera.spatialReference = new SpatialReference({wkid: arr[5]});
    }else{
      camera.spatialReference = new SpatialReference(4326);
    }
    return camera;
  };

  return mo;
});