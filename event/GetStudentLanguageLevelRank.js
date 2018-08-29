require("UIUtils")
require("LeaderBoardFunctionality");
require("Utils")
require("Constants")

var requestData = {
    "Type" : getConstant("LANGUAGE_TYPE_LEADERBOARD"),
    "TypeID" : Spark.getData().LanguageID,
    "GroupID" : Spark.getData().GroupID,
    "StudentIdentifier": getConduiraIdFromGameSparksId(Spark.getData().playerId)
};


setUiDataWithResponse(getLeaderBoard(requestData, false));