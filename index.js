var https = require('https');
var querystring = require('querystring');

function getCheckoutId(obj) {
	var path='/v1/checkouts';
	var data = querystring.stringify( {
		'authentication.userId' : '8a8294174d0595bb014d05d829e701d1',
		'authentication.password' : '9TnJPc2n9h',
		'authentication.entityId' : '8a8294174d0595bb014d05d829cb01cd',
		'amount' : obj.amount,
		'currency' : 'EUR',
		'paymentType' : 'DB',
		merchantTransactionId: obj.merchantTransactionId,
		merchantInvoiceId: obj.merchantInvoiceId,
	});
	var options = {
		port: 443,
		host: 'test.oppwa.com',
		path: path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': data.length
		}
	};
	var postRequest = https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			jsonRes = JSON.parse(chunk);
			return obj.cb(jsonRes);
		});
	});
	postRequest.write(data);
	postRequest.end();
}

function getStatus(resourcePath, callback) {
	var path=resourcePath;
	path += '?authentication.userId=8a8294174d0595bb014d05d829e701d1'
	path += '&authentication.password=9TnJPc2n9h'
	path += '&authentication.entityId=8a8294174d0595bb014d05d829cb01cd'
	var options = {
		port: 443,
		host: 'test.oppwa.com',
		path: path,
		method: 'GET',
	};
	var postRequest = https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			jsonRes = JSON.parse(chunk);
			return callback(jsonRes);
		});
	});
	postRequest.end();
}


var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(express.static('./'));
app.use(bodyParser.json({ extended: true }));

app.get('/', function (req, res) {
	// Get checkoutId before render the form
	getCheckoutId({
		amount: '92.00',
		merchantTransactionId: 123,
		merchantInvoiceId: 345,
		cb: (result) => {
			// Render the form with checkoutId
			res.render('index.ejs', {
				checkoutId: result.id
		  });
		},
	});
});

// Callback endpoint after form was processed
app.get('/success', function (req, res) {
	console.log(req.query);
	console.log(req.body);
	// Check checkout status
	getStatus(req.query.resourcePath, (response) => {
		console.log(response);
		// Check that result code match pattern from https://gate2play.docs.oppwa.com/reference/resultCodes
		console.log('response.merchantTransactionId', response.merchantTransactionId)
		console.log('response.merchantInvoiceId', response.merchantInvoiceId)
		if (response.result.code && /^(000\.000\.|000\.100\.1|000\.[36])/.test(response.result.code)) {
			// Create Payment instance here
			res.send('success!');
		} else {
			// For some reasons it was not success. Check response.result.code and match it with https://gate2play.docs.oppwa.com/reference/resultCodes
			res.send(response);
		}
	});
});

app.listen(2000, function () {
  console.log('Example app listening on port 2000!');
});
