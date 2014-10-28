var should = require('should');
var scriptBuilder = require('../lib/scriptBuilder');
var fs = require('fs-extra');

describe('Generate sysvinit script', function(){

	describe('Test sysvinit Linux scripts', function(){

		it('should validated arguments', function(){
			
			(function(){
			  	scriptBuilder.gen();
			}).should.throw();

			//No callback
			(function(){
			  	scriptBuilder.gen({platform: 'sysvinit'});
			}).should.throw();

			//Invalid callback
			(function(){
			  	scriptBuilder.gen({platform: 'sysvinit'}, 0);
			}).should.throw();

			//All valid
			(function(){
			  	scriptBuilder.gen({platform: 'sysvinit'}, function(){});
			}).should.not.throw();
		});

		it('should generate script for sysvinit linux', function(done){
			scriptBuilder.gen(
				{
					platform: "sysvinit",
					nodescript: "app.js",
					service: "test",
					displayname:"Test service"
				},
				function(err, scripts){
					if(err) throw err;

					scripts.should.have.property('initd');	
					scripts.should.have.property('logrotate');
	
					//fs.writeFileSync('testinitd.log', scripts.initd);
					//console.log(scripts.logrotate);
					done();
				}
			);
		});

	});
});
