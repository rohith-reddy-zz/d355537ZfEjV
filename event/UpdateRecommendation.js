require("StudentRegistration")
require("UIUtils")
require("Utils")
require("Constants")

var requestData = {
    "chapterId": Spark.getData().chapterId,
    "type":getConstant("NON_LPA"),
    "studentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId )
}

setUiDataWithResponse( updateStudentRecommendation( requestData ) );