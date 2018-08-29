require("Utils")
require("StudentRegistration");
require("UIUtils");

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "GroupID": Spark.getData().GroupId
};

setUiDataWithResponse( updateStudentGroups(requestData) );