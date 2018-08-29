//UI module which contains parsing response object 
require("UIUtils")
//Module which contains actual functionality of adding groups to DB
require("ImportGroupsIntoDB");

setUiDataWithResponse( importRealGroupDetails() );