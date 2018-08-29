require("Constants")
require("Utils")

function startTest(requestData)
{
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    response.Message = basicValidation(requestData);
    
    if( isNullOrEmpty( response.Message ) )
    {
        var dataAPI = Spark.getGameDataService();
        var dbName = null ,type = null;
        if(requestData.Type == getConstant("LANGUAGE")){
            dbName = getConstant("LANGUAGE_LEADERBOARD_INFO");
            type = "LanguageId";
        }
        else if(requestData.Type == getConstant("CHAPTER")){
             dbName = getConstant("CHAPTER_LEADERBOARD_INFO");
             type = "ChapterId";
        }
        
        var DBExist = dataAPI.queryItems(dbName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.S(type).eq(requestData.TypeId))).cursor();
                
        if( !DBExist.hasNext() )
        {
            var Obj = getObjectToInsertIntoDB(requestData);
            dataAPI.createItem(dbName, requestData.StudentIdentifier + requestData.TypeId).setData(Obj).persistor().persist();
        }
        
        var studentTestResultsDBName = getConstant("STUDENT_TEST_RESULTS_INFO");
        var testData = dataAPI.queryItems(studentTestResultsDBName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("LanguageId").eq(requestData.LanguageId)).and(dataAPI.N("ExerciseId").eq(requestData.ExerciseId))).cursor();
        
        if(testData.hasNext())
        {
            response.Message = getProperty("RESPONSE_MESSAGES", "TEST_STARTED");
        }
        else
        {
            var studentInfo = getConstant("STUDENT_INFO");
            var studentData = dataAPI.queryItems(studentInfo,  dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier)).cursor();
            if(studentData.hasNext)
            {
                var dataObj = { 
                    "StudentIdentifier": requestData.StudentIdentifier,
                    "ExerciseId": requestData.ExerciseId,
                    "TaskId":requestData.TaskId,
                    "TaskLevel":requestData.TaskLevel,
                    "Score": 0 ,
                    "timeTakenToFinishTask": 0,
                    "timestamp":requestData.timestamp,
                    "lastQuestionSubmitTime": requestData.timestamp,
                    "GroupIDs" : studentData.next().getData().GroupIds
                 }
                //For query and sorting purpose storing in 2 tables(Data sets are restricted to only 5 values)
                dataAPI.createItem(studentTestResultsDBName, requestData.StudentIdentifier+requestData.ExerciseId).setData(dataObj).persistor().persist();
                var leaderboardDBName = getConstant("LEADERBOARD_INFO");
                dataAPI.createItem(leaderboardDBName, requestData.StudentIdentifier+requestData.ExerciseId).setData(dataObj).persistor().persist();
                    
                response.data = dataObj;
                response.Status = getConstant("SUCCESS");
                response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
            }
        }
    }
    
    return response;
}

function basicValidation( requestData ){
    var message = null;
    
    if( isNullOrEmpty(requestData.StudentIdentifier ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    else if( isNullOrEmpty( requestData.ExerciseId ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_EXCERCISE_ID");
    else if( isNullOrEmpty( requestData.TaskId ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TASK_ID");
    else if( isNullOrZero( requestData.TaskLevel ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TASK_LEVEL");
    else if( isNullOrEmpty( requestData.TypeId ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_LANGUAGE_ID");
    else if( isNullOrZero( requestData.timestamp ) ) 
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TIMESTAMP");
    
    return message;
}

