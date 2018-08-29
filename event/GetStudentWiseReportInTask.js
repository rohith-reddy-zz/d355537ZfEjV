require("UIUtils");
require("TaskWiseReportInLanguageFunctionality");

var requestData = {
    "ExerciseId" : Spark.getData().TaskId,
    "IncludeAll" : false,
    "FromDate": Spark.getData().FromDate,
    "ToDate": Spark.getData().ToDate,
    "GroupId": Spark.getData().GroupId
}

setUiDataWithResponse( getTaskWiseReport(requestData) );