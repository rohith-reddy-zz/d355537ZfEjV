var skipValue = 0, limitValue = 10000, loop = 1;
var onlinePlayers = [];

do{
    var playersDetails = Spark.systemCollection("player").find({"online":true}).skip(skipValue).limit(limitValue).toArray();
    
    if(playersDetails.length && playersDetails.length == limitValue){
        skipValue = limitValue * loop;
        loop++;
    }else
        skipValue = 0;
    
    playersDetails.forEach(function(item, index){
        onlinePlayers.push( item._id.$oid );
    });
    
    if(onlinePlayers.length > 100){
        require("NotificationManager")
        sendNotifications(onlinePlayers, {"data": "hi!!"}, false, "PushNotificationTest");
        onlinePlayers = []
    }
}while(skipValue != 0)

if(onlinePlayers.length > 0){
    require("NotificationManager")
    sendNotifications(onlinePlayers, {"data": "hi!!"}, true, "PushNotificationTest");
}
