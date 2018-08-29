
require("UIUtils")
require("Utils")
require("LeaderBoardFunctionality")

var requestData = {
    "Type" : getConstant("LANGUAGE_TYPE_LEADERBOARD"),
    "TypeID" : Spark.getData().LanguageID,
    "GroupID" : Spark.getData().GroupID,
    "Limit" : Spark.getData().Limit != 0 ? Spark.getData().Limit : getConstant("DEFUALT_LIMIT_FOR_LEADERBOARD"),
    "StudentIdentifier": getConduiraIdFromGameSparksId(Spark.getData().playerId)
};


setUiDataWithResponse( getLeaderBoard(requestData, true) );