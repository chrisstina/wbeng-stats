import { updateExternalCalls, updateHits, updateProviderHits } from "./src";

updateHits({
  profile: "default",
  entryPoint: "flights",
  additionalData: {}
}).then((res) => {
  console.log("Done");
});

updateProviderHits({
  profile: "default",
  entryPoint: "flights",
  additionalData: {},
  provider: "M2"
}).then((res) => {
  console.log("Done provider", res);
});

updateExternalCalls({
  profile: "default",
  operationName: "api/Order/airshopping",
  provider: "M2"
},).then((res) => {
  console.log("Done", res);
});
