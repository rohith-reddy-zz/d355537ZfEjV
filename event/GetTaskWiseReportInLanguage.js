require("UIUtils");
require("TaskWiseReportInLanguageFunctionality");

var requestData = {
    "LanguageId" : Spark.getData().LanguageId,
    "IncludeAll" : true,
    "FromDate": Spark.getData().FromDate,
    "ToDate": Spark.getData().ToDate,
    "GroupId": Spark.getData().GroupId
}

setUiDataWithResponse( getTaskWiseReport(requestData) );