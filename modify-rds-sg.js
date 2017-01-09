var aws = require('aws-sdk');
aws.config.loadFromPath('./config.json');
var rds = new aws.RDS();
rds.describeDBInstances({}, function(err, data) {
    if (err) console.log(err, err.stack); 
    else { //console.log(data.DBInstances[0]);
        for (var i in data.DBInstances) {
            console.log(data.DBInstances[i].DBInstanceIdentifier);
            id = data.DBInstances[i].DBInstanceIdentifier;
            console.log(id);
            var params = {
                DBInstanceIdentifier: id,
                VpcSecurityGroupIds: ['sg-fa6fb69d'],
                ApplyImmediately: true
            }
            rds.modifyDBInstance(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data); // successful response
            });
        }
    } 
});
