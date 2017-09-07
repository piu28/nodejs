#!/usr/bin/node

var AWS = require('aws-sdk');
AWS.config.update({
    region: 'ap-southeast-1'
});
var ec2 = new AWS.EC2();
var sleep = require('sleep');

PORT = process.env.PORT.split('\n');
IP = process.env.IP.split('\n');
TOUPDATE = process.env.TOUPDATE.split('\n');
ACTION = process.env.ACTION ;

if (TOUPDATE == 'specific') {
    GROUPID = process.env.GROUPID.split('\n');
    specificGroups(GROUPID);
} else {
    allGroups();
}

function allowRule(params) {
    ec2.authorizeSecurityGroupIngress(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            sleep.sleep(2);
            console.log("Updated Security Group.");
        }
    });
}

function revokeRule(params) {
    ec2.revokeSecurityGroupIngress(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            sleep.sleep(2);
            console.log("Updated Security Group.");
        }
    });
}

function specificGroups(GROUPID) {
    for (var i = 0; i < PORT.length; i++) {
        for (var j = 0; j < IP.length; j++) {
            for (var k = 0; k < GROUPID.length; k++) {
                //console.log(PORT[i], IP[j], GROUPID[k]);
                var params = {
                    GroupId: GROUPID[k],
                    IpPermissions: [{
                        FromPort: PORT[i],
                        ToPort: PORT[i],
                        IpProtocol: 'tcp',
                        IpRanges: [{
                            CidrIp: IP[j]
                        }]
                    }]
                };
                checkRule(PORT[i], IP[j], GROUPID[k]);
            }
        }
    }
}

function allGroups() {
    if (process.env.VPCID) {
        VPCID = process.env.VPCID;
    } else console.log("Please specify the VPC ID.");
    var params = {
        Filters: [{
            Name: 'vpc-id',
            Values: [
                VPCID
            ]
        }]
    };
    ec2.describeSecurityGroups(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            for (var k = 0; k < data.SecurityGroups.length; k++) {
                //console.log(data.SecurityGroups[k].IpPermissions[0].IpRanges);
                GROUPID = data.SecurityGroups[k].GroupId;
                for (var i = 0; i < PORT.length; i++) {
                    for (var j = 0; j < IP.length; j++) {
                        var params = {
                            GroupId: GROUPID,
                            IpPermissions: [{
                                FromPort: PORT[i],
                                ToPort: PORT[i],
                                IpProtocol: 'tcp',
                                IpRanges: [{
                                    CidrIp: IP[j]
                                }]
                            }]
                        };
                        checkRule(PORT[i], IP[j], GROUPID);
                    }
                }
            }
        }
    });
}

function checkRule(port, ip, groupid) {
    var params = {
        GroupIds: [groupid],
        Filters: [{
                Name: 'ip-permission.cidr',
                Values: [
                    ip
                ]
            },
            {
                Name: 'ip-permission.to-port',
                Values: [
                    port
                ]
            },
            {
                Name: 'ip-permission.from-port',
                Values: [
                    port
                ]
            }
        ]
    };
    ec2.describeSecurityGroups(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            sleep.sleep(5);
            if (data.SecurityGroups.length > 0) {
		if (ACTION == 'Allow'){
                  for (var k = 0; k < data.SecurityGroups.length; k++) {
                    console.log("Cannot Add Rule because Rule already exists: ", port, "is already opened for ", ip, " in group: ", data.SecurityGroups[k].GroupId)
                  }
                }
                if (ACTION == 'Revoke'){
                    var params = {
                      GroupId: groupid,
                      IpPermissions: [{
                          FromPort: port,
                          ToPort: port,
                          IpProtocol: 'tcp',
                          IpRanges: [{
                            CidrIp: ip
                          }]
                      }]
                    };
		    revokeRule(params);
                }
            } else {
		if (ACTION == 'Allow'){
                console.log("Rule doesnt exist.");
                console.log("Adding Rule: Opening", port, "for CIDR: ", ip, " in Security Group: ", groupid);
                var params = {
                    GroupId: groupid,
                    IpPermissions: [{
                        FromPort: port,
                        ToPort: port,
                        IpProtocol: 'tcp',
                        IpRanges: [{
                            CidrIp: ip
                        }]
                    }]
                };
                allowRule(params);
               }
               if (ACTION == 'Revoke')
               console.log("Rule doesnt exist.");
            }
        }

    });
}
