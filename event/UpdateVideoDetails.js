require("Utils")
require("VideosFunctionality")
require("UIUtils")

var requestData = {
    "StudentIdentifier": getConduiraIdFromGameSparksId( Spark.getData().playerId ),
    "videoLevel": Spark.getData().VideoLevel,
    "videoID": Spark.getData().VideoID,
    "status": Spark.getData().IsFinished,
    "chapterID": Spark.getData().ChapterID,
    "videosLeft" : Spark.getData().VideosLeft,
    "videoLength" : Spark.getData().VideoLength,
    "isRecommended" : Spark.getData().IsRecommended,
    "percentageCompleted" : Spark.getData().PercentageCompleted,
    "timeStamp" : Spark.getData().TimeStamp,
    "productID" : Spark.getData().ProductId,
    "subjectID" : Spark.getData().SubjectId,
    "playerId": Spark.getData().playerId
};

setUiDataWithResponse( storeVideoData(requestData) );