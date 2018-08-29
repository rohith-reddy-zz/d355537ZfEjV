require("Constants")
require("Utils")

function getLeaderBoardBasedOnDates(requestData)
{
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {
            "leaderboardDetails": []
        }
    }
    
    var dataAPI = Spark.getGameDataService();
    var testDBName = getConstant("LANGUAGE_LEADERBOARD_INFO");
    var skipQuery = false;
    var lastTimestamp = requestData.FromDate;
    var testDetails = [], endLoop = false;
    var sortQuery = dataAPI.sort("timestamp", true);
    var studentDetails = {};
    
    do{
        var skipCondition = dataAPI.N("timestamp").gt(lastTimestamp);
        var queryCondition = dataAPI.N("LanguageId").eq(requestData.LanguageId).and(skipCondition);
        var testInfo = dataAPI.queryItems(testDBName, queryCondition, sortQuery).cursor();
        
        lastTimestamp = requestData.FromDate;
        
        if(testInfo.hasNext())
        {
            while(testInfo.hasNext())
            {
                var testData = testInfo.next().getData();
                if(testData.timestamp >= requestData.FromDate && testData.timestamp <= requestData.ToDate && ( testData.GroupIDs.indexOf(requestData.GroupId) > -1 )){
                    testDetails.push(testData);
                    if(studentDetails[testData.StudentIdentifier]){
                        if(testData.Status && testData.Status == 2)
                            studentDetails[testData.StudentIdentifier]["TasksFinished"]++;
                        
                        studentDetails[testData.StudentIdentifier]["TasksAttempted"]++;
                        testData.timeTakenToFinishTask = testData.timeTakenToFinishTask;
                        studentDetails[testData.StudentIdentifier]["TotalScore"] = studentDetails[testData.StudentIdentifier]["TotalScore"] + testData.Score;
                        studentDetails[testData.StudentIdentifier]["TotalTimeTaken"] = (studentDetails[testData.StudentIdentifier]["TotalTimeTaken"] + testData.timeTakenToFinishTask );
                        studentDetails[testData.StudentIdentifier]["AverageScore"] = (studentDetails[testData.StudentIdentifier]["TotalScore"] + testData.Score ) / studentDetails[testData.StudentIdentifier]["TasksAttempted"];
                        studentDetails[testData.StudentIdentifier]["AverageTimeTaken"] = (studentDetails[testData.StudentIdentifier]["AverageTimeTaken"] + testData.timeTakenToFinishTask ) / studentDetails[testData.StudentIdentifier]["TasksAttempted"];
                    }else{
                        var studentInfo = getStudentInfo(testData.StudentIdentifier);
                        
                        if( studentInfo != null ){
                            studentDetails[testData.StudentIdentifier] = {
                                "StudentIdentifier" : testData.StudentIdentifier,
                                "StudentLevel" : ( studentInfo["StudentLevels"] && studentInfo["StudentLevels"][requestData.LanguageId] ) ? studentInfo["StudentLevels"][requestData.LanguageId] : 1,
                                "TotalScore" : testData.totalScore,
                                "TotalTimeTaken": testData.totalTimeTakenToFinishTasks,
                                "AverageScore": testData.totalScore,
                                "AverageTimeTaken" : testData.totalTimeTakenToFinishTasks,
                                "LanguageId" : requestData.LanguageId,
                                "RollNO": studentInfo.rollNumber,
                                "StudentName": studentInfo.StudentName,
                                "BranchName": getGroupNameFromId( requestData.GroupId ),
                                "TasksAttempted": 1,
                                "TasksFinished": ( testData.Status && testData.Status == 2 ) ? 1 : 0
                            }
                        }
                    }
                }
                lastTimestamp = testData.timestamp;
            }
        }else
            endLoop = true;
        
        if(lastTimestamp > requestData.ToDate || lastTimestamp == null || lastTimestamp == 0)
            endLoop = true;
    }while(!endLoop)
    
    if( testDetails.length ){
        var students = Object.keys( studentDetails );
        var listOfStudentsWithTestDetails = [];
        
        students.forEach(function(key){
            listOfStudentsWithTestDetails.push(studentDetails[key]);
        });
        
        listOfStudentsWithTestDetails = listOfStudentsWithTestDetails.sort(sortObjects);
        
        listOfStudentsWithTestDetails.forEach(function(item, index){
            item["Rank"] = ++index;
        });
        
        response.data["leaderboardDetails"] = listOfStudentsWithTestDetails;
        response.Message = getProperty("RESPONSE_MESSAGES" , "FETCHED_INFORMATION");
        response.Status = getConstant("SUCCESS");
    }else{
        response.Message = getProperty("RESPONSE_MESSAGES" , "STUDENT_DETAILS_NOT_FOUND");
    }
    
    return response;
}


function sortObjects( a, b ){
    var aObj = {
        "level": 0,
        "score": 0,
        "timeTaken": 0
    };
    var bObj = {
        "level": 0,
        "score": 0,
        "timeTaken": 0
    }; 
    
    aObj.timeTaken = a.TotalTimeTaken;
    bObj.timeTaken = b.TotalTimeTaken;
    aObj.score = a.TotalScore;
    bObj.score = b.TotalScore;
    aObj.level = a.StudentLevel;
    bObj.level = b.StudentLevel;
        
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