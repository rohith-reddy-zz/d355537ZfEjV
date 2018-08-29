function importJSON(){
    var reader = Spark.getFiles().downloadableJson("LiveTestData");
    
    if(reader != null){
        var testResultDB = getConstant("LEADERBOARD_INFO");
        var dataAPI = Spark.getGameDataService();
        
        reader.forEach(function(item){
            if(item){
                var obj = getDataFormat(item);
                
                dataAPI.createItem(testResultDB, item.data__StudentIdentifier+item.data__ExerciseId).setData(obj).persistor().persist();
            }
        });
    }
}

function getDataFormat(item){
    var responseObj = {
                    "StudentIdentifier": item.data__StudentIdentifier,
                    "ExerciseId": item.data__ExerciseId,
                    "TaskId": item.data__TaskId,
                    "TaskLevel": item.data__TaskLevel,
                    "TaskName": item.data__TaskName,
                    "Score": item.data__Score,
                    "OutOfScore": item.data__OutOfScore,
                    "timeTakenToFinishTask": item.data__timeTakenToFinishTask,
                    "timestamp": item.data__timestamp,
                    "GroupIDs" : [2],
                    "LanguageId": item.data__LanguageId,
                    "Category": item.data__Category,
                    "LanguageLevel": item.data__LanguageLevel,
                    "TestStartTime": item.data__TestStartTime,
                    "TestEndTime": item.data__TestEndTime,
                    "NumberOfvisits": item.data__NumberOfvisits,
                    "NumberOfVersions": item.data__NumberOfVersions,
                    "IsRecomended": item.data__IsRecomended,
                    "Status": item.data__Status
                };
    
    return responseObj;
}