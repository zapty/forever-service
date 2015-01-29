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
 
process.once('SIGTERM', function(){
	console.log("SIGTERM received");
	server.close(function(){
		console.log("server now safe to shutdown");
	});
});

server.listen(8088);
console.log("Server is listening");
if(process.env.TEST){
  console.log("Env variable TEST "+process.env.TEST);
}
