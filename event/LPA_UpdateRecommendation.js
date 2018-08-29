// ====================================================================================================
//
// Cloud Code for LP_UpdateRecommendation, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================
require("StudentRegistration")
require("UIUtils")
require("Utils")
require("Constants")

var requestData = {
    "chapterId": Spark.getData().chapterId,
    "subjectId":Spark.getData().subjectId,
    "type":getConstant("LPA"),
    "studentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId)
}

setUiDataWithResponse( updateStudentRecommendation( requestData ) );