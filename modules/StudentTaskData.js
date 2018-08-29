require("Constants")
require("Utils")

function getStudentTaskData(requestData)
{
    var response = {
        "Status" : getConstant("SUCCESS"),
        "Message" : "",
        "data" : {
            "taskReport": []
        }
    };
    
    var dataAPI = Spark.getGameDataService();
    var dbName = getConstant("LEADERBOARD_INFO");
    var endLoop = false;
    var lastTimeStamp = requestData.FromDate;
    var sortQuery = dataAPI.sort("timestamp", true);
    
    do{
        var studentTestDB = dataAPI.queryItems(dbName, dataAPI.N("StudentIdentifier").eq(requestData.StudentIdentifier).and(dataAPI.N("timestamp").gt(lastTimeStamp))).cursor();
        lastTimeStamp = 0;
        
        if(studentTestDB.hasNext())
        {
            while(studentTestDB.hasNext())
            {
                var studentTestData = studentTestDB.next().getData();
                
                if(studentTestData.timestamp >= requestData.FromDate && studentTestData.timestamp <= requestData.ToDate && requestData.LanguageId == studentTestData.LanguageId){
                    var Obj = {
                        "TaskName" : studentTestData.TaskName ? studentTestData.TaskName : "",
                        "TaskLevel": studentTestData.TaskLevel,
                        "Category": studentTestData.Category,
                        "Score" : studentTestData.Score,
                        "TimeTaken" : studentTestData.timeTakenToFinishTask / 60,
                        "DateOfSubmission" : timeStampToDateConvertion( studentTestData.timestamp )
                    }
                    response.data.taskReport.push(Obj);
                }
                if(studentTestData.timestamp > requestData.ToDate){
                    endLoop = true;
                    break;
                }
                lastTimeStamp = studentTestData.timestamp;
            }
            
            if(lastTimeStamp == 0 || lastTimeStamp == null)
                endLoop = true;
            
            response.Message = getProperty("RESPONSE_MESSAGES" , "FETCHED_INFORMATION");
        }else
            endLoop = true;
            
    }while(!endLoop)
    
    return response;
}