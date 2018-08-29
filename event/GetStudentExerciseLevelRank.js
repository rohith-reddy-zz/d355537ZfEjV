require("UIUtils");
require("LeaderBoardFunctionality");
require("Utils");
require("Constants");

var requestData = {
    "Type" : getConstant("EXCERCISE_TYPE_LEADERBOARD"),
    "TypeID" : Spark.getData().ExerciseID,
    "Limit" : Spark.getData().Limit != 0 ? Spark.getData().Limit : getConstant("DEFUALT_LIMIT_FOR_LEADERBOARD"),
    "StudentIdentifier": getConduiraIdFromGameSparksId(Spark.getData().playerId)
};


setUiDataWithResponse(getLeaderBoard(requestData, false));