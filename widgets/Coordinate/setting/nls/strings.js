define({
  root: {
    outputUnit: "Output Unit",
    wkid: "Output WKID",
    label: "Output Label",
    transformationWkid: 'Transformation WKID',
    transformationLabel: 'Transformation Label',
    add: "Add",
    actions: "Actions",
    warning: "please input valid spatial reference WKID!",
    tfWarning: "please input valid datum transformation WKID!",
    helpText: {
      outputUnit: "The units for calculating location.",
      wkid: "The well-known ID of a spatial reference.",
      label: "The well-known text that defines a spatial reference.",
      transformationWkid: "The well-known id {wkid:number} for the datum transfomation to be applied on the projected geometries.",
      transformationLabel: "The  well-known text {wkt:string} for the datum transfomation to be applied on the projected geometries."
    }
  },
  "zh-cn": true
});