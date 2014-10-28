"use strict";
var swig = require('swig');
var path = require('path');
var async = require('async');
var fs = require('fs');

exports.gen=function(ctx, callback){

	if(!ctx) throw "context missing";
	if(!ctx.platform) throw "platform missing";
	if(!callback && typeof(callback) !== "function") throw "callback missing";

	ctx.cwd = process.cwd();
	ctx.cli = process.argv.join(' ');
	var templateDir =  path.normalize( __dirname + '/..' ) +'/templates/'+ctx.platform;
	var filledTemplates = {};

	fs.exists(templateDir, function(exists){
		if(!exists) throw "platform "+ctx.platform+" not found";
		fs.readdir(templateDir, function(err, files){
			async.each(files, 
				function(file, callback){
					if(file.match(/.template$/g)){
						genFile(ctx, templateDir, file, function(err, output){
							if(err) throw err;
							filledTemplates[output.file.replace('.template','')] = output.out;
							callback();
						});
					} else callback();
				},
				function(err){
					callback(err, filledTemplates);
				}
			);
		});
	});
}

function genFile(ctx, folder, file, callback){
	swig.compileFile(folder + "/" + file, {autoescape: false}, function(err, output){
		if(err) 
			callback(err);
		else
			callback(null, {folder: folder, file: file, out: output(ctx)});
	});
}

