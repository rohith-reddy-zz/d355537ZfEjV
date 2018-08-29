require("Constants")
require("Utils")

function getVideoStatus(requestData)
{
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    if( !isNullOrEmpty( requestData.StudentIdentifier ) )
    {
        if( !isNullOrEmpty( requestData.chapterID ) )
        {
            for each(var chapterID in requestData.chapterID)
                response.data[chapterID] = checkVideoStatus(requestData, chapterID);
            
            if(response.data != null)
            {
                response.Status = getConstant("SUCCESS");
                response.Message = getProperty("RESPONSE_MESSAGES", "FETCHED_INFORMATION");
            }
        }
        else
            response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_CHAPTER_ID");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    
    return response;
}

function checkVideoStatus(requestData, chapterID)
{
    var dataObj = {
         "StudentIdentifier" : requestData.StudentIdentifier,
         "TotalNumberOfVideos" : 0,
         "CompletedVideos" : {
            "count" : 0,
            "videoIDList" : []
        },
         "NotCompletedVideos" : {
            "count" : 0,
            "videoIDList" : []
        }
    } 
    
    var dataAPI = Spark.getGameDataService(); 
    var videoDBName = getVideosDBName();
    var videoDB = dataAPI.queryItems(videoDBName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("chapterID").eq(chapterID))).cursor(); 
    
    if(videoDB.hasNext())
    {
        while(videoDB.hasNext())
        {
            var OverAllData = videoDB.next().getData();
            
            for each(var video in OverAllData.videoData)
            {
                dataObj.TotalNumberOfVideos++;
                var statusEnum = getEnums(getConstant("VIDEO_STATUS_ENUM"));
                if(video.status == statusEnum["FINISHED"])
                {
                    dataObj.CompletedVideos.count++;
                    dataObj.CompletedVideos.videoIDList.push(video.videoID);
                }
                else if(video.status == statusEnum["NOTFINISHED"])
                {
                    dataObj.NotCompletedVideos.count++;
                    dataObj.NotCompletedVideos.videoIDList.push(video.videoID);
                }
            }
        }
    }
    
    return dataObj; 
} 
 