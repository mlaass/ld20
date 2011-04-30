
define(['./jo/src/jo', 
        './jo/src/Game', 
        './jo/src/TileMap',
        './jo/src/math2d',
        './objects/Actor'], 
		function(jo, Game, Map, m2d, Actor){
	
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
		game.ts = new jo.TileSet([0,1,2,3,], 64,64, jo.files.img.tileset);
		game.map = new Map(game.ts, 32, 26, null);
		for(var i=0; i< 10; i++){
			game.map.put(i,5,{index: i%4});
		}
		game.map.put(10,4,{index: i%4});
		game.map.put(11,4,{index: i%4});
		game.map.put(12,4,{index: i%4});
		game.add(new Actor({name: 'player', position: new jo.Point(100, 64)}), 'player');
		
	});
	game.OnUpdate(function(ticks){
		var player = this.get('player');
		
			if(jo.input.once('SPACE')){
				player.jump();
			}
			if(jo.input.k('RIGHT')){
				player.side(1);
			}else if(jo.input.k('LEFT')){
				player.side(-1);
			}else{
				player.stand();
			}
		//player.pos.copy(game.cam.toWorld(jo.input.mouse));
		if(jo.input.key[jo.input.D] ){
			jo.log(game.map.data);
		}
		if(jo.input.k('MOUSE1') && jo.input.k('CTRL') ){

			game.cam.subtract(jo.input.mouseMovement());
		}
		game.handleCollision();
	});
	var caption = function(msg){
		jo.screen.text({ fill: jo.clr.white, stroke: 0}, new jo.Point(64, 32), msg);
	};
	game.OnDraw(function() {
		jo.screen.clear(jo.color(0,0,0));
		game.map.draw({}, game.cam.toScreen(), jo.screen);
		for(var i in game.tiles){
			//jo.screen.rect({fill:game.tiles[i].hit,stroke: 'yellow'}, game.cam.toScreen(game.tiles[i].pos), 64,64);
		}
		caption('state: '+game.state);
		jo.files.img.test.draw({angle: (jo.screen.frames/60)*Math.PI,pivot: 'center'}, new jo.Point(32, 32), jo.screen);
	});
	game.handleCollision = function(){
		for(var i in this.objects){
			game.mapCollide(game.map, this.objects[i]);
		}
	};
	game.mapCollide = function(map, actor){
		var tiles = game.tiles = map.getIntersection({x:actor.pos.x, y: actor.pos.y, width: actor.width, height: actor.height});
		
		for(var i in tiles){
			jo.screen.rect({fill:'yellow',stroke: 'yellow'}, game.cam.toScreen(tiles[i].pos), 64,64);
			if(tiles[i].index >= 0 && m2d.intersect.boxBox(tiles[i], actor)){
				actor.ground = true;
				tiles[i].hit="yellow";
				actor.pos.y = tiles[i].pos.y - actor.width;
			}else{
				tiles[i].hit=0;
				actor.ground=false;
			}
		}
	};
	
});