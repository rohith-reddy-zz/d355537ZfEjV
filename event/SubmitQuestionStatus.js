require("UIUtils")
require("Utils")
require("Constants")
require("QuestionSubmitFunctionality")

var requestData = {
    "StudentIdentifier" : getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "ExerciseId" : Spark.getData().ExerciseId,
    "TaskId" : Spark.getData().TaskId,
    "QuestionId" : Spark.getData().QuestionId,
    "QuestionStatus" : Spark.getData().QuestionStatus,
    "timestamp" : Spark.getData().Timestamp,
    "score" : Spark.getData().Score,
    "TypeId" : Spark.getData().LanguageId,
    "Type" : getConstant("LANGUAGE")
};

setUiDataWithResponse( submitQuestionData( requestData ) );