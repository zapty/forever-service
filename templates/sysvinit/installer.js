var async = require('async'),
	shell = require('shelljs'),
	fs = require('fs');

exports.initialize=function(){

	if(fs.existsSync('/etc/system-release')){
		var contents = fs.readFileSync('/etc/system-release','utf8');
		if( contents && contents.match(/(Amazon Linux)|(Red Hat)|(CentOS)|(Fedora)|(Oracle Linux)/g) ){
			return {
				os: contents,
				platform: 'sysvinit',
				scmd: 'chkconfig',
				osflavor: 'centos',
				help: 'Command to interact with service, sudo service [service] start|stop|restart|status'
			};
		}
	} else if (fs.existsSync('/etc/os-release')){
		var contents = fs.readFileSync('/etc/os-release','utf8');
		if (/ID=(debian|bunsenlabs|raspbian|osmc|"elementary OS")/.test(contents) ||
			(!fs.existsSync('/sbin/upstart') && /ID_LIKE=debian/.test(contents))) { // Matches Ubuntu 15+ with systemd only
			return {
				os: getPrettyName(contents),
				platform: 'sysvinit',
				scmd: 'update-rc.d',
				usleepSupported: false,
				osflavor: 'debian',
				help: 'Command to interact with service, sudo service [service] start|stop|restart|status'
			};
		}
	}
}


exports.install=function(ctx, scripts, callback){
	//Install the init.d file..
	if(ctx.platform === 'sysvinit'){
		var serviceFile = '/etc/init.d/'+ctx.service;
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
					fs.writeFile(serviceFile, scripts['initd'], callback);
				},
				function(callback){
					shell.exec('chmod +x '+serviceFile, {async: true}, function(code, output){
						callback(code != 0?'Could not make '+serviceFile+' executable\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					var pcmd = 'chkconfig --add '+ctx.service;
					if(ctx.scmd ==='update-rc.d')
						pcmd = '/usr/sbin/update-rc.d '+ctx.service+' defaults';
					shell.exec(pcmd, {async: true}, function(code, output){
						callback(code != 0?'Could not add service '+ctx.service+'\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					if(ctx.nologrotate) return callback(null);
					fs.writeFile(logrotateFile, scripts['logrotate'], callback);
				}
			],
			function(err, results){
				callback(err, {
						help: 'Commands to interact with service '+ctx.service+'\n'+
							  'Start   - "sudo service '+ctx.service+' start"\n'+
							  'Stop    - "sudo service '+ctx.service+' stop"\n'+
							  'Status  - "sudo service '+ctx.service+' status"\n'+
							  'Restart - "sudo service '+ctx.service+' restart"'
				});
			}
		);
	}
}

function getPrettyName(contents){
	if(!contents) return;
	var m = contents.match(/PRETTY_NAME\s*=\s*"(.*)"/);
	if(m && m.length > 1 && m[1]){
		return m[1];
	}
}

exports.startService=function(ctx, callback){
	shell.exec('sudo service '+ctx.service+' start', {async: true}, function(code, output){
		callback(code != 0); //error if non 0 exit code
	});
}


function stopService(ctx, callback){
	shell.exec('sudo service '+ctx.service+' stop', {async: true}, function(code, output){
		//callback(code != 0); //error if non 0 exit code
		callback(); //even if there is error in stopping service we will continue with uninstallation..
	});
}

exports.stopService = stopService;

exports.delete=function(ctx, scripts, callback){
	if(ctx.platform === 'sysvinit'){
		var serviceFile = '/etc/init.d/'+ctx.service;
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
					if(ctx.scmd ==='update-rc.d') return callback(null); //For update-rc.d remove will be called after unlink
					shell.exec('chkconfig --del '+ctx.service, {async: true}, function(code, output){
						callback(code != 0?'Could not delete service '+ctx.service+'\n'+output:null); //error if non 0 exit code
					});
				},
				function(callback){
					fs.unlink(serviceFile, callback);
				},
				function(callback){
					if(ctx.scmd !=='update-rc.d') return callback(null); //Following step is Only for update-rc.d to remove service
					shell.exec('/usr/sbin/update-rc.d -f '+ctx.service+' remove', {async: true}, function(code, output){
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
