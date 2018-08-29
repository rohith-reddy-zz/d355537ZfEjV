// ====================================================================================================
//
// Cloud Code for LPA_QuestionLevel, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================

require("UIUtils");
require("LPA_QuestionsSubmitFunctionality");

var requestData = {
    "questionDetails" : Spark.getData().QuestionDetails
}

setUiDataWithResponse(submitQuestionDetails(requestData) );