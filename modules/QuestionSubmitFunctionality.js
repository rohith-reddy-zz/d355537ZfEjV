require("Constants")
require("Utils")

function submitQuestionData(requestData)
{
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : []
    }
    
    var dataAPI = Spark.getGameDataService();
    var studentTestResultsDBName = getConstant("STUDENT_TEST_RESULTS_INFO");
    var studentExist = dataAPI.queryItems(studentTestResultsDBName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("TaskId").eq(requestData.TaskId))).cursor();
    
    if(studentExist.hasNext())
    {
        var tasksQuestionDBName = getConstant("TASK_QUESTIONS_DB");
        var TaskData = dataAPI.queryItems(tasksQuestionDBName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("TaskId").eq(requestData.TaskId))).cursor();
        var QuestionObj =   {
                                "QuestionId" : requestData.QuestionId,
                                "QuestionStatus" : requestData.QuestionStatus,
                                "timestamp" : requestData.timestamp
                            };
        var questionDetails = null;
        
        if(TaskData.hasNext())
        {
            var nextElement = TaskData.next();
            var Data = nextElement.getData();
            questionDetails = Data;
            
            for each(var Question in Data.QuestionData)
            {
                if(Question.QuestionId == requestData.QuestionId)
                {
                    response.Message = getProperty("RESPONSE_MESSAGES", "QUESTION_DATA_EXISTS");
                    return response;
                }
            }
            
            Data.QuestionData.push(QuestionObj);
            nextElement.persistor().withAtomicIncrements().persist();
        }
        else
        {
            
            var Obj = {
                "StudentIdentifier" : requestData.StudentIdentifier,
                "TaskId" : requestData.TaskId,
                "QuestionData" : [
                        QuestionObj
                ],
                "Streak" : 0
            }
            questionDetails = Obj;
            
       }
        
        if(questionDetails)
        {
            var questionDBData = questionDetails;
            var DB = dataAPI.queryItems("DBForLeaderBoard", dataAPI.N("ExerciseId").eq(requestData.ExerciseId).and(dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier))).cursor();
            var DBElement = DB.next();
            var DBData = DBElement.getData();
                
            var timeTaken = requestData.timestamp - DBData.timestamp;
                
            DBData.Score = DBData.Score + requestData.score ;
            DBData.timeTakenToFinishTask = timeTaken ;
              
            var dbName = null ,type = null;
            if(requestData.Type == getConstant("LANGUAGE")){
                dbName = getConstant("LANGUAGE_LEADERBOARD_INFO");
                type = "LanguageId";
            }
            else if(requestData.Type == getConstant("CHAPTER")){
                 dbName = getConstant("CHAPTER_LEADERBOARD_INFO");
                 type = "ChapterId";
            }
        
            var typeDB = dataAPI.queryItems(dbName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.S(type).eq(requestData.TypeId))).cursor();
                
            if(typeDB.hasNext())
            {
                var typeDBNextElement = typeDB.next();
                var typeData = typeDBNextElement.getData();
                    
                var timeDifference = requestData.timestamp - DBData.lastQuestionSubmitTime;
                    
                DBData.lastQuestionSubmitTime = requestData.timestamp ;
                    
                if( typeData.ExerciseData.indexOf(requestData.ExerciseId) < 0 )
                    typeData.ExerciseData.push(requestData.ExerciseId);
                    
                typeData.totalScore += requestData.score ; 
                typeData.totalTimeTakenToFinishTasks += timeDifference;
                    
                typeDBNextElement.persistor().withAtomicIncrements().persist() ;
            }
            
            
            DBElement.persistor().withAtomicIncrements().persist();
            
            if(requestData.QuestionStatus == 1)
            {
                questionDBData.Streak++;
                isStreak(response , questionDBData.Streak , requestData.TaskId);
            } 
            else
            {
                questionDBData.Streak = 0
            }
            
            var TaskData = dataAPI.queryItems(tasksQuestionDBName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("TaskId").eq(requestData.TaskId))).cursor();
            dataAPI.createItem(tasksQuestionDBName, requestData.StudentIdentifier+requestData.TaskId).setData(questionDBData).persistor().persist();
        }
        
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
        response.Status = getConstant("SUCCESS");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "STUDENT_NOT_STARTED_TEST");
   
    return response;
}



//Checks for streaks
/*
    INPUT : response , studentData(Regarding particular test)
    OUTPUT : Result(Will be sent in text format)
    PROCESS : Checks for streaks and pushes the streak details into response if streak exists
*/
function isStreak(response, Streak ,TaskId)
{ 
     var responseData = {
        "Streak": 0,
        "testId": TaskId
    };
    var streakCount= [3, 5, 7, 10, 15];
    
    if(streakCount.indexOf(Streak) > -1){  
        responseData.Streak = Streak;  
    } 
    
    if(responseData.Streak > 0)
    {
        response.data.push(responseData);
    }
}