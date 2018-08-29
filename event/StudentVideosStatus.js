require("Utils")
require("UIUtils")
require("VideoStatusFunctionality");

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "chapterID": Spark.getData().ChapterID
}

setUiDataWithResponse ( getVideoStatus(requestData) );