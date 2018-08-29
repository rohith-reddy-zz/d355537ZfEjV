require("LPA_TestResultFunctionality");
require("UIUtils");

var requestData = {
    "testDetails" : Spark.getData().TestDetails
}

setUiDataWithResponse( submitTestDetails(requestData) );