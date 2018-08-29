require("Constants")
require("Utils")
require("LeaderBoardFunctionality")

function testNotifications() {
    require("Notifications")
    var iconUrl = getToastIcon();
    Spark.setScriptData("IconUrl", iconUrl)
}

function testEvent(){
    var skipValue = 0, limitValue = 10000, loop = 1;
    var onlinePlayers = [];
    
    do{
        var playersDetails = Spark.systemCollection("player").find({"online":true}).skip(skipValue).limit(limitValue).toArray();
        
        if(playersDetails.length && playersDetails.length == limitValue){
            skipValue = limitValue * loop;
            loop++;
        }else
            skipValue = 0;
        
        playersDetails.forEach(function(item, index){
            onlinePlayers.push( item._id.$oid );
        });
        
        if(onlinePlayers.length > 100){
            require("NotificationManager")
            sendNotifications(onlinePlayers, {"data": "hi!!"}, false);
            onlinePlayers = []
        }
    }while(skipValue != 0)
    
    if(onlinePlayers.length > 0){
        require("NotificationManager")
        sendNotifications(onlinePlayers, {"data": "hi!!"}, true);
    }
}

//Convert student identifier from string to number
function updateStudentIdentifiersDataType(){
    var playersDetails = Spark.systemCollection("player").find({}).limit(10000).toArray();
    
    playersDetails.forEach(function(item, index){
        var studentDetails = getStudentDetails(item.userName.toString());
        
        if(studentDetails != null){
            var data = studentDetails.getData();
            
            data.StudentIdentifier = Number(data.StudentIdentifier);
            
            studentDetails.persistor().withAtomicIncrements().persist();
        }
    });
}

function getStudentDetails(studentIdentifier){
    var dataAPI = Spark.getGameDataService();
    var studentDataSetName = getConstant("STUDENT_INFO");
    return dataAPI.getItem("StudentInfo", studentIdentifier).document();
}


function dropLeaderBoards(requestData){
    
    
    var multipleEnums = getEnums(getConstant("MULTIPLE_ENUM"));
    
    if(requestData.isMultiple==multipleEnums["TRUE"]){
         var leaderboards=[];
        Spark.getLeaderboards().listLeaderboards().forEach(function(item, index){
            
            var isPartitioned = Spark.getLeaderboards().getLeaderboard(item.getShortCode()).isPartitioned();
         
            if(isPartitioned){
                 
                 var partitions = Spark.getLeaderboards().getLeaderboard(item.getShortCode()).getPartitions();
                 partitions.forEach(function(Item,index){
                     leaderboards.push(Item.getShortCode());
                 });
             }
             else{
                 leaderboards.push(item.getShortCode());
             }
            
    });
    
    leaderboards.forEach(function(item, index){
           var leaderboard = Spark.getLeaderboards().getLeaderboard(item);
           if(leaderboard != null)
                leaderboard.drop(true);  
        });
    }
   else{
        
        var leaderboard = Spark.getLeaderboards().getLeaderboard(requestData.shortCode);
           if(leaderboard != null)
                leaderboard.drop(true);  
        
    }

}


function updateleaderboardsForStudentPreviousTests(requestData)
{
    var dataAPI = Spark.getGameDataService();
    var testDBName =requestData.dbName;
    var endLoop = false;
    var lastTimestamp = requestData.FromDate;
    var sortQuery = dataAPI.sort("timestamp",true);

    do{
        var queryCondition = dataAPI.N("timestamp").gt(lastTimestamp)
        
        var testInfo = dataAPI.queryItems(testDBName, queryCondition, sortQuery).cursor();
        
        if( testInfo.hasNext() )
        {
            while( testInfo.hasNext() )
            {
                var testData = testInfo.next().getData();
            
                if( testData.timestamp >= requestData.FromDate  && testData.timestamp <= requestData.ToDate ){
                
                    var playerId=getGameSparksIdFromConduiraId(testData.StudentIdentifier);
                    
                    if( testDBName == getConstant("LANGUAGE_LEADERBOARD_INFO") ){
                    
                        var Obj = getDataObject(testData,getConstant("PROGRAMMING_HUB_LEADERBOARD"));
                        Obj.LanguageLevel = (testData.LanguageLevel) ? testData.LanguageLevel : 1;
                        AddPreviousStudentTestsLeaderBoard(Obj,getConstant("PROGRAMMING_HUB_LEADERBOARD"),playerId);
                    }
                    else if( testDBName == getConstant("LEADERBOARD_INFO") ){
                        
                        var Obj = getDataObject(testData,getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD"));
                        Obj.LanguageLevel = (testData.LanguageLevel) ? testData.LanguageLevel : 1;
                        AddPreviousStudentTestsLeaderBoard(Obj,getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD"),playerId);
                    }
                }
            
                lastTimestamp = testData.timestamp;
            }
        }else
            endLoop = true;
        
        if(lastTimestamp > requestData.ToDate || lastTimestamp == null || lastTimestamp == 0)
        endLoop = true;
    
    }while(!endLoop)
}


function deletTasksFromDump(){
    var reader = Spark.getFiles().downloadableJson("DeletedTasks");
    
    if(reader != null){
        var studentsDB = getConstant("STUDENT_INFO");
        var leaderBoardDB = getConstant("LEADERBOARD_INFO");
        var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
        var dataAPI = Spark.getGameDataService();
        var sortQuery = dataAPI.sort("timestamp", true);
        
        reader.forEach(function(item){
            if(item && item.studentId && item.taskId){
                var testDetailsInDB = dataAPI.queryItems(leaderBoardDB, dataAPI.N("StudentIdentifier").eq(item.studentId), sortQuery).cursor();
                
                if(testDetailsInDB.hasNext()){
                    while(testDetailsInDB.hasNext()){
                        var nextElement = testDetailsInDB.next();
                        var testDetails = nextElement.getData();
                        
                        if( testDetails.TaskId == item.taskId ){
                            var languagueLeaderboardDetails = dataAPI.queryItems(langLBDB, dataAPI.N("StudentIdentifier").eq(item.studentId), sortQuery).cursor();
                            
                            if(languagueLeaderboardDetails.hasNext()){
                                while(languagueLeaderboardDetails.hasNext()){
                                    var langElement = languagueLeaderboardDetails.next();
                                    var langDetails = langElement.getData();
                                    
                                    if(langDetails.ExerciseData && langDetails.ExerciseData.indexOf(testDetails.ExerciseId) > -1){
                                        langDetails.ExerciseData.splice(langDetails.ExerciseData.indexOf(testDetails.ExerciseId), 1);
                                        
                                        langDetails.totalScore -= testDetails.Score;
                                        langDetails.totalTimeTakenToFinishTasks -= testDetails.timeTakenToFinishTask;
                                        
                                        langElement.persistor().withAtomicIncrements().persist();
                                    }
                                }
                            }
                            
                            saveDeletedData(testDetails);
                            nextElement.delete();
                        }
                    }
                }
            }
        });
    }
}

function saveDeletedData(data){
    var dataAPI = Spark.getGameDataService();
    var StudentDB = dataAPI.createItem("DeletedTests", data.StudentIdentifier + data.taskId);
    
    StudentDB.setData(data);
    StudentDB.persistor().persist();
}

function importAndUpdateStudentsGroups(){
    var reader = Spark.getFiles().downloadableJson("StudentGroupsData");
    
    if(reader != null){
        var studentsDB = getConstant("STUDENT_INFO");
        var leaderBoardDB = getConstant("LEADERBOARD_INFO");
        var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
        
        reader.forEach(function(item){
            if(item && item.student_identifier){
                updateStudentInfoDB(item);
                updateGroupsInLeaderboard(item.student_identifier, item.group_id, leaderBoardDB);
                updateGroupsInLeaderboard(item.student_identifier, item.group_id, langLBDB);
            }
        });
    }
}

function importAndUpdateStudentsGroupsWithParents(){
    var parentGroups = Spark.getFiles().downloadableJson("GroupsToParentGroupMapping");
    var studentGroups = Spark.getFiles().downloadableJson("StudentsToGroupsMapping");
    var completeSets = [];
    
    studentGroups.forEach(function(studentDetails){
        if(studentDetails && studentDetails.Student_Id && studentDetails.Group_Ids){
            if(isNaN(studentDetails.Group_Ids))
                studentDetails.Group_Ids = studentDetails.Group_Ids.split("|");
            else
                studentDetails.Group_Ids = [studentDetails.Group_Ids];
            
            studentDetails.Group_Ids.forEach(function(groupDetails){
                groupDetails = Number(groupDetails);
                completeSets.push({
                    "student_identifier":  studentDetails.Student_Id,
                    "group_id": groupDetails
                });
                
                var index = findIndexInData(parentGroups, "Group_Id", groupDetails)
                if(index > -1){
                    if(isNaN(parentGroups[index]["parents"]))
                        var parentGroupsIds = parentGroups[index]["parents"].split("|");
                    else
                        var parentGroupsIds = [parentGroups[index]["parents"]];
                    
                    parentGroupsIds.forEach(function(parentGroupId){
                        parentGroupId = Number(parentGroupId);
                        
                        completeSets.push({
                            "student_identifier":  studentDetails.Student_Id,
                            "group_id": parentGroupId
                        });
                    })
                }
            });
        }
    });
    
    if(completeSets.length){
        var studentsDB = getConstant("STUDENT_INFO");
        var leaderBoardDB = getConstant("LEADERBOARD_INFO");
        var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
        
        completeSets.forEach(function(item){
            if(item && item.student_identifier){
                updateStudentInfoDB(item);
                updateGroupsInLeaderboard(item.student_identifier, item.group_id, leaderBoardDB);
                updateGroupsInLeaderboard(item.student_identifier, item.group_id, langLBDB);
            }
        });
    }
}

function findIndexInData(data, property, value) {
    var result = -1;
    data.some(function (item, i) {
        if (item[property] === value) {
            result = i;
            return true;
        }
    });
    return result;
}

function updateParticularGroupInLBDB(){
    var updateGroupValue = 1568;
    
    var studentsDB = getConstant("STUDENT_INFO");
    var leaderBoardDB = getConstant("LEADERBOARD_INFO");
    var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
    var lastStudentIdentifier = 0, endLoop = false, count = 0;
    var dataAPI = Spark.getGameDataService();
    var sortQuery = dataAPI.sort("StudentIdentifier", true);
    
    do{
        var andCondition = dataAPI.N("StudentIdentifier").gt(lastStudentIdentifier);
        var query = dataAPI.N( "GroupIds" ).in( updateGroupValue ).and( andCondition )
        var studentDetails = dataAPI.queryItems (studentsDB, query, sortQuery ).cursor();
        
        lastStudentIdentifier = 0, count = 0;
        
        if(studentDetails.hasNext()){
            while(studentDetails.hasNext()){
                count++;
                var refObj = studentDetails.next();
                var studentData = refObj.getData();
                
                updateGroupsInLeaderboard(studentData.StudentIdentifier, updateGroupValue, leaderBoardDB);
                updateGroupsInLeaderboard(studentData.StudentIdentifier, updateGroupValue, langLBDB);
                lastStudentIdentifier = studentData.StudentIdentifier;
            }
        }else
            endLoop = true;
        
        if(lastStudentIdentifier === null || lastStudentIdentifier == 0 || ( count % 100 ) != 0)
            endLoop = true;
    }while(!endLoop)
}

function updateStudentInfoDB( item ){
    var studentDetails = getStudentDetails(item.student_identifier);
    
    if(studentDetails.hasNext()){
        var objRef = studentDetails.next();
        var studentData = objRef.getData();
        
        if( studentData && studentData.GroupIds && studentData.GroupIds.indexOf( item.group_id ) < 0)
            studentData.GroupIds.push(item.group_id)
        else if(studentData && !studentData.GroupIds )
            studentData.GroupIds = [item.group_id];
        
        objRef.persistor().withAtomicIncrements().persist();
    }
}

function updateGroupsInLeaderboard( studentIdentifier, groupId, dbName ){
    var lastTimestamp = 0, endLoop = false, count = 0;
    var dataAPI = Spark.getGameDataService();
    var sortQuery = dataAPI.sort("timestamp", true);
    
    do{
        var andCondition = dataAPI.N("timestamp").gt(lastTimestamp);
        var query = dataAPI.N( "StudentIdentifier" ).eq( studentIdentifier ).and( andCondition )
        var exerciseDetails = dataAPI.queryItems (dbName, query, sortQuery ).cursor();
        
        lastTimestamp = 0, count = 0;
        
        if(exerciseDetails.hasNext()){
            while(exerciseDetails.hasNext() ){
                count++;
                var refObj = exerciseDetails.next(); 
                var exerciseData = refObj.getData();
                
                if( exerciseData && exerciseData.GroupIDs && exerciseData.GroupIDs.indexOf( groupId ) < 0 )
                    exerciseData.GroupIDs.push(groupId)
                else if(exerciseData && !exerciseData.GroupIDs )
                    exerciseData.GroupIDs = [groupId];
                    UpdateStudentGroupLeaderBoard( exerciseData, groupId, dbName);
                refObj.persistor().withAtomicIncrements().persist();
                lastTimestamp = exerciseData.timestamp;
            }
        }else
            endLoop = true;
        
        if(lastTimestamp === null || lastTimestamp == 0 || ( count % 100 ) != 0)
            endLoop = true;
    }while(!endLoop)
    
   
    
}

function getStudentDetails(studentIdentifier){
    return retrieveDataFromDB( getConstant("STUDENT_INFO"), "StudentIdentifier", studentIdentifier);
}

function retrieveDataFromDB(DBName, comparisionKey, comparisionValue){
    var dataAPI = Spark.getGameDataService();
    return dataAPI.queryItems(DBName, dataAPI.N( comparisionKey ).eq( comparisionValue ) ).cursor();
}

function UpdateStudentGroupLeaderBoard(exerciseData, groupId, dbName ){
    
    
    var exerciseDB = getConstant("LEADERBOARD_INFO");
    var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
    
    var exerciseEventName=getConstant("PROGRAMMING_HUB_EXERCISE_LEADERBOARD")
    var languageEventName=getConstant("PROGRAMMING_HUB_LEADERBOARD");
    
                   if(dbName==langLBDB){
                       
                         var Obj = getDataObject(exerciseData,languageEventName);
                          Obj.LanguageLevel = (exerciseData.LanguageLevel) ? exerciseData.LanguageLevel : 1;
                          //StudentGroupLeaderBoard(Obj,languageEventName,groupId);
                   }
                   else if(dbName==exerciseDB){
                     
                        var Obj = getDataObject(exerciseData,exerciseEventName);
                        Obj.LanguageLevel = (exerciseData.LanguageLevel) ? exerciseData.LanguageLevel : 1;
                        //StudentGroupLeaderBoard(Obj,exerciseEventName,groupId);
                   }
}

function getDataObject(requestData,eventName){

    var Obj = {};
    
    if( eventName == getConstant("PROGRAMMING_HUB_LEADERBOARD") ){
    
        Obj = {
            "totalScore" : requestData.totalScore,
            "totalTimeTakenToFinishTasks" : requestData.totalTimeTakenToFinishTasks,
            "ExerciseData" : requestData.ExerciseData
            };
    }
    else{
        
        Obj = {
            "ExerciseId" : requestData.ExerciseId,
            "TaskId" : requestData.TaskId,
            "TaskLevel" : requestData.TaskLevel,
            "TaskName" : requestData.TaskName,
            "Score" : requestData.Score,
            "timeTakenToFinishTask" : requestData.timeTakenToFinishTask
        };
    }
    
        Obj.StudentIdentifier = requestData.StudentIdentifier;
        Obj.LanguageId = requestData.LanguageId;
        Obj.LanguageLevel = requestData.LanguageLevel;
        Obj.GroupIDs = requestData.GroupIDs;
        Obj.timestamp = requestData.timestamp;
    
    return Obj
}