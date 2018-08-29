require("Constants");
require("StudentRegistration");
require("Utils");

function updateStudentLevel(requestData)
{
     var response = {
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {}
    };
    
    if( isNullOrEmpty( requestData.studentLevelDetails ) ){
        response.Message = getProperty("RESPONSE_MESSAGES", "INVALID_STUDENT_DETAILS");
        return;
    }
    
    var studentData = getStudentDetails( requestData.studentIdentifier );
    
    if(studentData.hasNext())
    {
        var nextElement = studentData.next();
        var student = nextElement.getData();
        
        if( requestData.studentLevelDetails){
            if(!student["StudentLevels"])
                student["StudentLevels"] = {};
            
            if(requestData.studentLevelDetails["LanguageId"] && requestData.studentLevelDetails["currentLevel"])
                student["StudentLevels"][requestData.studentLevelDetails["LanguageId"]] = requestData.studentLevelDetails["currentLevel"];
            
            var studentLevelData = getStudentLevelsHistory( student.StudentIdentifier );
            
            if(studentLevelData.hasNext() ){
                var studentLevelReference = studentLevelData.next();
                var studentData = studentLevelReference.getData();
                
                if( studentData && studentData.StudentLevels ){
                    studentData["StudentLevels"].push({
                        "LanguageId": requestData.studentLevelDetails["LanguageId"],
                        "LanguageName": requestData.studentLevelDetails["LanguageName"],
                        "Level": requestData.studentLevelDetails["currentLevel"],
                        "TimeStamp": requestData.studentLevelDetails["timeoftransition"]
                    });
                }
                studentLevelReference.persistor().withAtomicIncrements().persist();
            }else{
                var insertObj = {
                    "StudentIdentifier": student.StudentIdentifier,
                    "StudentLevels": []
                }
                
                insertObj["StudentLevels"].push({
                        "LanguageId": requestData.studentLevelDetails["LanguageId"],
                        "LanguageName": requestData.studentLevelDetails["LanguageName"],
                        "Level": requestData.studentLevelDetails["currentLevel"],
                        "TimeStamp": requestData.studentLevelDetails["timeoftransition"]
                    });
                
                saveStudentLevelData( getConstant("STUDENT_LEVELS"), insertObj);
            }
            delete requestData.studentLevelDetails;
        }
        
        // var details = Object.keys( requestData.studentDetails );
        
        // details.forEach(function(key){
        //     student[key] = requestData.studentDetails[key];
        // });
        
        nextElement.persistor().withAtomicIncrements().persist();
        
        //TODO: Need to update display name in system collection if exists in student details
        
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_UPDATION");
        response.Status = getConstant("SUCCESS");
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "DETAILS_NOT_EXISTS");
    
    return response;
}