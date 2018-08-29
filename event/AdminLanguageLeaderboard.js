require("LanguageLBBasedOnDatesFunctioanality")
require("UIUtils")

var requestData = {
    "LanguageId" : Spark.getData().LanguageId,
    "GroupId": Spark.getData().GroupId,
    "FromDate" : Spark.getData().FromDate,
    "ToDate" : Spark.getData().ToDate
}

setUiDataWithResponse( getLeaderBoardBasedOnDates(requestData) );