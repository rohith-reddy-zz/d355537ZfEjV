require("Utils")
require("Constants");

function getLeaderboard(requestData){

    var response = {
        "Status" : getConstant("SUCCESS"),
        "Message" : "" ,
        "data" : {  "ResultArray" : [],
        "UserArray" : {}
        }       
    };

    response.Message = basicValidation(requestData);
    
    if( isNullOrEmpty(response.Message ) )
    {
        var shortCode = "";
        
        if( requestData.Type == getConstant("PROGRAMMING_HUB_LANGUAGE_GROUP_LEADERBOARD" ))
        {
            shortCode = requestData.Type.concat((".groupId.")).concat(String(requestData.GroupID)).concat((".languageId.")).concat(String(requestData.TypeID));
        }
        else if(requestData.Type == getConstant("PROGRAMMING_HUB_LANGUAGE_EXERCISE_LEADERBOARD"))
        {
            shortCode = requestData.Type.concat((".exerciseId.")).concat(String(requestData.TypeID)).concat((".languageId.")).concat(String(requestData.LanguageId));
        }
        
        var dataResponse = getLeaderBoardData(shortCode, requestData.Limit);
        
        for each(var element in dataResponse.data)
        {
            response.data.ResultArray.push( languageLeaderboardDetails(element, requestData.Type) );
        }
        
        userLeaderBoardData(shortCode,1);
    }
    
    return response;    
}


function getLeaderBoardData(shortCode, entryCount){

    var request = new SparkRequests.LeaderboardDataRequest();
    request.entryCount = entryCount;
    request.leaderboardShortCode = shortCode;
    var response = request.Send();
    
    return response;
}



function languageLeaderboardDetails(dataObject,type){

    var studentInfo = getStudentDetails(dataObject.studentIdentifier);
    var returnObj = {};

    if( type == getConstant("PROGRAMMING_HUB_LANGUAGE_GROUP_LEADERBOARD") ){
        returnObj = {
            "StudentLevel" : dataObject.studentLevel ? dataObject.studentLevel : 0,
            "TotalTestsTaken":dataObject.testsTaken?dataObject.testsTaken:0,
            "TotalTimeTakenToFinish":dataObject.timeTaken?dataObject.timeTaken:0
        };
    }
    else if( type == getConstant("PROGRAMMING_HUB_LANGUAGE_EXERCISE_LEADERBOARD") )
    {
        returnObj = {
            "TaskLevel":dataObject.taskLevel?dataObject.taskLevel:0,
            "TimeTakenToFinish":dataObject.timeTaken?dataObject.timeTaken:0
        };
    }
    
    returnObj.StudentIdentifier = studentInfo ? studentInfo.StudentIdentifier : 0
    returnObj.StudentName = studentInfo ? studentInfo.StudentName : ""
    returnObj.Rank = dataObject.rank?dataObject.rank:0
    returnObj.Score = dataObject.score?dataObject.score:0

    return returnObj;
}

function getStudentDetails(StudentIdentifier)
{
    var dataAPI = Spark.getGameDataService();
    var studentInfoDBName = getConstant("STUDENT_INFO");
    var studentDetails = dataAPI.queryItems(studentInfoDBName, dataAPI.N("StudentIdentifier").eq(StudentIdentifier)).cursor()
    var details = studentDetails.next();
    if(details && details.getData())
        return details.getData();
    else
        return null;
}


function basicValidation( requestData ){
    var message = null;
    
    if( requestData.TypeID && isNaN( requestData.TypeID ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_LANGUAGE_ID");
    if( requestData.GroupID && isNaN( requestData.GroupID ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_GROUP_ID");
    if( requestData.ExerciseID && isNaN(requestData.ExerciseID) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_EXCERCISE_ID");
    
    return message;
} 

function userLeaderBoardData(shortCode,entryCount){
    
    var request = new SparkRequests.LeaderboardDataRequest();
    request.entryCount = entryCount;
    request.leaderboardShortCode = shortCode;
    var response = request.SendAs(Spark.getPlayer().getPlayerId());
    
    return response;
}