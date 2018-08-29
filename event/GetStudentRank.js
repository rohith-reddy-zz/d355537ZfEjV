require("UIUtils");
require("LeaderBoardFunctionality");
require("Utils")

var requestData = {
    "Type" : Spark.getData().Type,
    "TypeID" : Spark.getData().TypeID,
    "GroupLevel" : Spark.getData().GroupLevel,
    "StudentIdentifier": getConduiraIdFromGameSparksId(Spark.getData().playerId)
};

if (typeof requestData.GroupLevel === 'string' && requestData.GroupLevel.length)
    GroupLevel = JSON.parse(requestData.GroupLevel); 

setUiDataWithResponse(getLeaderBoard(requestData, false));