var async = require('async'),
	shell = require('shelljs'),
	fs = require('fs');

exports.initialize=function(){
	if (!fs.existsSync('/sbin/upstart')) {
		return;
	}

	if (fs.existsSync('/etc/lsb-release')){
		var contents = fs.readFileSync('/etc/lsb-release','utf8');
		if (contents && contents.match(/(DISTRIB_ID=Ubuntu)/g) ){
			var osmatch = /DISTRIB_DESCRIPTION\=['"](.*)['"]/gm.exec(contents);
			if (!osmatch || osmatch.length < 2) {
				return;
			}

			return {
				os: osmatch[1],
				platform: 'upstart',
				help: 'Command to interact with service, sudo start|stop|restart|status [service]'
			};
		}
	}
}


exports.install=function(ctx, scripts, callback){
	//Install the init.d file..
	if(ctx.platform === 'upstart'){
		var serviceFile = '/etc/init/'+ctx.service+'.conf';
		var logrotateFile = '/etc/logrotate.d/'+ctx.service;


		async.series(
			[
				function(callback){
					fs.exists(serviceFile, function(exists){
						if(exists){
							callback("Service is already present");
						} else {
							callback(null);
						}
					});
				},
				function(callback){
					fs.writeFile(serviceFile, scripts['upstart'], callback);
				},
				/*function(callback){
					shell.exec('chmod +x '+serviceFile, {async: true}, function(code, output){
						callback(code != 0?'Could not make '+serviceFile+' executable\n'+output:null); //error if non 0 exit code
					});
				},*/
				function(callback){
					shell.exec('sudo initctl reload-configuration', {async: true}, function(code, output){
						callback(code != 0?'Could not add service '+ctx.service+'\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					if(ctx.nologrotate) return callback(null);
					fs.writeFile(logrotateFile, scripts['logrotate'], callback);
				}
			],
			function(err, results){
				//if(err) console.error('Error while provisioing service\n'+err);
				callback(err,
					{
						help: 'Commands to interact with service '+ctx.service+'\n'+
							  'Start   - "sudo start '+ctx.service+'"\n'+
							  'Stop    - "sudo stop '+ctx.service+'"\n'+
							  'Status  - "sudo status '+ctx.service+'"\n'+
							  'Restart - "sudo restart '+ctx.service+'"'
					}
				);
			}
		);
	}
}

exports.startService=function(ctx, callback){
	shell.exec('sudo start '+ctx.service, {async: true}, function(code, output){
		callback(code != 0); //error if non 0 exit code
	});
}


function stopService(ctx, callback){
	shell.exec('sudo stop '+ctx.service, {async: true}, function(code, output){
		//callback(code != 0); //error if non 0 exit code
		callback(); //Even if it is error, lets not return since we want to do the next steps and remove the service
	});
}

exports.stopService = stopService;

exports.delete=function(ctx, scripts, callback){
	if(ctx.platform === 'upstart'){
		var serviceFile = '/etc/init/'+ctx.service+'.conf';
		var logrotateFile = '/etc/logrotate.d/'+ctx.service;

		async.series(
			[
				function(callback){
					fs.exists(serviceFile, function(exists){
						if(!exists){
							callback("Service not found");
						} else {
							callback(null);
						}
					});
				},
				function(callback){
					fs.readFile(serviceFile, 'utf8', function(err,data){
						if(err) return callback(err);

						if(data.match(/forever\-service/g)){
							callback(null);
						} else {
							callback("Service not provisioned with forever-service");
						}
					});
				},
				function(callback){
					stopService(ctx, callback);
				},
				function(callback){
					fs.unlink(serviceFile, callback);
				},
				function(callback){
					shell.exec('sudo initctl reload-configuration', {async: true}, function(code, output){
						callback(code != 0?'Could not delete service '+ctx.service+'\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					fs.exists(logrotateFile, function(exists){
						if(exists){
							fs.unlink(logrotateFile, callback);
						} else callback(null);
					});
				}

			],
			function(err, results){
				callback(err);
			}
		);
	}
}
