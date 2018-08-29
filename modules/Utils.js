require("Constants")

function isNullOrEmpty(stringValue){
    if(stringValue == null || stringValue == "")
        return true;
    else
        return false;
}

function isNullOrZero(intValue){
    if( intValue == null || isNaN(intValue) || intValue == 0 )
        return true;
    else
        return false;
}

function isNullOrEmptyArray(dataObjects){
    
    if( dataObjects==null || dataObjects.length<1 )
       return true;
    else
       return false;
}

function timeStampToDateConvertion(epochTimeStamp){
    var epochToTimestamp = epochTimeStamp * 1000;
    
    var epochDate = new Date(epochToTimestamp);
    if(epochDate != null && epochDate.getDate() != null)
        return epochDate.getDate() + "-" + epochDate.getMonth() + "-" + epochDate.getFullYear();
    else
        return epochTimeStamp;
}


function getGroupDBName(){
    return getConstant("GROUPSDB");
}

function getStudentsDBName(){
    return getConstant("STUDENT_DUMP_COLLECTION");
}

function getVideosDBName(){
    return getConstant("VIDEOS_INFO");
}

function getChaperterDBName(){
    return getConstant("CHAPTER_INFO");
}

function getGameSparksIdFromConduiraId(conduiraId){
    var playerCollection = getConstant("SYSTEM_PLAYER_COLLECTION");
    var studentData = Spark.systemCollection(playerCollection).findOne({"userName" : conduiraId.toString() })
    
    if(studentData && studentData._id && studentData._id.$oid)
        return studentData._id.$oid;
    else
        return null;
}

function getConduiraIdFromGameSparksId(gamesparksId){
    var studentData = Spark.loadPlayer(gamesparksId);
    
    if( studentData && studentData.getUserName() )
        return Number(studentData.getUserName());
    else
        return null;
}

function getObjectToInsertIntoDB(requestData)
{
    var Obj = {
                "StudentIdentifier" : requestData.StudentIdentifier,
                "totalScore" : 0,
                "totalTimeTakenToFinishTasks" : 0,
                "ExerciseData" : [requestData.ExerciseId],
                "GroupIDs" : getGroupIDs(requestData.StudentIdentifier)
            };
    if(requestData.Type == getConstant("LANGUAGE")){
       Obj["LanguageId"] = requestData.TypeId;
    }
    else if(requestData.Type == getConstant("CHAPTER")){
       Obj["ChapterId"] = requestData.TypeId ;
    }
    
    return Obj ; 
}

function getGroupIDs(StudentIdentifier)
{
    var  dataAPI = Spark.getGameDataService();
    var StudentInfo = getConstant("STUDENT_INFO") ; 
    var StudentData = dataAPI.queryItems(StudentInfo, dataAPI.N("StudentIdentifier").eq(StudentIdentifier)).cursor();
    
    var GroupIds = [];
    
    if(StudentData.hasNext())
        GroupIds = StudentData.next().getData().GroupIds;
    
    return GroupIds;
}

function getGroupNameFromId( groupId ){
    var  dataAPI = Spark.getGameDataService();
    var groupsDBName = getConstant("GROUPSDB") ; 
    var groupData = dataAPI.queryItems(groupsDBName, dataAPI.N("GroupID").eq(groupId)).cursor();
    var groupName = null;
    
    if(groupData.hasNext())
        groupName = groupData.next().getData().GroupName;
    
    return groupName;
}

function getStudentInfo(studentIdentifier)
{
    var dataAPI = Spark.getGameDataService();
    var studentInfoDBName = getConstant("STUDENT_INFO");
    var studentInfo = dataAPI.queryItems(studentInfoDBName, dataAPI.N("StudentIdentifier").eq(studentIdentifier)).cursor();
    if(studentInfo.hasNext())
        return studentInfo.next().getData();
    
    return null;
}

function getStudenIdentifiers(){
    var endLoop = false, skipQuery = false;
    var lastIdentifier = 0;
    var studentData = null;
    var studentIdentifiers = [];
    
    do{
        var dataAPI = Spark.getGameDataService();
        var studenInfoDBName = getConstant("STUDENT_INFO");
        var sortQuery = dataAPI.sort("StudentIdentifier", false);
        
        if(skipQuery){
            var queryCondition = dataAPI.N("StudentIdentifier").lt(lastIdentifier);
        }else{
            var queryCondition = dataAPI.N("StudentIdentifier").gt(0);
            skipQuery = true;
        }
        
        studentData = dataAPI.queryItems(studenInfoDBName, queryCondition, sortQuery ).cursor();
        
        if(studentData == null){
            endLoop = true;
        }else{
            if(studentData.hasNext()){
                while( studentData.hasNext() ){
                    var data = studentData.next().getData();
                    if(!isNaN(data.StudentIdentifier)){
                        studentIdentifiers.push( data.StudentIdentifier );
                        lastIdentifier = data.StudentIdentifier;
                    }
                }
            }else{
                endLoop = true;
            }
        }
    }while(!endLoop)
    
    return studentIdentifiers;
}