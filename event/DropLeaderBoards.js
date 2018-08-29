// ====================================================================================================
//
// Cloud Code for DropLeaderBoards, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================
require("ManagingScripts")


var requestData={
    "isMultiple":Spark.getData().isMultiple,
    "shortCode":Spark.getData().shortCode
}

dropLeaderBoards(requestData);




//Clear Leaderboards
/*var leaderboards = [
       "ProgrammingHubLanguageGroupLB.groupId.7.languageId.1",
        "ProgrammingHubLangugeLB.languageId.1"
];
leaderboards.forEach(function(item, index){
    //Syntax to clear LeaderBoard data
   var leaderboard = Spark.getLeaderboards().getLeaderboard(item);
   if(leaderboard != null)
        leaderboard.drop(true);  
});
*/