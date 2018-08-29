require("AdminReports")
require("UIUtils")

var requestData = {
    "LanguageId" : Spark.getData().LanguageId,
    "GroupId": Spark.getData().GroupId
};

setUiDataWithResponse( getGroupReports(requestData) );