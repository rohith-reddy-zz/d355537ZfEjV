require("Constants")
require("Utils")

function getGroupReports(requestData){
    var response = {
        "StatusCode": 200,
        "Status" : getConstant("SUCCESS"),
        "Message" : "",
        "data" : {
            "levelsSummary":{
                "beginner": 0,
                "intermediate": 0,
                "advanced": 0,
                "expert": 0
            },
            "averageScore": 0,
            "tasksSubmitted": 0,
            "averageTasksLevel": 0
        }
    };
    
    var studentIdentifiers = getStudentCategorySummary(requestData, response);
    getTestsSummaryOfGroup(requestData, response, studentIdentifiers);
    
    return response;
}


function getStudentCategorySummary(requestData, response){
    var dataAPI = Spark.getGameDataService();
    var studentInfoDBName = getConstant("STUDENT_INFO");
    var endLoop = false;
    var lastStudentIdentifier = 0;
    var studentIdentifiers = [];
    
    do{
        var skipCondition = dataAPI.N("StudentIdentifier").gt(lastStudentIdentifier);
        var sortQuery = dataAPI.sort("StudentIdentifier", true);
        var query = dataAPI.N("GroupIds").in(requestData.GroupId).and(skipCondition);
        
        var studentDetails = dataAPI.queryItems(studentInfoDBName, query, sortQuery).cursor();
        
        if(studentDetails == null)
            endLoop = true;
        else{
            if(studentDetails.hasNext()){
                while( studentDetails.hasNext() ){
                    var nextElement = studentDetails.next();
                    if(nextElement != null){
                        var data =  nextElement.getData();
                    
                        studentIdentifiers.push(data.StudentIdentifier);
                        
                        if(data.StudentLevels && data.StudentLevels[requestData.LanguageId]){
                            if(data.StudentLevels[requestData.LanguageId] == 1)
                                response.data.levelsSummary.beginner++;
                            if(data.StudentLevels[requestData.LanguageId] == 2)
                                response.data.levelsSummary.intermediate++;
                            if(data.StudentLevels[requestData.LanguageId] == 3)
                                response.data.levelsSummary.advanced++;
                            if(data.StudentLevels[requestData.LanguageId] == 4)
                                response.data.levelsSummary.expert++;
                        }   
                    }
                }
                
                lastStudentIdentifier = studentIdentifiers[studentIdentifiers.length - 1];
            }else{
                endLoop = true;
            }
            
            if(studentIdentifiers.length % 100 != 0)
                endLoop = true;
        }
    }while(!endLoop)
    
    return studentIdentifiers;
}

function getTestsSummaryOfGroup(requestData, response, studentIdentifiers){
    var dataAPI = Spark.getGameDataService();
    var endLoop = false;
    var studentResultsDBName = getConstant("LEADERBOARD_INFO");
    var lastTimeStamp = 0, tasksSubmitted = 0, totalScore = 0, totalTaskLevel = 0;
    var sortQuery = dataAPI.sort("timestamp", true);
    
    do{
        var query = dataAPI.N("timestamp").gt(lastTimeStamp);
        //var query = dataAPI.N("StudentIdentifier").in(studentIdentifiers).and(skipCondition);
        
        var studentTestDetails = dataAPI.queryItems(studentResultsDBName, query, sortQuery).cursor();
        
        lastTimeStamp = 0;
        
        if(studentTestDetails === null)
            endLoop = true;
        else{
            if(studentTestDetails.hasNext()){
                while( studentTestDetails.hasNext() ){
                    var nextElement = studentTestDetails.next();
                    
                    if(nextElement != null){
                        var testDetails = nextElement.getData();
                        
                        if(studentIdentifiers.indexOf( testDetails.StudentIdentifier ) > -1){
                            if(testDetails && testDetails.Status && testDetails.Status == 2){
                                tasksSubmitted++;
                                totalScore += testDetails.Score;
                            }
                            totalTaskLevel += testDetails.TaskLevel;
                            
                            lastTimeStamp = testDetails.timestamp;   
                        }
                    }
                }
                
                if(tasksSubmitted > 0){
                    response.data.averageScore = totalScore / tasksSubmitted;
                    response.data.averageTasksLevel =   totalTaskLevel / tasksSubmitted;
                    response.data.tasksSubmitted = tasksSubmitted;
                }
                
                if( lastTimeStamp === null || lastTimeStamp == 0 )
                    endLoop = true;
            }else
                endLoop = true;
        }     
    }while(!endLoop)
    
    return;
}


