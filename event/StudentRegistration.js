//UI module which contains parsing response object 
require("UIUtils")
//Module which contains actual functionality of adding group to DB
require("StudentRegistration")

var requestData = {
    "StudentIdentifier" : Spark.getData().StudentIdentifier,
    // "StudentName" : ( Spark.getData().StudentName && Spark.getData().StudentName.length ) ?  Spark.getData().StudentName : Spark.getData().StudentIdentifier.toString(),
    "StudentDetails": Spark.getData().StudentDetails
    // "StudentLevel" : Spark.getData().StudentLevel,
    // "GroupID" : Spark.getData().GroupID
};

setUiDataWithResponse( SetStudentInfo(requestData) );