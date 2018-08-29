function setUiDataWithResponse(response)
{
    if(response.StatusCode)
        Spark.setScriptData("statusCode", response.StatusCode);
        
    //response message of an API
    Spark.setScriptData("message", response.Message);
    //response Status of an API
    Spark.setScriptData("response", response.Status);
    
    //If error occurs sending messaging in error
    if(response.status == "failure")
        Spark.setScriptData("ERROR", response.Message);
    
    //sending other data in API response
    if (response.data) {
        var dataKeys = Object.keys(response.data);
        
        for (var i = 0; i < dataKeys.length; i++)
            Spark.setScriptData(dataKeys[i], response.data[dataKeys[i]]);
    }
} 