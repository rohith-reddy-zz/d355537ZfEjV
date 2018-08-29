//Module which contains all the functions to get constants from properties
require("Constants")
//Module which contains base functions
require("Utils")

function addNewGroupInDB(requestData)
{
    //Default response object
    var response = {
        "Status": getConstant("FAILURE"),
        "Message": "",
        "data": {}
    };
    //gets access to data sets(DB)
    var dataAPI = Spark.getGameDataService();
    
    //Basic validations of input fields
    response.Message = basicValidations(requestData);
    
    if( isNullOrEmpty( response.Message ) )
    {
        //validates whether groupId already exists or not
        response.Message = groupIdValidations(requestData.groupID);
        
        if( isNullOrEmpty( response.Message )){
            var dataObj = {
                "GroupName" : requestData.groupName,
                "GroupID" : requestData.groupID,
                "ParentGroupID" : requestData.parentGroupID,
                "ChildData" : []
            }
            var groupsDataSetName = getGroupDBName();
            
            //inserting the new groupId into DB
            dataAPI.createItem(groupsDataSetName, requestData.groupID).setData(dataObj).persistor().persist();
            
            if( !isNullOrEmpty(requestData.parentGroupID) ){
                var parentData = dataAPI.queryItems(groupsDataSetName, dataAPI.N("GroupID").eq(requestData.parentGroupID)).cursor();
            
                if(parentData.hasNext())
                {
                    var parent = parentData.next();
                    if(parent.getData().ChildData.indexOf(requestData.groupID) < 0)
                    {
                        parent.getData().ChildData.push(requestData.groupID);
                        parent.persistor().withAtomicIncrements().persist();
                    }
                }
                else{
                    response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
                    response.data.exception = getProperty("RESPONSE_MESSAGES", "INVALID_PARENT_GROUP");
                }
            }
            
            response.Status = getConstant("SUCCESS");
            response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION");
        }
    }
    
    return response;
}

function basicValidations(requestData){
    var message = null;
    
    if( isNullOrEmpty( requestData.groupName ) ){
        message = getProperty("RESPONSE_MESSAGES", "INVALID_GROUP_NAME");
    }
    if( isNaN( requestData.groupID ) ){
        message = getProperty("RESPONSE_MESSAGES", "INVALID_GROUP_ID");
    }
    
    return message;
}

function groupIdValidations(groupId){
    var message = null;
    
    //gets access to data sets(DB)
    var dataAPI = Spark.getGameDataService();
    var groupsDataSetName = getGroupDBName();
    var GroupExists = dataAPI.queryItems(groupsDataSetName, dataAPI.N("GroupID").eq(groupId)).cursor();
    
    if(GroupExists.hasNext())
    {
        message = getProperty("RESPONSE_MESSAGES", "GROUP_ID_EXISTS");
    }
    
    return message;
}