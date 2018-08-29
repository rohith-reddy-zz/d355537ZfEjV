// ====================================================================================================
//
// Cloud Code for LPA_QuestionsSubmitFunctionality, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================

require("Utils")
require("Constants");

function submitQuestionDetails(requestData)
{
    var response = {
        "StatusCode" : getProperty("STATUS_CODES","NOT_FOUND"),
        "Status" : getConstant("FAILURE"),
        "Message" : "",
        "data" : {
                "invalidIds":{},
                "invalidStudentIdentifiers":[]
                }
    }
    
    if( requestData && !isNullOrEmptyArray(requestData.questionDetails) ){
    
        for each( var questionData in requestData.questionDetails ){
        
            var StudentIdentifier = getConduiraIdFromGameSparksId(questionData.playerId);
            
            if( !isNullOrZero(StudentIdentifier) ){
            
                if( isNullOrEmpty(submitQestionDetailsValidation(questionData)) ){
                    storeQuestionStatusDeatails(questionData, StudentIdentifier, response);
                } 
                else{
                    keyValue = String(StudentIdentifier).concat(questionData.testInstanceId);
                    if( !response.data.invalidIds.hasOwnProperty(keyValue) )
                        response.data.invalidIds[keyValue] = getInsertObject(StudentIdentifier, questionData.testInstanceId);
                }
            }
            else{
                if(response.data.invalidStudentIdentifiers.indexOf(questionData.playerId) < 0)
                    response.data.invalidStudentIdentifiers.push(questionData.playerId);
            }
        }
    }
    
    response.Message = getProperty("RESPONSE_MESSAGES","SUCCESSFULL_CREATION");
    response.Status = getConstant("SUCCESS");
    response.StatusCode = getProperty("STATUS_CODES" , "SUCCESS");
    return response;
}

function storeQuestionStatusDeatails(questionData,StudentIdentifier,response){
    
    var questionStatusDBName = getConstant("LPA_QUESTIONS_STATUS_INFO");
    var answerStatusEnum = getEnums(getConstant("ANSWER_STATUS_ENUM"));
    
    var dataAPI = Spark.getGameDataService();
    var queryIt = dataAPI.N("StudentIdentifier").eq(StudentIdentifier).and(dataAPI.S("TestInstanceId").eq(questionData.testInstanceId));
    var studentTestExist = dataAPI.queryItems(questionStatusDBName, queryIt).cursor();
    
    if( studentTestExist.hasNext() ){
    
        var nextElement = studentTestExist.next();
        var Data = nextElement.getData();
    
        if( Data.QuestionData[questionData.questionId ])
        {
            if( Data.QuestionData[questionData.questionId].AnswerStatus != answerStatusEnum[questionData.answerStatus] )
            {
                keyValue = String(StudentIdentifier).concat(questionData.testInstanceId);
                if( !response.data.invalidIds.hasOwnProperty(keyValue) )
                    response.data.invalidIds[keyValue] = getInsertObject(StudentIdentifier, questionData.testInstanceId);
            }
        }
        else{
            Data.QuestionData[questionData.questionId]=getdataObject(questionData);
            nextElement.persistor().withAtomicIncrements().persist();
        }
    }
    else{
    
        var insertObject={
            "TestInstanceId" : questionData.testInstanceId,
            "StudentIdentifier" : StudentIdentifier,
            "QuestionData" : {}
        }
    
        insertObject.QuestionData[questionData.questionId] = getdataObject(questionData);               
        var uniqueId = String(StudentIdentifier).concat(String(questionData.testInstanceId));
        dataAPI.createItem(questionStatusDBName, uniqueId).setData(insertObject).persistor().persist();
    }
    return response;
}

function submitQestionDetailsValidation(requestData){
    
    var message = null;
    
    if( isNullOrZero( requestData.questionId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_QUESTION_ID");
     else if( isNaN( requestData.isRecommended) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_RECOMMENDED");
    else if( isNullOrEmpty( requestData.answerStatus ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_ANSWER_STATUS");
    else if( isNullOrEmpty( requestData.testInstanceId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TEST_INSTANCE_ID");
    else if( isNullOrEmpty( requestData.testType ) )  
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TEST_TYPE");
    else if( isNullOrEmpty( requestData.playerId ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_PLAYER_ID");
     else if( isNaN( requestData.score) )
        message = getProperty("RESPONSE_MESSAGES","INVALID_SCORE");
    else if( isNullOrZero( requestData.scoreOutOf ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_OUTOF_SCORE");
    else if( isNaN( requestData.timeTaken ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_TIME_TAKEN");
    else if( isNaN( requestData.lastAnswerUpdateTime ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_LAST_ANSWER_UPDATE_TIME");
    else if( isNaN( requestData.numberOfVisits ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_NUMBER_OF_VISITS");
    else if( isNaN( requestData.numberOfAttempts ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_NUMBER_OF_ATTEMPTS");
     else if( isNullOrEmptyArray(requestData.chapterIds ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_CHAPTER_IDS");
    else if( isNullOrEmptyArray(requestData.subjectIds ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_SUBJECT_IDS");
    else if( isNullOrEmptyArray(requestData.productIds ) )
        message = getProperty("RESPONSE_MESSAGES", "INVALID_PRODUCT_IDS");
    return message;
}

function getdataObject(questionData){
    
    var testTypeEnum = getEnums(getConstant("TEST_TYPE_ENUM"));
    var answerStatusEnum = getEnums(getConstant("ANSWER_STATUS_ENUM"));
    
    dataObj = {
        "QuestionId" : questionData.questionId,
        "IsRecommended": questionData.isRecommended,
        "AnswerStatus" : answerStatusEnum[questionData.answerStatus],
        "TestType" : testTypeEnum[questionData.testType],
        "Score" : questionData.score,
        "ScoreOutOf" : questionData.scoreOutOf,
        "TimeTaken" : questionData.timeTaken,
        "LastAnswerUpdateTime" : questionData.lastAnswerUpdateTime,
        "NumberOfVisits" : questionData.numberOfVisits,
        "NumberOfAttempts" : questionData.numberOfAttempts,
        "ChapterIds" : questionData.chapterIds,
        "SubjectIds" : questionData.subjectIds,
        "ProductIds" : questionData.productIds
    }
    return dataObj;
}

function getInsertObject(StudentIdentifier,testInstanceId){
    
    insertObject = {
        "StudentIdentifier" : StudentIdentifier,
        "TestId" : testInstanceId
    }
    return insertObject;
}
