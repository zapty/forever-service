var fs = require('fs'),
	path = require('path'),
	scriptBuilder = require('./scriptBuilder');

exports.validateScriptName = function(scriptname){
	if(scriptname && scriptname[0] === path.sep)
		return fs.existsSync(scriptname);
	else
		return fs.existsSync( process.cwd()+'/'+scriptname );
}


exports.install = function(ctx, callback){
	scriptBuilder.gen(ctx, function(err, scripts){
		if(err) return callback(err);

		ctx.installer.install(ctx, scripts, callback);
	});
}

exports.delete = function(ctx, callback){
	scriptBuilder.gen(ctx, function(err, scripts){
		if(err) return callback(err);

		ctx.installer.delete(ctx, scripts, callback);
	});
}


exports.splitEnvVariables=function(envVars){
	//Split at space, but ignore space inside quotes..
	envVarsArray = envVars.match(/(?:[^\s"']+|["'][^"']*["'])+/g);

	envVarsNameValueArray=[];
	for(var evi in envVarsArray){
		var ev = envVarsArray[evi];

		//Look for first = sign to know the variable name, rest of value may contain = sign but will be ignored
		var eqlPos = ev.indexOf("=");
		if(eqlPos < 0) { //if no equal sign is found it is a problem since env variable is there without = so it will be an error
			console.log("Invalid env variable "+ev);
			process.exit(1);
		}
		var evp = [
			ev.substring(0, eqlPos),
			ev.substring(eqlPos+1)
		];
		envVarsNameValueArray.push(evp);
	}
	return envVarsNameValueArray;
}
