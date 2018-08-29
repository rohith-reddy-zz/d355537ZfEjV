require("UIUtils")
require("Constants")
require("StartTestFunctionality")
require("Utils")

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "ExerciseId": Spark.getData().ExerciseId,
    "TaskId": Spark.getData().TaskId,
    "TaskLevel": Spark.getData().TaskLevel,
    "Type" : getConstant("CHAPTER"),
    "TypeId": Spark.getData().ChapterId,
    "timestamp": Spark.getData().Timestamp 
};

setUiDataWithResponse( startTest( requestData ) );