require("UIUtils")
require("StartTestFunctionality")
require("Utils")

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "ExerciseId": Spark.getData().ExerciseId,
    "TaskId": Spark.getData().TaskId,
    "TaskLevel": Spark.getData().TaskLevel,
    "TypeId": Spark.getData().LanguageId,
    "Type" : getConstant("LANGUAGE"),
    "timestamp": Spark.getData().Timestamp 
};

setUiDataWithResponse( startTest( requestData ) );