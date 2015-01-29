var fs = require('fs'),
	path = require('path');
	scriptBuilder = require('./scriptBuilder'),
	shell = require('shelljs');


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
	return envVars.match(/(?:[^\s"']+|["'][^"']*["'])+/g);
}