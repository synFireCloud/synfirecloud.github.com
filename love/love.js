function LoveSprite(love,maxsize,x,y){
	this.x = x;
	this.y = y;
	this.love = love;
	this.ctx = love.ctx;
	this.size = maxsize*Math.random();
	this.maxsize = maxsize;
	this.csize= 0;
	this.time = 0;
	this.draw = function(){
		this.csize+=0.1;
		if(this.csize>this.size){
			this.csize=0;
			this.size=maxsize*Math.random();
		}
		//console.log((this.size-this.csize)/this.size);
		this.ctx.fillStyle = 'rgba(250,50,150,'+(this.size-this.csize)/this.size+')';
		this.ctx.beginPath();
		this.ctx.arc(this.x,this.y,this.csize,0,Math.PI*2,true);
		this.ctx.closePath();
		this.ctx.fill();
	}
}

function Love(canvas,maxsize,showOK){
	this.width = canvas.width;
	this.height = canvas.height;
	this.canvas = canvas;
	this.maxsize = maxsize;
	this.spriteSum=520;
	this.csprite=0;
	this.showOK=showOK;
	this.ctx = canvas.getContext('2d');
	this.sprites = new Array();
	for(var jc=0;jc<this.spriteSum;jc++){
		this.sprites[jc] = new LoveSprite(this,maxsize,-10,-10);
	}
	this.draw = function(self){
		if(self.csprite<self.spriteSum){
			var angle=self.csprite/self.spriteSum*Math.PI*2-0.5*Math.PI;
			var p=1+Math.sin(angle);
			self.sprites[self.csprite].x=300+200*p*Math.cos(angle);
			self.sprites[self.csprite].y=100+200*p*Math.sin(angle);
			self.csprite++;
			if(self.csprite==self.spriteSum){
				self.showOK();
			}
		}
		self.ctx.fillStyle='#000';
		self.ctx.clearRect(0,0,self.width,self.height);
		for(var jc=0;jc<self.spriteSum;jc++){
			self.sprites[jc].draw();
		}
	}
	this.timer_draw = setInterval(this.draw,1000/60,this);
	console.log("Love Init OK\n");
	console.log(this);
}
