require("Utils")
require("Constants")
require("XP_Manager")
require("Notifications")

function storeVideoData(requestData)
{
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "", 
        "data" : []
    }
    
    response.Message = basicValidation(requestData);
    
    if( isNullOrEmpty( response.Message ) )
    {
        var dataObj = {
            "StudentIdentifier" : requestData.StudentIdentifier, 
            "chapterID" : requestData.chapterID,
            "isRecommended" : requestData.isRecommended,
            "videoData" : [],
            "videosLeft" : requestData.videosLeft,
            "subjectId" : requestData.subjectID,
            "productId" : requestData.productID
        }
        var objectVideo = {
            "videoID" : requestData.videoID,
            "videoLevel": requestData.videoLevel,
            "status" : requestData.status,          //isFinished or not
            "videoLength" : requestData.videoLength,
            "percentageCompleted" : requestData.percentageCompleted,
            "timeStamp" : requestData.timeStamp
        }

        var dataAPI = Spark.getGameDataService();
        var videoDBName = getVideosDBName();
        
        // TODO: need to see if we can construct a proper unique id for insert.
        // Ideally it should also have videoID as a chapter can have multiple videos
        var uniqueId = requestData.productID + "-" + requestData.chapterID + "-" + requestData.subjectID + "-" + requestData.StudentIdentifier;
        var videoStatusEnum = getEnums(getConstant("VIDEO_STATUS_ENUM"));
        
        var videoDetailsInDB = dataAPI.getItem(videoDBName, uniqueId).document();
        
        if(videoDetailsInDB != null){
            var Data = videoDetailsInDB.getData();
            
            var videoDataFound = 0, videoWatched = 0;
            //Searching if video details exist or not
            for each(var video in Data.videoData)
            {
                if(video.videoID == requestData.videoID  && videoStatusEnum["FINISHED"] == requestData.status)
                {
                    video.status = requestData.status;
                    videoDataFound = 1;
                    videoWatched = 1;
                }
                else if(video.videoID == requestData.videoID && videoStatusEnum["NOTFINISHED"] == requestData.status)
                    videoDataFound = 1
            }
            
            if(videoDataFound)
            {
                video.timeStamp = requestData.timeStamp;
                video.percentageCompleted = requestData.percentageCompleted;
                
                if(videoWatched)
                    response.Message =  getProperty("RESPONSE_MESSAGES", "VIDEO_WATCHED");
                else{
                    response.Message =  getProperty("RESPONSE_MESSAGES", "UPDATED_VIDEO_DETAILS");
                    performXpHandling(requestData.playerId, requestData.productID, requestData.isRecommended);
                }
            }
            else        //If video details doesn't exist then we have to store that video details into videoDB
            {
                Data.videoData.push(objectVideo);
                response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
                if(requestData.status == videoStatusEnum["FINISHED"]) {
                    performXpHandling(requestData.playerId, requestData.productID, requestData.isRecommended);
                }
            }
            videoDetailsInDB.persistor().withAtomicIncrements().persist();
        }else{
            dataObj.videoData.push(objectVideo);
            dataAPI.createItem(videoDBName, uniqueId).setData(dataObj).persistor().withAtomicIncrements().persist();
            response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
            if(requestData.status == videoStatusEnum["FINISHED"]) {
                performXpHandling(requestData.playerId, requestData.productID, requestData.isRecommended);
            }
        }
        
        response.Status = getConstant("SUCCESS");
    }
   
   return response;
}

function performXpHandling(playerId, productId, isRecommended) {
    var xp = storeXPForWatchingVideo(playerId, productId, isRecommended);
    if (xp > 0) {
        var msg = "You earned "+xp+" XP for completing a "+(isRecommended ? "Recommended" : "Non-Recommended") +"video."
        sendToastMessage([playerId], "XP Gained", msg, 5);
    }
}
    
function basicValidation( requestData ){
    var message = null;
    
    if( isNullOrEmpty( requestData.StudentIdentifier ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    else if( isNullOrEmpty( requestData.videoLevel ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_VIDEO_LEVEL");
    else if( isNullOrEmpty( requestData.chapterID ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_CHAPTER_ID");
    else if( isNullOrEmpty( requestData.videoID ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_VIDEO_ID");
    // else if( isNullOrEmpty( requestData.status ) )
    //     message = getProperty("RESPONSE_MESSAGES", "INVALID_STATUS");
    
    return message;
}