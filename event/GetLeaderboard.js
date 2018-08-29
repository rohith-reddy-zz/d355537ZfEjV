require("UIUtils");
require("LeaderBoardFunctionality");

var requestData = {
    "Type" : Spark.getData().Type,
    "TypeID" : Spark.getData().TypeID,
    "GroupLevel" : Spark.getData().GroupLevel,
    "studentIdentifier": getConduiraIdFromGameSparksId(Spark.getData().playerId)
};

if (typeof requestData.GroupLevel === 'string' && requestData.GroupLevel.length)
    GroupLevel = JSON.parse(requestData.GroupLevel); 

setUiDataWithResponse(getLeaderBoard(requestData, true));