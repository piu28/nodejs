var aws = require('aws-sdk');
var cw = new aws.CloudWatch();
var mysql      = require('mysql');

exports.handler = (event, context, callback) => {

var connection = mysql.createConnection({
  host     : 'xxxxxx.us-east-1.rds.amazonaws.com',
  user     : 'puc',
  password : 'xxxxxx',
  database : 'powerdb'
});

connection.connect();

connection.query('SELECT count from employees where id=1', function(err, rows, fields) {
  if (err) throw err;

  console.log('The count is: ', rows[0].count);
  value = rows[0].count
  putCloudWatchMetric('DBCount', value);

});

function putCloudWatchMetric(metricName, count){
    cw.putMetricData({
        Namespace: 'DBData',
        MetricData: [{
            'MetricName': metricName,
            'Unit': 'Count',
            'Value': count
        }]}, function(err, data) {
                 if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
        }
     )
}

connection.end();
}

