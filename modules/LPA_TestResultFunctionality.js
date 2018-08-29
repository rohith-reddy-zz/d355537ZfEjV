require("Constants");
require("Utils");

function submitTestDetails(requestData)
{   
    var response = {
        "Status" : getConstant("FAILURE"),
        "StatusCode" : getProperty("STATUS_CODES" , "NOT_FOUND"),
        "Message" : "",
        "data" : {  "invalidTests" : [],        //To store testInstance Ids if testDetails are not valid(if input fields are empty)
                    "invalidPlayerIdentifiers" : []    //To store invalid player identifiers
        }
    }
    
    if(requestData.testDetails.length)
    {
        for each(var studentTestData in requestData.testDetails)
        {
            if(Object.keys(studentTestData).length == 0)
                continue;
            if( !isNullOrEmpty( validateStudentTestData(studentTestData) ) )
            {
                response.data.invalidTests.push(studentTestData.testInstanceId);
                continue;
            }
            
            var studentIdentifier = getConduiraIdFromGameSparksId( studentTestData.playerId );
            
            if(studentIdentifier == null)
            {
                if(response.data.invalidPlayerIdentifiers.indexOf( studentTestData.playerId ) < 0)
                    response.data.invalidPlayerIdentifiers.push( studentTestData.playerId );
                continue;
            }
            
            var testTypeEnum = getEnums(getConstant("TEST_TYPE_ENUM"));
            var testStatusEnum = getEnums(getConstant("TEST_STATUS_ENUM"));

            var dataObj = {
                "StudentIdentifier" : studentIdentifier,
                "ExerciseId" : studentTestData.testId,
                "TaskId" : studentTestData.testInstanceId,
                "Score" : studentTestData.score,
                "OutOfScore" : studentTestData.totalScore,
                "TimeTakenToFinishTask" : studentTestData.timeTaken,
                "NumberOfVisits" : studentTestData.numberOfVisits,
                "TestType" : testTypeEnum[ studentTestData.testType ],
                "TestPattern" : studentTestData.testPattern,
                "StartTime" : studentTestData.testStartTime,
                "EndTime" : studentTestData.testEndTime,
                "SubjectId" : studentTestData.subjectId,
                "ProductId" : studentTestData.productId,
                "Status" : testStatusEnum[ studentTestData.status]
            }
            
            saveStudentTestResultData( dataObj , response);
        }
        
        response.Message = getProperty("RESPONSE_MESSAGES","SUCCESSFULL_CREATION");
        response.Status = getConstant("SUCCESS");
        response.StatusCode = getProperty("STATUS_CODES" , "SUCCESS");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES","NO_INPUT_DATA_FOUND");
    return response;
}

function saveStudentTestResultData( studentTestResultData , response )
{
    var studentInfoDBName = getConstant("STUDENT_INFO");
    var dataAPI = Spark.getGameDataService();
    var query = dataAPI.N("StudentIdentifier").eq(studentTestResultData.StudentIdentifier);
    var studentData = dataAPI.queryItems(studentInfoDBName, query).cursor();
    
    if(studentData.hasNext())
    {
        var studentNext = studentData.next();
        var studentProfile = studentNext.getData();
       
        var testResultDBName = getConstant("LPA_TEST_RESULT_DB");
        var que = dataAPI.N("StudentIdentifier").eq(studentTestResultData.StudentIdentifier).and(dataAPI.N("ExerciseId").eq(studentTestResultData.ExerciseId));
        var testDB = dataAPI.queryItems(testResultDBName, que).cursor();
        
        if(testDB.hasNext()) 
        {
            var testObjectReference = testDB.next();
            var testDetails = testObjectReference.getData();
            
            if(testDetails.Status && testDetails.Status == 1 && studentTestResultData.Status == 2){
                testDetails.Status = studentTestResultData.Status ;
                testDetails.Score = studentTestResultData.Score;
                testDetails.TimeTakenToFinishTask = studentTestResultData.TimeTakenToFinishTask;
                testDetails.EndTime = studentTestResultData.EndTime;
                testDetails.Numberofvisits = studentTestResultData.NumberOfVisits;
                
                updateLanguageLeaderbaord(dataAPI, studentTestResultData, studentProfile);
                testObjectReference.persistor().withAtomicIncrements().persist();
            }
        }else
        {
           
            dataAPI.createItem(testResultDBName, studentTestResultData.StudentIdentifier + studentTestResultData.ExerciseId).setData(studentTestResultData).persistor().persist();
            
            // Updating DBForSubjectLeaderBoard
            if(requestData.Status && statusEnums[ requestData.Status ] == 2)
                updateLanguageLeaderbaord(dataAPI, studentTestResultData, studentProfile);
            
        }
    }
    // else
    // {
    //     if(response.data.invalidStudentIdentifiers.indexOf(studentTestResultData.StudentIdentifier) < 0)
    //         response.data.invalidStudentIdentifiers.push(studentTestResultData.StudentIdentifier);
    // }
}

function updateLanguageLeaderbaord(dataAPI, requestData, studentProfile){
    var dbName = getConstant("SUBJECT_LEADERBOARD_INFO") , type = "SubjectId" ;
    
    var dbNameExist = dataAPI.queryItems(dbName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N(type).eq(requestData.SubjectId))).cursor();

    if( dbNameExist.hasNext() )
    {
        var DBNextElement = dbNameExist.next();
        var DBData = DBNextElement.getData();
        
        if(DBData.ExerciseData.indexOf(requestData.ExerciseId) < 0)
        {
            DBData.ExerciseData.push(requestData.ExerciseId);
            DBData.TotalScore += requestData.Score;
            DBData.TotalTimeTakenToFinishTasks += requestData.TimeTakenToFinishTask;
            DBData.Timestamp = requestData.EndTime;
         
            DBNextElement.persistor().withAtomicIncrements().persist();
        }
    }
    else
    {
        var Obj = {
            "StudentIdentifier" : requestData.StudentIdentifier,
            "SubjectId" : requestData.SubjectId,
            "ExerciseData" : [requestData.ExerciseId],
            "TotalScore" : requestData.Score,
            "TotalTimeTakenToFinishTasks" : requestData.TimeTakenToFinishTask
        }
        dataAPI.createItem(dbName, requestData.StudentIdentifier + requestData.SubjectId).setData(Obj).persistor().persist();
    }
    
    //TODO : Need to call GameSparks LeaderBoards if we want
}


function validateStudentTestData( requestData )
{
    var message = null;
    
    if( isNullOrEmpty( requestData.playerId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_PLAYER_ID");
    else if( isNullOrZero( requestData.testId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_EXCERCISE_ID");
    else if( isNullOrZero( requestData.testInstanceId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TASK_ID");
    else if( isNullOrZero( requestData.subjectId ) )  
        message = getProperty("RESPONSE_MESSAGES", "INVALID_LANGUAGE_ID");
    else if( isNaN( requestData.score ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_SCORE");
    else if( isNaN( requestData.timeTaken ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TIME_TAKEN");
    
    return message;
}



