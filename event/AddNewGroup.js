//UI module which contains parsing response object 
require("UIUtils")
//Module which contains actual functionality of adding group to DB
require("AddNewGroup")

var requestData = {
    "groupName" : Spark.getData().GroupName,
    "groupID" : Spark.getData().GroupID,
    "parentGroupID" : Spark.getData().ParentGroupID
}

setUiDataWithResponse( addNewGroupInDB( requestData ) );