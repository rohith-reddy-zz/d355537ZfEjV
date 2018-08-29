require("UIUtils")
require("TestResultFunctionality")
require("Utils")
require("Constants")

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "ExerciseId": Spark.getData().ExerciseId,
    "TaskId": Spark.getData().TaskId,
    "TaskLevel": Spark.getData().TaskLevel,
    "TypeId" : Spark.getData().ChapterId,
    "Score" : Spark.getData().Score,
    "timeTakenToFinishTask" : Spark.getData().TimeTakenToFinishTask,
    "timestamp" : Spark.getData().Timestamp ,
    "Type" : getConstant("CHAPTER"),
    "QuestionData" : Spark.getData().QuestionData 
}

setUiDataWithResponse( testResultData(requestData) ); 