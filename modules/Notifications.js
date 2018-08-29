// ====================================================================================================
//
// Cloud Code for Notifications, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================

require("NotificationManager")

function sendToastMessage (playerIdList, title, msg, duration, icon) {
    var notificationObject = {
        "title": title,
        "message": msg,
        "messageType": "TOAST",
        "messageDurationInSeconds": (duration == undefined || duration < 0) ? 5 : duration,
        "iconPath": (icon == undefined || icon == null) ? getToastIcon() : icon
    };
    
    sendNotifications(playerIdList, notificationObject, false, "VideoNotification");
}

function getToastIcon() {
    var downloadableResponse = Spark.sendRequest({
        "@class": ".GetDownloadableRequest",
        "shortCode": "TOAST"
    });
    return downloadableResponse != null ? downloadableResponse.url : null;
}