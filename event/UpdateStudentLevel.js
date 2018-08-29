require("Utils")
require("UIUtils")
require("StudentLevelUpdates")
var requestData = {
    "studentIdentifier" : getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "studentLevelDetails" : Spark.getData().StudentLevelDetails
}

setUiDataWithResponse( updateStudentLevel( requestData ) );