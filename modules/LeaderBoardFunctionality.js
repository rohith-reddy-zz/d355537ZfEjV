require("Utils")

function getLeaderBoard(requestData, includeAll)
{
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
        //Type is type of leaderboard(excersie/langueage) and  id of the type.
        var studentData = null;
        
        if(requestData.Type.toLowerCase() == getConstant("LANGUAGE_TYPE_LEADERBOARD"))
        {
            studentData = getLanguageLeaderboardDetails(requestData);
            
            if(studentData == null)
            {
                response.Status = getConstant("SUCCESS");
                response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
                return response;
            }
        }
        else if(requestData.Type.toLowerCase() == getConstant("EXCERCISE_TYPE_LEADERBOARD"))
        {
            studentData = getExerciseLeaderboardDetails(requestData);
            
            if(studentData == null)
            {
                response.Status = getConstant("SUCCESS");
                response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
                return response;
            }
        }
        
        var studentDetails = studentData.sort(sortByTimeTaken);

        response = getLeaderBoardForStudentData(requestData, response, studentDetails, includeAll, 0);  
        
        if(!includeAll && Object.keys(response.data.UserArray).length == 0){
            var student =   {
                                "StudentIdentifier": requestData.StudentIdentifier
                            };
            response.data.UserArray = getUserLeaderboardDetails( student, requestData.Type, 0 );
        }
    }

    return response;  
}

function getLanguageLeaderboardDetails(requestData){
    var endLoop = false, skipQuery = false, lastTimestamp = 0;
    var studentData = null;
    var testDetails = [];
    var dataAPI = Spark.getGameDataService(); 
    var leaderBoardBDName = getConstant("LANGUAGE_LEADERBOARD_INFO");
    var sortQuery = dataAPI.sort("timestamp", true).add("LanguageLevel", false);
        
    do{
        if(skipQuery){
            var conditionQuery = dataAPI.N("timestamp").gt(lastTimestamp);
            var queryCodition = dataAPI.N("LanguageId").eq(requestData.TypeID).and(conditionQuery);
        }else{
            var queryCodition = dataAPI.N("LanguageId").eq(requestData.TypeID);
            skipQuery = true;
        }
        studentData = dataAPI.queryItems(leaderBoardBDName, queryCodition, sortQuery).cursor();
        lastTimestamp = 0;
        
        if(studentData == null){
            endLoop = true;
        }else{
            if(studentData.hasNext()){
                while(  studentData.hasNext() ){
                    var data = studentData.next().getData();
                    
                    if( requestData.GroupID == 0 || ( data && data.GroupIDs && data.GroupIDs.indexOf( requestData.GroupID ) > -1 ))
                        testDetails.push(data);
                }
                lastTimestamp = data.timestamp;
            }else
                endLoop = true;
        }
        
        if(lastTimestamp == null || lastTimestamp == 0)
            endLoop = true;
    }while(!endLoop)
    
    return testDetails;
}

function getExerciseLeaderboardDetails(requestData){
    var endLoop = false, skipQuery = false;
    var lastScore = 0, lastTimeStamp = 0;
    var studentData = null;
    var testDetails = [];
    var dataAPI = Spark.getGameDataService();
    var leaderBoardBDName = getConstant("LEADERBOARD_INFO");
    var sortQuery = dataAPI.sort("timestamp", true).add("TaskLevel", false);
    
    do{
        if(skipQuery){
            var skipCondition = dataAPI.N("timestamp").gt(lastTimeStamp);
            var queryCondition = dataAPI.N("ExerciseId").eq(requestData.TypeID).and(skipCondition);
        }else{
            var queryCondition = dataAPI.N("ExerciseId").eq(requestData.TypeID);
            skipQuery = true;
        }
        
        studentData = dataAPI.queryItems(leaderBoardBDName, queryCondition, sortQuery ).cursor();
        lastTimeStamp = 0;
        
        if(studentData == null){
            endLoop = true;
        }else{
            if(studentData.hasNext()){
                while( studentData.hasNext() ){
                    var data = studentData.next().getData();
                    
                    testDetails.push(data);
                    lastTimeStamp = data.timestamp;
                }
            }else{
                endLoop = true;
            }
            
            if(lastTimeStamp == null || lastTimeStamp == 0)
                endLoop = true;
        }
    }while(!endLoop)
    
    return testDetails;
}

function getLeaderBoardForStudentData(requestData, response, studentDetails, includeAll, rank)
{
    var dataAPI = Spark.getGameDataService();
    var LeaderBoard = null;
    if(studentDetails.length > 0){
        setLeaderboardDetails(requestData, response, studentDetails, includeAll, rank);
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
        
    return response;
}

function setLeaderboardDetails(requestData, response, studentDetails, includeAll, Rank)
{
    var dataAPI = Spark.getGameDataService();
    
    for each(var student in studentDetails)
    {
        ++Rank;
        
        if( includeAll && response.data.ResultArray.length < requestData.Limit ){
            response.data.ResultArray.push(getUserLeaderboardDetails( student, requestData.Type, Rank) );
            
            if(student.StudentIdentifier == requestData.StudentIdentifier)
                response.data.UserArray = response.data.ResultArray[ response.data.ResultArray.length - 1 ];
                
        }
        
        if( Object.keys(response.data.UserArray).length == 0 && student.StudentIdentifier == requestData.StudentIdentifier)
            response.data.UserArray = getUserLeaderboardDetails( student, requestData.Type, Rank );
        
        if(response.data.ResultArray.length >= requestData.Limit &&  response.data.UserArray.length)
        {
            break;
        }
    }
    
    response.Status = getConstant("SUCCESS");
    response.Message = getProperty("RESPONSE_MESSAGES", "FETCHED_INFORMATION");
    
    return response;
}

function getUserLeaderboardDetails( student, type, Rank){
    var studentInfo = getStudentDetailsData(student.StudentIdentifier ) ;
    var returnObj = {
                        "StudentIdentifier" : student ? student.StudentIdentifier : 0,
                        "StudentName" : studentInfo ? studentInfo.StudentName : "",
                        "StudentLevel" : student.LanguageLevel ? student.LanguageLevel : 0,
                        "Rank" : Rank
                    };
    
    if(type == getConstant("LANGUAGE_TYPE_LEADERBOARD")){
        student.totalTimeTakenToFinishTasks = student.totalTimeTakenToFinishTasks;
        returnObj["TotalTestsTaken"] = ( student.ExerciseData && student.ExerciseData.length ) ? student.ExerciseData.length : 0;
        returnObj["Score"] = student.totalScore ? student.totalScore : 0;
        returnObj["TotalTimeTakenToFinish"] = student.totalTimeTakenToFinishTasks ? student.totalTimeTakenToFinishTasks : 0;
    }else{
        returnObj["TaskLevel"] = student.TaskLevel ? student.TaskLevel : 1;
        returnObj["Score"] = student.Score ? student.Score : 0;
        returnObj["TimeTakenToFinish"] = student.timeTakenToFinishTask ? student.timeTakenToFinishTask : 0;
    }
    
    return returnObj;
}


function getOverAllLeaderBoard(requestData, response, studentDetails, includeAll)
{
    var dataAPI = Spark.getGameDataService();
    var LeaderBoard = [] , Rank = 0;
   
    for each(var student in studentDetails)
    {
        ++Rank;
        if(  includeAll || student.StudentIdentifier == requestData.StudentIdentifier ){
            
            var studentInfo = getStudentDetailsData(student.StudentIdentifier) ; 
            
            if(requestData.Type.toLowerCase() == getConstant("LANGUAGE_TYPE_LEADERBOARD") )
            {
                
                LeaderBoard.push({  "StudentIdentifier" : student.StudentIdentifier,
                                        "StudentName" : studentInfo.StudentName,
                                        "StudentLevel" : studentInfo.StudentLevel,
                                        "TotalTestsTaken" : student.ExerciseData.length ,
                                        "Score" : student.totalScore,
                                        "TotalTimeTakenToFinish" : student.totalTimeTakenToFinishTasks,
                                        "Rank" : Rank
                                 });
            }
            else if(requestData.Type.toLowerCase() == getConstant("EXCERCISE_TYPE_LEADERBOARD") )
            {
                 LeaderBoard.push({  "StudentIdentifier" : student.StudentIdentifier,
                                        "StudentName" : studentInfo.StudentName,
                                        "StudentLevel" : studentInfo.StudentLevel,
                                        "TaskLevel" : student.TaskLevel,
                                        "Score" : student.Score,
                                        "TimeTakenToFinish" : student.timeTakenToFinishTask,
                                        "Rank" : Rank
                            });
            }
            
            if( student.StudentIdentifier == requestData.StudentIdentifier )
            {
                response.data.UserArray = LeaderBoard[ LeaderBoard.length - 1 ] ;
            }
            
            if(includeAll == false)
            {
                break;
            }
        }
        
    }
    for(var limit = 0,len = LeaderBoard.length ; ( limit < requestData.Limit && len != 0 ) ; limit++,len--)
        response.data.ResultArray.push(LeaderBoard[limit]);
        
    response.Status = getConstant("SUCCESS");
    response.Message = getProperty("RESPONSE_MESSAGES", "FETCHED_INFORMATION");

}

function getAllBranches(GroupID)
{
    if(isNaN(GroupID) || GroupID == 0)
        return [];
    
    var dataAPI = Spark.getGameDataService() ;
    var GroupIDs = [GroupID];
    var DBName = getConstant("GROUPSDB")
    var GroupDB = dataAPI.queryItems(DBName, dataAPI.N("GroupID").eq(GroupID)).cursor();
    
    if(GroupDB.hasNext())
    {
        var GroupDetails = GroupDB.next().getData();
        for each(var child in GroupDetails.ChildData)
        {
            if(GroupIDs.indexOf(child)<0)
                GroupIDs.push(child);
        }
    }
    return GroupIDs ;
}

function sortByTimeTaken( a, b ){
    var aObj = {
        "score": 0,
        "timeTaken": 0,
        "level": 0
    };
    var bObj = {
        "score": 0,
        "timeTaken": 0,
        "level": 0
    };
    
    if(a.timeTakenToFinishTask){
        aObj.timeTaken = a.StudentIdentifier ? a.StudentIdentifier : 0;
        bObj.timeTaken = b.StudentIdentifier ? b.StudentIdentifier : 0;
        aObj.score = a.Score ? a.Score : 0;
        bObj.score = b.Score ? b.Score : 0;
        aObj.level  = a.TaskLevel ? a.TaskLevel : 0;
        bObj.level = b.TaskLevel ? b.TaskLevel : 0;
    }else if(a.totalTimeTakenToFinishTasks){
        aObj.timeTaken = a.totalTimeTakenToFinishTasks ? a.totalTimeTakenToFinishTasks : 0;
        bObj.timeTaken = b.totalTimeTakenToFinishTasks ? b.totalTimeTakenToFinishTasks : 0;
        aObj.score = a.totalScore ? a.totalScore : 0;
        bObj.score = b.totalScore ? b.totalScore : 0;
        aObj.level = a.LanguageLevel ? a.LanguageLevel : 0;
        bObj.level = b.LanguageLevel ? b.LanguageLevel : 0;
    }
    
    if(aObj.level == bObj.level){
        if(aObj.score == bObj.score){
            //return aObj.timeTaken - bObj.timeTaken;
            return 0;
        }else
            return bObj.score - aObj.score;
    }else
        return bObj.level - aObj.level;

    return 0;
}

function getStudentDetailsData(StudentIdentifier)
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

function getStudentIDsAndExerciseIDs(languageId)
{
    var response = {
        "StudentID": [],
        "ExerciseID": []
    };
    
    var studentTestResultDBName = getConstant("STUDENT_TEST_RESULTS_INFO");
    var dataAPI = Spark.getGameDataService();
    var studentInfo = dataAPI.queryItems(studentTestResultDBName, dataAPI.N("LanguageId").eq(requestData.TypeID)).cursor();
    var StudentID = [], ExerciseID = [];
    
    if(studentInfo.hasNext())
    {
        while(studentInfo.hasNext())
        {
            var student = studentInfo.next().getData();
            if(StudentID.indexOf(student.StudentIdentifier) < 0)
                response.StudentID.push(student.StudentIdentifier);
            if(ExerciseID.indexOf(student.ExerciseId) < 0)
                response.ExerciseID.push(student.ExerciseId);
        }
    }
    
    return response;
}

function LanguageAndExerciseLeaderBoard(dataObj,eventName){
    
    for each(var groupId in dataObj.GroupIDs){
    
       var request = new SparkRequests.LogEventRequest();
       getRequestData(request,dataObj,eventName,groupId);
        var response = request.ExecuteAs(Spark.getPlayer().getPlayerId());
    }
}

function AddPreviousStudentTestsLeaderBoard(dataObj,eventName,playerId){
    
    for each(var groupId in dataObj.GroupIDs){
    
        var request = new SparkRequests.LogEventRequest();
        getRequestData(request,dataObj,eventName,groupId);
        var response = request.ExecuteAs(playerId);
    }
}


function StudentGroupLeaderBoard(dataObj,eventName,groupId){
    
      var request = new SparkRequests.LogEventRequest();
        getRequestData(request,dataObj,eventName,groupId);
        var response = request.ExecuteAs(Spark.getPlayer().getPlayerId());
}

function getRequestData(request,dataObj,eventName,groupId){
    
         request.eventKey =eventName;
         request.languageId =dataObj.LanguageId;
         request.groupId =groupId;
         request.studentIdentifier=dataObj.StudentIdentifier;
    
       if(eventName==getConstant("PROGRAMMING_HUB_LEADERBOARD"))
        {
              request.studentLevel=dataObj.LanguageLevel;
              request.testsTaken =dataObj.ExerciseData.length;
              request.score =dataObj.totalScore;
              request.timeTaken =dataObj.totalTimeTakenToFinishTasks;
        }
        else if(eventName==getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD")){
            
             request.exerciseId =dataObj.ExerciseId;
             request.taskLevel =dataObj.TaskLevel;
              request.score =dataObj.Score;
              request.timeTaken =dataObj.timeTakenToFinishTask;
              request.taskName=dataObj.TaskName;
        }
    return request;
}


/*function getLeaderboardDataAfterSkipped( requestData, dataAPI, lastValue, timeValue ){
    if(requestData.Type.toLowerCase() == getConstant("LANGUAGE_TYPE_LEADERBOARD"))
    {
        var leaderBoardBDName = getConstant("LANGUAGE_LEADERBOARD_INFO");
        
        var sortQuery = dataAPI.sort("totalScore", false).add("totalTimeTakenToFinishTasks", true);
        if(lastValue == 0)
            var andCondition = dataAPI.N("totalTimeTakenToFinishTasks").gt(timeValue);
        else
            var andCondition = dataAPI.N("totalScore").lt(lastValue);
            
        studentData = dataAPI.queryItems(leaderBoardBDName, dataAPI.N("LanguageId").eq(requestData.TypeID).and(andCondition), sortQuery).cursor();
    }
    else if(requestData.Type.toLowerCase() == getConstant("EXCERCISE_TYPE_LEADERBOARD"))
    {
        var leaderBoardBDName = getConstant("LEADERBOARD_INFO");
        var sortQuery = dataAPI.sort("Score", false).add("TaskLevel", false);  //("TaskLevel", false).add
        studentData = dataAPI.queryItems(leaderBoardBDName, dataAPI.N("ExerciseId").eq(requestData.TypeID) , sortQuery ).cursor();
    }
    
    return studentData;
}*/