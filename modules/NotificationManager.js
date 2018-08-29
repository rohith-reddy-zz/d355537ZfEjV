function sendNotifications(playersList, message, isPush, messageName){
    var msg = Spark.message(messageName);
    msg.setIncludeInPushCount(false);
    msg.setMessageData(message)
    msg.setPlayerIds(playersList);
    msg.setSendAsPush(isPush);
    msg.send();
}