//Module which contains all the functions to get constants from properties
require("Constants")
//Module which contains base functions
require("Utils")
//require("ManagingScripts");

function SetStudentInfo(requestData)
{
    var response = {
        "StatusCode": 501,
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    response.Message = registrationDetailsValidation(requestData);
    
    if(isNullOrEmpty(response.Message))
    {
        var validGroups = [], invalidGroupIds = [];
                
        if(requestData.StudentDetails['GroupID']){
            requestData.StudentDetails['GroupID'].forEach(function(groupId){
        // if(requestData.GroupID){
        //     requestData.GroupID.forEach(function(groupId){
                if( groupId && !isNaN(groupId) && groupIdValidation(groupId) == null )
                {
                    validGroups.push(Number(groupId));
                }else{
                    invalidGroupIds.push(groupId);
                }
            });
        }
        
        var studentData = getStudentDetails(requestData.StudentIdentifier);
        
        //If student is already regstered then add groupId
        if(studentData.hasNext())
        {
            var nextElement = studentData.next();
            var student = nextElement.getData();
            
            validGroups.forEach(function(groupId){
                if(groupId && student.GroupIds.indexOf(groupId) < 0){
                    student.GroupIds.push(groupId);
                }
            });
            
            student = setStudentDetails(student, requestData.StudentDetails, ['GroupID']);
            
            nextElement.persistor().withAtomicIncrements().persist();
            response.data["playerId"] = getGameSparksIdFromConduiraId( requestData.StudentIdentifier );
            
            if(invalidGroupIds.length){
                response.data["invalidGroups"] = invalidGroupIds;
                response.StatusCode = 502;
                response.Message = getProperty("RESPONSE_MESSAGES", "PARTIAL_UPDATE");
            }else{
                response.StatusCode = 201;
                response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_EXISTS");
            }
        }
        else
        {
            
            requestData.StudentDetails['GroupIds'] = validGroups;
                
            delete requestData.StudentDetails['GroupID'];
            
            // requestData.GroupIds = validGroups;
            
            // delete requestData.GroupID;
            
            var studentDataSetName = getConstant("STUDENT_INFO"); 
            
            var playerIdentity = registerUser(requestData, response);
            
            if( !isNullOrEmpty( playerIdentity.userId ) ){
                response.data["playerId"] = playerIdentity.userId;
                requestData.StudentDetails.StudentIdentifier = requestData.StudentIdentifier;
                // saveData(studentDataSetName, Object.assign({}, {"StudentIdentifier": requestData.StudentIdentifier}, requestData.StudentDetails));
                // saveData(studentDataSetName, requestData);
                saveData(studentDataSetName, requestData.StudentDetails);
                if(invalidGroupIds.length){
                    response.data["invalidGroupIds"] = invalidGroupIds;
                    response.StatusCode = 502;
                    response.Message = getProperty("RESPONSE_MESSAGES", "PARTIAL_REGISTRATION");
                }else{
                    response.StatusCode = 200;
                    response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_REGISTRATION");
                }
            }else{
                response.data["playerId"] = getGameSparksIdFromConduiraId( requestData.StudentIdentifier );
                
                if( isNullOrEmpty( response.data["playerId"] ) ){
                    response.Message = getProperty("RESPONSE_MESSAGES", "REGISTRATION_FAILED");
                }else
                    response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_EXISTS");
            }
        }
        
        if( response.data["playerId"] && !isNullOrEmpty( response.data["playerId"] ) )
            response.Status = getConstant("SUCCESS");
    }

    return response; 
}

function registerUser(requestData,response){
    var response = Spark.sendRequest({
        "@class": ".RegistrationRequest",
        "displayName": requestData.StudentDetails['StudentName'] || requestData.StudentIdentifier,
        // "displayName": requestData.StudentName,
        "password": "123456",
        "segments": {},
        "userName": requestData.StudentIdentifier
    });
    
    return response; 
}

function updateStudentGroups(requestData){
    var response = {
        "StatusCode": 500,
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    if( isNaN( requestData.StudentIdentifier ) ){
        response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");
    }else{
        var leaderBoardDB = getConstant("LEADERBOARD_INFO");
        var langLBDB = getConstant("LANGUAGE_LEADERBOARD_INFO");
        var studentData = getStudentDetails(requestData.StudentIdentifier);
        
        if(!studentData.hasNext())
        {
            response.Message = getProperty("RESPONSE_MESSAGES", "STUDENT_DETAILS_NOT_FOUND");
            return;
        }
        var nextElement = studentData.next();
        var student = nextElement.getData();
        
        var invalidGroupIds = [];
        
        if(requestData.GroupID){
            requestData.GroupID.forEach(function(groupId){
                response.Message = groupIdValidation(groupId);
                
                if( isNullOrEmpty( response.Message ) )
                {
                    if(student.GroupIds && student.GroupIds.indexOf(groupId) < 0){
                        student.GroupIds.push(groupId);
                        updateGroupsInLeaderboard(requestData.StudentIdentifier, groupId, leaderBoardDB);
                        updateGroupsInLeaderboard(requestData.StudentIdentifier, groupId, langLBDB);
                    }
                }else
                    invalidGroupIds.push(groupId);
            });
            nextElement.persistor().withAtomicIncrements().persist();
        }
    }
    
    if(invalidGroupIds.length){
        response.StatusCode = 201;
        response.Message = getProperty("RESPONSE_MESSAGES", "PARTIAL_UPDATE");
        response.Status = getConstant("SUCCESS");
        response.data.invalidGroupIds = invalidGroupIds;
    }else{
        response.StatusCode = 200;
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_UPDATION");
        response.Status = getConstant("SUCCESS");
    }
    
    return response;
}

function updateStudentRecommendation( requestData ){
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    if( isNullOrEmpty( requestData.chapterId ) ){
        response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_CHAPTER_ID");
        return;
    }
    
    var studentData = getStudentDetails( requestData.studentIdentifier );
    
    if(studentData.hasNext())
    {
        var nextElement = studentData.next();
        var student = nextElement.getData();
        
         if(requestData.type==getConstant("LPA"))
           var RecommendedIds={"ChapterID":requestData.chapterId,"SubjectID":requestData.subjectId};
        else if(requestData.type==getConstant("NON_LPA"))
            var RecommendedIds={"ChapterID":requestData.chapterId};
        
         student.RecommendedIds=RecommendedIds;
         
        nextElement.persistor().withAtomicIncrements().persist();
        
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_UPDATION");
        response.Status = getConstant("SUCCESS");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
    
    return response;
}

function updateStudentDetails( requestData ){
    var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    if( isNullOrEmpty( requestData.studentDetails ) ){
        response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_DETAILS");
        return;
    }
    
    var studentData = getStudentDetails( requestData.studentIdentifier );
    
    if(studentData.hasNext())
    {
        var nextElement = studentData.next();
        var student = nextElement.getData();
        
        if( requestData.studentDetails && requestData.studentDetails["StudentIdentifier"] )
            delete requestData.studentDetails["StudentIdentifier"];
            
        if( requestData.studentDetails && requestData.studentDetails["GroupIds"] ){
            var data = {
                            "StudentIdentifier": requestData.studentIdentifier,
                            "GroupID": requestData.studentDetails["GroupIds"]
                        };
            
            var groupUpdateResponse = updateStudentGroups(data);
            
            if(groupUpdateResponse.StatusCode != 200)
                response.data.invalidGroupIds = groupUpdateResponse.data.invalidGroupIds;
                
            delete requestData.studentDetails["GroupIds"];
        }
        
        if( requestData.studentDetails && requestData.studentDetails["StudentLevels"] ){
            if(!student["StudentLevels"])
                student["StudentLevels"] = {};
            
            if(requestData.studentDetails["StudentLevels"]["LanguageId"] && !isNaN(requestData.studentDetails["StudentLevels"]["Level"]))
                student["StudentLevels"][requestData.studentDetails["StudentLevels"]["LanguageId"]] = requestData.studentDetails["StudentLevels"]["Level"];
            
            var studentLevelData = getStudentLevelsHistory( student.StudentIdentifier );
            
            if( studentLevelData.hasNext() ){
                var studentLevelReference = studentLevelData.next();
                var studentData = studentLevelReference.getData();
                
                if( studentData && studentData.StudentLevels ){
                    studentData["StudentLevels"].push({
                        "LanguageId": requestData.studentDetails["StudentLevels"]["LanguageId"],
                        "LanguageName": requestData.studentDetails["StudentLevels"]["LanguageName"],
                        "Level": requestData.studentDetails["StudentLevels"]["Level"],
                        "TimeStamp": requestData.studentDetails["StudentLevels"]["TimeStamp"]
                    });
                }
                studentLevelReference.persistor().withAtomicIncrements().persist();
            }else{
                var insertObj = {
                    "StudentIdentifier": student.StudentIdentifier,
                    "StudentLevels": []
                }
                
                insertObj["StudentLevels"].push({
                        "LanguageId": requestData.studentDetails["StudentLevels"]["LanguageId"],
                        "LanguageName": requestData.studentDetails["StudentLevels"]["LanguageName"],
                        "Level": requestData.studentDetails["StudentLevels"]["Level"],
                        "TimeStamp": requestData.studentDetails["StudentLevels"]["TimeStamp"]
                    });
                
                saveStudentLevelData( getConstant("STUDENT_LEVELS"), insertObj);
            }
            delete requestData.studentDetails["StudentLevels"];
        }
        
        if(requestData.studentDetails && requestData.studentDetails["StudentName"] ){
            var request = new SparkRequests.ChangeUserDetailsRequest();
            
            request.displayName = requestData.studentDetails["StudentName"];
            
            request.SendAs(requestData.playerId);
        }
        delete requestData.playerId;
        
        student = setStudentDetails(student, requestData.studentDetails, []);
        
        nextElement.persistor().withAtomicIncrements().persist();
        
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_UPDATION");
        response.Status = getConstant("SUCCESS");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
    
    return response;
}


function dumpRegistrations(){
    var studentCollection = getStudentsDBName();
    var studentDetails = Spark.metaCollection(studentCollection).find().toArray();
    
    studentDetails.forEach(function(item){
        SetStudentInfo(item);
    });
}

function groupIdValidation(groupID){
    if( isNullOrEmpty( groupID ) )
        return null;
        
    var message = null;
    var dataAPI = Spark.getGameDataService();
    var groupsDataSetName = getGroupDBName();
    var GroupExists = dataAPI.queryItems(groupsDataSetName, dataAPI.N("GroupID").eq(groupID)).cursor();

    if(!GroupExists.hasNext())
        message = getProperty("RESPONSE_MESSAGES", "GROUP_DETAILS_NOT_EXISTS");
        
    return message;
}

function getStudentDetails(studentIdentifier){
    var dataAPI = Spark.getGameDataService();
    var studentDataSetName = getConstant("STUDENT_INFO");
    return dataAPI.queryItems(studentDataSetName, dataAPI.N("StudentIdentifier").eq(studentIdentifier)).cursor();
}

function getStudentLevelsHistory(studentIdentifier){
    var dataAPI = Spark.getGameDataService();
    var studentLevelsSetName = getConstant("STUDENT_LEVELS");
    return dataAPI.queryItems(studentLevelsSetName, dataAPI.N("StudentIdentifier").eq(studentIdentifier)).cursor();
}

function saveData(dbName, data){
    var dataAPI = Spark.getGameDataService();
    var StudentDB = dataAPI.createItem(dbName, data.StudentIdentifier);
    
    StudentDB.setData(data);
    StudentDB.persistor().persist();
}

function saveStudentLevelData(dbName, data){
    var dataAPI = Spark.getGameDataService();
    var StudentDB = dataAPI.createItem(dbName, data.StudentIdentifier);
    
    StudentDB.setData(data);
    StudentDB.persistor().persist();
}

function registrationDetailsValidation( requestData ){
    var message = null;
    
    if( isNullOrEmpty( requestData.StudentIdentifier ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_IDENTIFIER");

    return message;
}

function setStudentDetails(student, requestStudentData, keysToNeglect){
    var details = Object.keys( requestStudentData );
        
    details.forEach(function(key){
        if(keysToNeglect.indexOf(key) < 0)
            student[key] = requestStudentData[key];
    });
    
    return student;
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
                
                if( exerciseData && exerciseData.GroupIDs )
                    exerciseData.GroupIDs.push(groupId)
                else if(exerciseData && !exerciseData.GroupIds )
                    exerciseData.GroupIDs = [groupId];
                
                refObj.persistor().withAtomicIncrements().persist();
                lastTimestamp = exerciseData.timestamp;
            }
        }else
            endLoop = true;
        
        if(lastTimestamp === null || lastTimestamp == 0 || ( count % 100 ) != 0)
            endLoop = true;
    }while(!endLoop)
    
}