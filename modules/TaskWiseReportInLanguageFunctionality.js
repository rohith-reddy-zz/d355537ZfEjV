require("Constants")
require("Utils")

function getTaskWiseReport(requestData)
{
    var response = null;
    if(requestData.IncludeAll == true)
    {
        response = getOverAllTaskReport(requestData);
    }
    else
        response = getSingleTaskReportOnly(requestData);
        
    return response;
}

function getOverAllTaskReport(requestData)
{
    var response = {
        "Status" : getConstant("SUCCESS"),
        "Message" : "",
        "data" : {
            "tasksData": []
        }
    }
    
    var dataAPI = Spark.getGameDataService();
    var taskInfoDBName = getConstant("LEADERBOARD_INFO");
    var endLoop = false;
    var lastTimestamp = requestData.FromDate;
    var sortQuery = dataAPI.sort("timestamp", true);
    var responseData = {};
    
    do{
        //var skipQuery = dataAPI.N("timestamp").gt(lastTimestamp);
        //var query = dataAPI.N("LanguageId").eq(requestData.LanguageId).and( skipQuery );
        var query = dataAPI.N("timestamp").gt(lastTimestamp);
        var taskInfo = dataAPI.queryItems(taskInfoDBName, query, sortQuery).cursor();
        
        lastTimestamp = requestData.FromDate;
        
        if(taskInfo.hasNext())
        {
            while(taskInfo.hasNext())
            {
                var taskData = taskInfo.next().getData();
                if(taskData.timestamp >= requestData.FromDate && taskData.timestamp <= requestData.ToDate && taskData.GroupIDs.indexOf(requestData.GroupId) > -1 && taskData.LanguageId == requestData.LanguageId)
                {
                    if(responseData[taskData.ExerciseId]){
                        taskData.timeTakenToFinishTask = taskData.timeTakenToFinishTask;
                        responseData[taskData.ExerciseId]["No_Of_Students_Attempted"] = ++responseData[taskData.ExerciseId]["No_Of_Students_Attempted"];
                        responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] = ( taskData.Status && taskData.Status == 2 ) ? ++responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] : responseData[taskData.ExerciseId]["No_Of_Student_Submissions"];
                        responseData[taskData.ExerciseId]["AverageScore"] = (responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] != 0) ? ( ( responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] + taskData.Score ) / responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] ) : 0;
                        responseData[taskData.ExerciseId]["AverageTimeTaken"] = (responseData[taskData.ExerciseId]["No_Of_Student_Submissions"] != 0) ? ( ( responseData[taskData.ExerciseId]["AverageTimeTaken"] + taskData.timeTakenToFinishTask ) / responseData[taskData.ExerciseId]["No_Of_Student_Submissions"]) : 0;
                        
                    }else{
                        responseData[taskData.ExerciseId] = {
                                                                "TaskLevel" : taskData.TaskLevel,
                                                                "TaskName" : taskData.TaskName ? taskData.TaskName : "",
                                                                "TaskId": taskData.ExerciseId,
                                                                "Category": taskData.Category ? taskData.Category : 1,
                                                                "No_Of_Students_Attempted" : 1,
                                                                "No_Of_Student_Submissions" : ( taskData.Status && taskData.Status == 2 ) ? 1 : 0,
                                                                "AverageScore" : taskData.Score,
                                                                "AverageTimeTaken" : taskData.timeTakenToFinishTask
                                                            }
                    }
                }
                lastTimestamp = taskData.timestamp;
            }
            
            if(lastTimestamp > requestData.ToDate || lastTimestamp == requestData.FromDate)
                endLoop = true;
            
            response.Message = getProperty("RESPONSE_MESSAGES" , "FETCHED_INFORMATION");
        }else
            endLoop = true;
    }while( !endLoop )
    
    var objKeys = Object.keys( responseData );
    
    objKeys.forEach( function(key){
        response.data.tasksData.push( responseData[key] );
    });
    
    return response;
}

function getSingleTaskReportOnly(requestData)
{
    var response = {
        "Status" : getConstant("SUCCESS"),
        "Message" : "",
        "data" : {
            "taskReport": []
        }
    }
    
    var dataAPI = Spark.getGameDataService();
    var endLoop = false;
    var lastTimestamp = requestData.FromDate;
    var taskInfoDBName = getConstant("LEADERBOARD_INFO");
    var sortQuery = dataAPI.sort("timestamp", true);
    var groupName = getGroupNameFromId( requestData.GroupId );
    
    do{
        var skipQuery = dataAPI.N("timestamp").gt(lastTimestamp);
        var query = dataAPI.N("ExerciseId").eq(requestData.ExerciseId).and( skipQuery );
        var taskInfo = dataAPI.queryItems(taskInfoDBName, query, sortQuery).cursor();
        
        lastTimestamp = requestData.FromDate;
        
        if(taskInfo.hasNext())
        {
            while(taskInfo.hasNext())
            {
                var studentData = taskInfo.next().getData();
                if(studentData.timestamp >= requestData.FromDate && studentData.timestamp <= requestData.ToDate && studentData.GroupIDs.indexOf(requestData.GroupId) > -1){
                    var studentInfo = getStudentInfo(studentData.StudentIdentifier)
                    var Obj = {
                        "StudentIdentifier" : studentData.StudentIdentifier,
                        "studentName" : studentInfo.StudentName,
                        "Branch" : groupName,
                        "Score" : studentData.Score,
                        "TimeTaken" : studentData.timeTakenToFinishTask,
                        "DateOfSubmission" : timeStampToDateConvertion( studentData.timestamp )
                    }
                    response.data.taskReport.push(Obj);
                }
                lastTimestamp = studentData.timestamp;
            }
            response.Message = getProperty("RESPONSE_MESSAGES" , "FETCHED_INFORMATION");
        }
        else
            endLoop = true;
        
        if(lastTimestamp > requestData.ToDate || lastTimestamp == requestData.FromDate || lastTimestamp === null)
            endLoop = true;
    }while(!endLoop)
    
    return response;
}