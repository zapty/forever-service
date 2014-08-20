var os = require('os'),
    scriptBuilder = require('../../lib/scriptBuilder'),
	async = require('async'),
	shell = require('shelljs'),
	fs = require('fs');

exports.initialize=function(){

	if(fs.existsSync('/etc/system-release')){
		var contents = fs.readFileSync('/etc/system-release','utf8');
		if( contents && contents.match(/Amazon Linux/g) ){
			return {
				os: contents,
				help: 'Command to interact with service, sudo service [service] start|stop|restart|status'
			};
		}
	}
}


exports.install=function(ctx, scripts, callback){
	//Install the init.d file..
	if(ctx.platform === 'amazon'){
		var serviceFile = '/etc/init.d/'+ctx.service;
		async.series(
			[
				function(callback){
					fs.writeFile(serviceFile, scripts['initd'], callback);
				},
				function(callback){
					shell.exec('chmod +x '+serviceFile, {async: true}, function(code, output){
						callback(code != 0?'Could not make '+serviceFile+' executable\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					shell.exec('chkconfig --add '+ctx.service, {async: true}, function(code, output){
						callback(code != 0?'Could not add service '+ctx.service+'\n'+output:null); //error if non 0 exit code
					});
				}
			],
			function(err, results){
				if(err) console.error('Error while provisioing service\n'+err);
				callback(err);
			}
		);
	}
}
