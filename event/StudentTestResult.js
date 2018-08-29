require("UIUtils")
require("TestResultFunctionality")
require("Utils")

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "ExerciseId": Spark.getData().ExerciseId,
    "TaskId": Spark.getData().TaskId,
    "TaskLevel": Spark.getData().TaskLevel,
    "LanguageId": Spark.getData().LanguageId,
    "Score": Spark.getData().Score,
    "timeTakenToFinishTask": Spark.getData().TimeTakenToFinishTask,
    "timestamp": Spark.getData().TestEndTime,
    "TaskName": Spark.getData().TaskName,
    "Category": Spark.getData().Category,
    "OutOfScore": Spark.getData().OutOfScore,
    "TestStartTime": Spark.getData().TestStartTime,
    "TestEndTime": Spark.getData().TestEndTime,
    "NumberOfvisits":Spark.getData().NumberOfvisits,
    "NumberOfVersions": Spark.getData().NumberOfVersions,
    "IsRecomended": Spark.getData().IsRecomended,
    "Status": Spark.getData().Status
}

setUiDataWithResponse( testResultData(requestData) ); 