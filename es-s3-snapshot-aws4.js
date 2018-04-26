//From this script, the ES Snapshot Repository will be created. If Cognito Authentication is enabled for Elasticsearch, then the ES requests needs to be signed. Hence, direct curl requests wont work in that case. Here, we are using "http-aws-es" for creating signed requests to ES. Install the dependencies: npm install aws-sdk elasticsearch http-aws-es

var AWS = require("aws-sdk");
AWS.config.region="ap-south-1";
var es = require('elasticsearch').Client({
  hosts: 'https://xxxxxxxxxxxxxx.ap-south-1.es.amazonaws.com:443',
  connectionClass: require('http-aws-es')
});

//Checking Connection
es.ping({
  requestTimeout: 3000
}, function (error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Connection to Elasticsearch is fine.');
  }
});

//Creating S3 Snapshot Repository
es.snapshot.createRepository({
	repository: 'es-backup-s3',
	body: {
		type: 's3',
		settings: {
			bucket: 'dev-es-backup',
			region: 'ap-south-1',
			role_arn: 'arn:aws:iam::xxxxx:role/rolename',
		},
	},
}, function (error) {
  if (error) {
    console.trace('Inable to create ES Snapshot Repository!');
  } else {
    console.log('Successfuly Created Repo.');
  }
});
