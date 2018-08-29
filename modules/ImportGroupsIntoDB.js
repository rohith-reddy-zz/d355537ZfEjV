//Module which contains all the functions to get constants from properties
require("Constants")
//Module which contains base functions
require("Utils")

function importGroupDetails()
{ 
    var response = {
        "Status" : "failure",
        "Message" : "",
        "data" : {}
    };
    //gets access to data sets(DB)
    var dataAPI = Spark.getGameDataService();
    var groupsCollectionDB = getConstant("GROUPS_DUMP_COLLECTION");
    
    var groupData = Spark.metaCollection( groupsCollectionDB ).find({}).toArray();
    
    if(groupData)
    {
        var groupsDataSetName = getGroupDBName();
        
        for each(var group in groupData[0])
        { 
            if(group.$oid)
                continue;
            
            if(group.group_id)
            {
                var que = dataAPI.N("GroupID").eq(group.group_id);
                var queryit = dataAPI.queryItems(groupsDataSetName, que).cursor();
                
                if(!queryit.hasNext())
                {
                    var insertObj = {
                        "GroupName" : group.group_name,
                        "GroupID"   : group.group_id,  
                        "ParentGroupID" : group.parent_group_id,
                        "childData" : [] 
                    };
                     
                    dataAPI.createItem(groupsDataSetName, group.group_id).setData(insertObj).persistor().persist();
                    
                    if(group.parent_group_id)
                    { 
                        var groupData = dataAPI.queryItems(groupsDataSetName, dataAPI.N("GroupID").eq(group.parent_group_id)).cursor();
                        
                        if(groupData.hasNext()) 
                        {
                            var nextElement = groupData.next();
                            var parentData = nextElement.getData();
                            
                            if(parentData.childData.indexOf(group.group_id)<0)
                            {
                                 parentData.childData.push(group.group_id); 
                                 nextElement.persistor().withAtomicIncrements().persist();     
                        
                            }
                        }
                    }
                }
            }
        }
        
        response.Status = getConstant("SUCCESS");
        response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_CREATION"); 
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "GROUP_DETAILS_NOT_EXISTS");
    
    return response;
}

function importRealGroupDetails()
{ 
    var response = {
        "StatusCode": 500,
        "Status" : "failure",
        "Message" : "",
        "data" : {}
    };
    
    //gets access to data sets(DB)
    var dataAPI = Spark.getGameDataService();
    var groupsCollectionDB = getConstant("GROUP_DETAILS");
    
    var groupData = Spark.metaCollection( groupsCollectionDB ).find({}).toArray();
    
    if(groupData)
    {
        var groupsDataSetName = getGroupDBName();
        var missedUpdates = [];
        
        for each(var groupDetails in groupData){
            if(groupDetails.id && groupDetails.group_name){
                var query = dataAPI.N("GroupID").eq(groupDetails.id);
                var queryit = dataAPI.queryItems(groupsDataSetName, query).cursor();
                
                if(!queryit.hasNext())
                {
                    var insertObj = {
                        "GroupName" : groupDetails.group_name,
                        "GroupID"   : groupDetails.id,  
                        "ParentGroupID" : groupDetails.parent_id,
                        "childData" : [] 
                    };
                    
                    dataAPI.createItem(groupsDataSetName, groupDetails.id).setData(insertObj).persistor().persist();
                    
                    if(groupDetails.parent_id)
                    { 
                        missedUpdates = updateParent(dataAPI, groupsDataSetName, groupDetails, missedUpdates);
                    }
                }
            }
        };
        
        var invalidParentIds = [];
        
        for each(var groupDetails in missedUpdates){
            updateParent(dataAPI, groupsDataSetName, groupDetails, invalidParentIds);
        };
        
        if(invalidParentIds.length){
            response.Status = getConstant("SUCCESS");
            response.Message = getProperty("RESPONSE_MESSAGES", "PARTIAL_UPDATE");
            response.StatusCode = 201;
            response.data.invalidParentIds = invalidParentIds;
        }else{
            response.Status = getConstant("SUCCESS");
            response.Message = getProperty("RESPONSE_MESSAGES", "SUCCESSFULL_UPDATION");
            response.StatusCode = 200;
        }
    }
    else
        response.Message = getProperty("RESPONSE_MESSAGES", "GROUP_DETAILS_NOT_EXISTS");
    
    return response;
}

function updateParent(dataAPI, groupsDataSetName, groupDetails, missedUpdates){
    var groupData = dataAPI.queryItems(groupsDataSetName, dataAPI.N("GroupID").eq(groupDetails.parent_id)).cursor();
    
    if(groupData.hasNext()) 
    {
        var nextElement = groupData.next();
        var parentData = nextElement.getData();
        
        if(parentData.childData.indexOf(groupDetails.id) < 0)
        {
             parentData.childData.push(groupDetails.id); 
             nextElement.persistor().withAtomicIncrements().persist();
        }
    }else{
        missedUpdates.push({
            "id": groupDetails.id,
            "parent_id": groupDetails.parent_id
        });
    }
    
    return missedUpdates;
}