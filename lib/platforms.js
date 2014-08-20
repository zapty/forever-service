var path = require('path')
var walker = require('walker');


function platform(){
	this.p = null;
}

platform.prototype.get=function(callback){
	walker(__dirname+'/../templates').on('dir', function(entry, stat){
		if(this.p) return; //If already platform is found dont go further

		if(entry.match(/templates$/g)) return; //Ignore the templates directory itself
		
		var name = path.basename(entry);
		var platformInstaller = require(entry+'/installer.js');
		var ret = platformInstaller.initialize();

		if(ret){
			this.p = {
				ctx: ret,
				name: name,
				installer: platformInstaller
			}
		}
		
	}).on('end', function(){
		callback(null, this.p);
	})
}

module.exports = new platform();

