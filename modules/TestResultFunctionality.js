require("Utils");
require("Constants");
require("LeaderBoardFunctionality")

function testResultData(requestData)
{ 
    var response = {
        "Status" : "success",
        "Message" : "",
        "data" : {}
    }
    
    response.Message = registrationDetailsValidation(requestData);
    
    if( isNullOrEmpty( response.Message ) )
    {
        var studentInfoDBName = getConstant("STUDENT_INFO");
        var dataAPI = Spark.getGameDataService();
        var query = dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier);
        var studentData = dataAPI.queryItems(studentInfoDBName, query).cursor();
        
        if(studentData.hasNext())
        {
            var studentNext = studentData.next();
            var studentProfile = studentNext.getData();
            
            var categoryEnums = getEnums(getConstant("CATEGORY_ENUM"));
            var statusEnums = getEnums(getConstant("TEST_STATUS_ENUM"));
            
            var studentTestResultDBName = getConstant("LEADERBOARD_INFO");
            var que = dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("ExerciseId").eq(requestData.ExerciseId));
            var testDB = dataAPI.queryItems(studentTestResultDBName, que).cursor();
            
            if(testDB.hasNext())
            {
                response.Message = getProperty("RESPONSE_MESSAGES", "TEST_RESULT_UPDATED");
                var testObjectReference = testDB.next();
                var testDetails = testObjectReference.getData();
                
                if(testDetails.Status && testDetails.Status == 1 && statusEnums[ requestData.Status ] == 2){
                    testDetails.Status = statusEnums[ requestData.Status ];
                    testDetails.Score = requestData.Score;
                    testDetails.timeTakenToFinishTask = requestData.timeTakenToFinishTask;
                    testDetails.timestamp = requestData.timestamp;
                    testDetails.TestEndTime = requestData.TestEndTime;
                    testDetails.Numberofvisits = requestData.Numberofvisits;
                    testDetails.NumberOfVersions = requestData.NumberOfVersions;
                    testDetails.IsRecomended = requestData.IsRecomended;
                    
                          updateLanguageLeaderbaord(dataAPI, requestData, studentProfile);
                          LanguageAndExerciseLeaderBoard(testDetails,getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD"))
                    
                    testObjectReference.persistor().withAtomicIncrements().persist();
                }else{
                    response.Message = getProperty("RESPONSE_MESSAGES", "TEST_ALREADY_WRITTEN");
                }
            }else
            {
                var dataObj = {
                    "StudentIdentifier": requestData.StudentIdentifier,
                    "ExerciseId": requestData.ExerciseId,
                    "TaskId": requestData.TaskId,
                    "TaskLevel": requestData.TaskLevel,
                    "TaskName": requestData.TaskName,
                    "Score": requestData.Score,
                    "OutOfScore": requestData.OutOfScore,
                    "timeTakenToFinishTask": requestData.timeTakenToFinishTask,
                    "timestamp": requestData.timestamp,
                    "GroupIDs" : studentProfile.GroupIds,
                    "LanguageId": requestData.LanguageId,
                    "Category": categoryEnums[ requestData.Category ],
                    "LanguageLevel": ( studentProfile["StudentLevels"] && studentProfile["StudentLevels"][requestData.LanguageId] ) ? studentProfile["StudentLevels"][requestData.LanguageId] : 1,
                    "TestStartTime": requestData.TestStartTime,
                    "TestEndTime": requestData.TestEndTime,
                    "NumberOfvisits": requestData.NumberOfvisits,
                    "NumberOfVersions": requestData.NumberOfVersions,
                    "IsRecomended": requestData.IsRecomended,
                    "Status": statusEnums[ requestData.Status ]
                };
                
                //For query and sorting purpose storing in 2 tables(Data sets are restricted to only 5 values)
                //dataAPI.createItem(studentTestResultDBName, requestData.StudentIdentifier+requestData.ExerciseId).setData(dataObj).persistor().persist();
                
                //var leaderboardDBName = getConstant("LEADERBOARD_INFO");
                dataAPI.createItem(studentTestResultDBName, requestData.StudentIdentifier+requestData.ExerciseId).setData(dataObj).persistor().persist();
                
                 
                // Updating DBForLanguageLeaderBoard
                if(requestData.Status && statusEnums[ requestData.Status ] == 2){
                    updateLanguageLeaderbaord(dataAPI, requestData, studentProfile);
                    LanguageAndExerciseLeaderBoard(dataObj,getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD"))
                }
                response.Status = getConstant("SUCCESS");
                response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
            }
        }
        else
            response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    }

    return response; 
}

function updateLanguageLeaderbaord(dataAPI, requestData, studentProfile){
    var dbName = getConstant("LANGUAGE_LEADERBOARD_INFO") , type = "LanguageId" ;
    
    var dbNameExist = dataAPI.queryItems(dbName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N(type).eq(requestData.LanguageId))).cursor();

    if( dbNameExist.hasNext() )
    {
        var DBNextElement = dbNameExist.next();
        var DBData = DBNextElement.getData();
        
        if(DBData.ExerciseData.indexOf(requestData.ExerciseId) < 0)
        {
            DBData.ExerciseData.push(requestData.ExerciseId);
            DBData.totalScore += requestData.Score;
            DBData.totalTimeTakenToFinishTasks += requestData.timeTakenToFinishTask;
            DBData.timestamp = requestData.timestamp;
            DBData.LanguageLevel = ( studentProfile["StudentLevels"] && studentProfile["StudentLevels"][requestData.LanguageId] ) ? studentProfile["StudentLevels"][requestData.LanguageId] : 1
           
            LanguageAndExerciseLeaderBoard(DBData,getConstant("PROGRAMMING_HUB_LEADERBOARD"));
            
            DBNextElement.persistor().withAtomicIncrements().persist();
        }
    }
    else
    {
        var Obj = getObject(requestData,studentProfile.GroupIds);
        Obj.LanguageLevel = ( studentProfile["StudentLevels"] && studentProfile["StudentLevels"][requestData.LanguageId] ) ? studentProfile["StudentLevels"][requestData.LanguageId] : 1;
        dataAPI.createItem(dbName, requestData.StudentIdentifier + requestData.LanguageId).setData(Obj).persistor().persist();
        
         LanguageAndExerciseLeaderBoard(Obj,getConstant("PROGRAMMING_HUB_LEADERBOARD"));
    }
}

function registrationDetailsValidation( requestData ){
    var message = null;
    
    if( isNullOrEmpty( requestData.StudentIdentifier ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    else if( isNullOrEmpty( requestData.ExerciseId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_EXCERCISE_ID");
    else if( isNullOrEmpty( requestData.TaskId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TASK_ID");
    else if( isNullOrZero( requestData.TaskLevel ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TASK_LEVEL");
    else if( isNullOrEmpty( requestData.LanguageId ) )  
        message = getProperty("RESPONSE_MESSAGES", "INVALID_LANGUAGE_ID");
    else if( isNaN( requestData.Score ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_SCORE");
    else if( isNaN( requestData.timeTakenToFinishTask ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TIME_TAKEN");
    else if( isNullOrZero( requestData.timestamp ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TIMESTAMP");

    return message;
}


function getObject(requestData,groupIDs){
    
    var Obj = {
                "StudentIdentifier" : requestData.StudentIdentifier,
                "totalScore" : requestData.Score,
                "totalTimeTakenToFinishTasks" : requestData.timeTakenToFinishTask,
                "ExerciseData" : [requestData.ExerciseId],
                "LanguageId": requestData.LanguageId,
                "timestamp": requestData.timestamp,
                "GroupIDs" :groupIDs
            };
    
    return Obj
}

