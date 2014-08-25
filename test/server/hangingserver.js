var cluster = require('cluster');
if (cluster.isMaster) 
{
  // Fork workers.
	for (var i = 0; i < 1; i++) 
	{
		cluster.fork();
	}

  	cluster.on('exit', function(worker, code, signal) {       
  		console.log('worker ' + worker.process.pid + ' died at '+ new Date());
  		cluster.fork();
 	});

  	//Ignore all these signals.. to make the process hang
 	process.on('SIGTERM', function(){
		console.log("SIGTERM received on master");
	});
	process.on('SIGINT', function(){
		console.log("SIGINT received on master");
	});
	process.on('EXIT', function(){
		console.log("Process EXIT recevied on master");
	});
} else {

	var http = require("http");
	var server = http.createServer(function(request, response) {
	  response.writeHead(200, {"Content-Type": "text/html"});
	  response.write("<!DOCTYPE html>");
	  response.write("<html>");
	  response.write("<head>");
	  response.write("<title>Forever-Service test Page</title>");
	  response.write("</head>");
	  response.write("<body>");
	  response.write("Forever-Service");
	  response.write("</body>");
	  response.write("</html>");
	  response.end();
	});

	//Dont do anything on exit signal..
	//So that this process is left hanging 
	process.on('SIGTERM', function(){
		console.log("SIGTERM received");
	});
	process.on('SIGINT', function(){
		console.log("SIGINT received");
	});
	process.on('EXIT', function(){
		console.log("Process EXIT recevied");
	});

	server.listen(8088);
	console.log("Server is listening");
}

