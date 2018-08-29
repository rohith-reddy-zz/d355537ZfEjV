require("StudentRegistration")
require("UIUtils")
require("Utils")

var requestData = {
    "studentDetails": Spark.getData().StudentDetails,
    "studentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "playerId": Spark.getData().playerId
};

setUiDataWithResponse( updateStudentDetails( requestData ) );