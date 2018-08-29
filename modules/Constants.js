function getConstant(keyName)
{
    return getProperty("CONSTANTS", keyName);
}

function getTime(keyName)
{
    return getProperty("TIME", keyName);
}

function getProperty(propertyCode, keyName)
{
    if(Spark.getProperties().getProperty(propertyCode) && Spark.getProperties().getProperty(propertyCode)[keyName])
        return Spark.getProperties().getProperty(propertyCode)[keyName];
    else
        return null;
}

function getEnums(keyName){
    return getProperty("ENUMS", keyName);
}
 