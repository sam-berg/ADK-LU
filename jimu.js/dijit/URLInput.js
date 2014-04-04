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

define(['dojo/_base/declare','dijit/form/ValidationTextBox','dojo/i18n'],
function(declare, ValidationTextBox,i18n) {
  return declare([ValidationTextBox], {
    required:true,
    //regExp:'^(https?:\/\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\/\\w \\.-]*)*\/?$',
    invalidMessage:"Invalid url.",

    postMixInProperties:function(){
      this.inherited(arguments);
      var mainNls = window.jimuConfig && window.jimuConfig.nls;
      if(!mainNls){
        mainNls = i18n.getLocalization('jimu','main');
      }
      this.nls = mainNls.urlInput;
      this.invalidMessage = this.nls.invalidUrl;
    },

    validator:function(value){
      var pattern = /\/rest\/services/gi;
      var result = value.match(pattern);
      return result && result.length > 0;
    }
  });
});