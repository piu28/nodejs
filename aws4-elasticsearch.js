var AWS = require("aws-sdk");
AWS.config.region = "ap-south-1";
var es = require('elasticsearch').Client({
    hosts: 'https://xxxxxxxxxxxx.ap-south-1.es.amazonaws.com:443',
    connectionClass: require('http-aws-es')
});
esSnapshotS3RepoName = 'es-backup-s3';

if (process.argv[2] == "--action") {
    if (process.argv[3] == "verify_connection" || process.argv[3] == "create_es_repo" || process.argv[3] == "create_es_snapshot" || process.argv[3] == "get_es_snapshots" || process.argv[3] == "delete_old_indices") {
        if (process.argv[3] == "verify_connection") verify_connection();
        if (process.argv[3] == "create_es_repo") create_es_repo();
        if (process.argv[3] == "create_es_snapshot") create_es_snapshot();
        if (process.argv[3] == "get_es_snapshots") get_es_snapshots();
        if (process.argv[3] == "delete_old_indices") delete_old_indices();
    } else console.log("\x1b[31m", "ERROR: Specify a correct action. Execute help command to see the usage. node <scriptname> help", "\x1b[0m");

} else {
    if (process.argv[2] == "help") help();
    else {
        console.log("\x1b[31m", "ERROR: Action is not specified")
        help();
    }
}

function help() {
    console.log('\x1b[33m', 'Usage of the Script:');
    console.log('\x1b[32m', 'node <scriptname> --action <action>')
    console.log('\x1b[33m', 'Specify one of the action below:');
    console.log('\x1b[33m', 'verify_connection');
    console.log('\x1b[33m', 'create_es_repo');
    console.log('\x1b[33m', 'create_es_snapshot');
    console.log('\x1b[33m', 'get_es_snapshots', '\x1b[0m');
}

function verify_connection() {
    es.ping({
        requestTimeout: 3000
    }, function(error) {
        if (error) {
            console.trace('elasticsearch cluster is down!');
        } else {
            console.log('Connected to Elasticsearch!');
        }
    });
}

function create_es_repo() {
    es.snapshot.createRepository({
        repository: esSnapshotS3RepoName,
        body: {
            type: 's3',
            settings: {
                bucket: 'dev-es-backup',
                region: 'ap-south-1',
                role_arn: 'arn:aws:iam::xxxxx:role/rolename',
            },
        },
    }, function(error) {
        if (error) {
            console.trace('Unable to create ES Snapshot Repository!');
        } else {
            console.log('Successfuly Created Repo.');
        }
    });
}

function create_es_snapshot() {
    var dateTime = require('node-datetime');
    var dt = dateTime.create();
    var formattedDate = dt.format('Ymd-HMS');
    snapshotName = "snap-" + formattedDate
    var snapParams = {
        "repository": esSnapshotS3RepoName,
        "snapshot": snapshotName,
        "waitForCompletion": true
    };
    console.log(snapParams)
    es.snapshot.create(snapParams).then(function(data) {
        console.log(data);
        console.log("Snapshot Created!")
    });
}

function get_es_snapshots() {
    es.cat.snapshots({
        repository: esSnapshotS3RepoName
    }).then(function(data) {
        console.log(data);
    });
}

function delete_old_indices() {
    for (var i = 14; i < 15; i++) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        dt = d.getDate();

        if (dt < 10) {
            dt = '0' + dt;
        }
        if (month < 10) {
            month = '0' + month;
        }
        index = year + '.' + month + '.' + dt
        console.log("Deleting Indices of date: " + index);
        indexToBeDeleted = '*-' + index + ',-alblogs*'
        es.indices.delete({
            index: indexToBeDeleted
        }).then(function(data) {
            console.log(data);
        });
    }
}
