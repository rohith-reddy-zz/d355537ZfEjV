require("UIUtils");
require("StudentTaskData");

var requestData = {
    "StudentIdentifier" : Spark.getData().StudentIdentifier,
    "LanguageId" : Spark.getData().LanguageId,
    "FromDate": Spark.getData().FromDate,
    "ToDate": Spark.getData().ToDate
}

setUiDataWithResponse( getStudentTaskData(requestData) );