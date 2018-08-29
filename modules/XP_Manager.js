require("Constants")

function storeXPForWatchingVideo(playerId, productId, isRecommended){
    var xpValues = getProperty("XP_Configs", "VIDEOS");
    var xp = isRecommended ? xpValues.RECOMMENDED : xpValues.NON_RECOMMENDED;
    storeXP(playerId, productId, xp);
    return xp;
}

function storeXP(playerId, productId, newxp) {
    var sparkPlayer = Spark.loadPlayer(playerId)
    var xp = sparkPlayer.getScriptData(productId+"-XP")
    sparkPlayer.setScriptData(productId+"-XP", xp+newxp)
}