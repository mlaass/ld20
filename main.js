
define(['jo/src/jo', 'jo/src/Game', 'jo/src/TileMap'], function(jo, Game, Map){
	
	//helps with the debugging in firebug
	$jo = jo;
	
	var game = jo.game= new Game({ name: '#canvas', fullscreen: true, fps: 30});
	
	game.setup(function(){
		game.load(['img/test.png', 'img/player.png', 'img/tileset.png']);
		jo.input.reserved.push(jo.input.CTRL);
		jo.input.reserved.push(jo.input.ALT);
		jo.input.reserved.push(jo.input.SHIFT);
		jo.input.reserved.push(jo.input.TAB);
		jo.input.reserved.push(jo.input.SPACE);
		jo.input.reserved.push(jo.input.ENTER);
		
	});
	var start = function(){
		game.state = 'start';
		game.cam =new jo.Camera();
	};
	
	game.ready(function(){
		start();
		game.ts = new jo.TileSet([1,2,3,4], 64,64, jo.files.img.tileset);
		game.map = new Map(game.ts, 32, 26, null);
		for(var i=0; i< 32; i++){
			game.map.put(i,5,{index: i%4});
		}
		
	});
	game.OnUpdate(function(ticks){
		
		if(game.state ===  'play'){
			if(jo.input.key(jo.input.UP)){
			}
			if(jo.input.key(jo.input.DOWN)){

			}
		}
		if(jo.input.key[jo.input.D] ){
			jo.log(game.map.data);
		}
		if(jo.input.k('MOUSE1') && jo.input.k('CTRL') ){

			game.cam.subtract(jo.input.mouseMovement());
		}

	});
	var caption = function(msg){
		jo.screen.text({align: 'center', fill: jo.clr.white, stroke: 0}, new jo.Point(jo.screen.width/2, jo.screen.height/2), msg);
	};
	game.OnDraw(function() {
		jo.screen.clear(jo.color(0,0,0));
		game.map.draw({}, game.cam.toScreen(), jo.screen);
		caption('state: '+game.state);
		jo.files.img.test.draw({angle: (jo.screen.frames/60)*Math.PI,pivot: 'center'}, new jo.Point(jo.screen.width/2, jo.screen.height/2-32), jo.screen);
	});
	
});