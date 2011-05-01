
define(['./jo/src/jo', 
        './jo/src/Game', 
        './jo/src/TileMap',
        './jo/src/math2d',
        './objects/Actor'], 
		function(jo, Game, Map, m2d, Actor){
	
	//helps with the debugging in firebug
	$jo = jo;
	
	var game = jo.game= new Game({ name: '#canvas', fullscreen: true, fps: 30});
	
	jo.edit=true;
	game.setup(function(){
		game.load(['img/test.png', 'img/player.png', 'img/tileset.png']);
		jo.input.reserved.push(jo.input.CTRL);
		jo.input.reserved.push(jo.input.ALT);
		jo.input.reserved.push(jo.input.SHIFT);
		jo.input.reserved.push(jo.input.TAB);
		jo.input.reserved.push(jo.input.SPACE);
		jo.input.reserved.push(jo.input.ENTER);
		jo.input.reserved.push(jo.input.WHEEL_UP);
		
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
		if(jo.edit){
			game.editControls();
		}
	});
	var caption = function(msg){
		jo.screen.text({ fill: jo.clr.white, stroke: 0}, new jo.Point(64, 32), msg);
	};
	game.OnDraw(function() {
		jo.screen.clear(jo.color(0,0,0));
		game.map.draw({}, game.cam.toScreen(), jo.screen);
		for(var i in game.tiles){
			jo.screen.rect({fill:game.tiles[i].hit,stroke: 'yellow'}, game.cam.toScreen(game.tiles[i].pos), 64,64);
		}
		caption('state: '+game.state);
		jo.files.img.test.draw({angle: (jo.screen.frames/60)*Math.PI,pivot: 'center'}, new jo.Point(32, 32), jo.screen);
		if(jo.edit){
			game.drawEdit();
		}
	});
	var pal = 0;
	game.editControls= function(){
		if(jo.input.k('MOUSE1')){
			var p=game.cam.toMap(jo.input.mouse);
			game.map.put(p.x, p.y, {index: pal});
		}
		if(jo.input.k('MOUSE2')){
			var p=game.cam.toMap(jo.input.mouse);
			game.map.put(p.x, p.y, {index: -1});
		}
		if(jo.input.once('PAGE_UP')){
			pal = (pal+1)%4;
		}
	};
	game.drawEdit= function(){
		game.map.tileSet.draw({tile: pal}, new jo.Point(jo.screen.width-96, 32), jo.screen);
	};
	game.handleCollision = function(){
		for(var i in this.objects){
			game.mapCollide(game.map, this.objects[i]);
		}
	};
	game.actorCollide = function(a, b){
		var s = m2d.intersect.boxBox(a, b);
	};
	game.mapCollide = function(map, actor){
		var tiles = game.tiles = map.getIntersection({x:actor.pos.x, y: actor.pos.y, width: actor.width, height: actor.height});
		var wallhit = false, groundhit=false, ceilhit=false;;
		for(var i in tiles){
			if(tiles[i].index >= 0 && m2d.intersect.boxBox(tiles[i], actor)){
				tiles[i].hit = "yellow";
				if(tiles[i].pos.y < actor.pos.y+(actor.height*1.1) && actor.v().y>=0 && actor.pos.y <tiles[i].pos.y
						&& (actor.pos.x+actor.width >tiles[i].pos.x && actor.pos.x <tiles[i].pos.x+tiles[i].width)){
					actor.pos.y = tiles[i].pos.y - actor.height;
					groundhit=true;
				}
				else if(tiles[i].pos.y+tiles[i].height > actor.pos.y && actor.pos.y+actor.height >tiles[i].pos.y+tiles[i].height 
						&& !actor.wall && (actor.pos.x+actor.width <tiles[i].pos.x+tiles[i].width || actor.pos.x >tiles[i].pos.x)){
					//actor.pos.y = tiles[i].pos.y + tiles[i].height;
					ceilhit=true;
				}else if(tiles[i].pos.y+tiles[i].height > actor.pos.y && tiles[i].pos.y < actor.pos.y+(actor.height ) ){
					if(tiles[i].pos.x < actor.pos.x+actor.width && actor.v().x>0 ){
						actor.pos.x = tiles[i].pos.x-actor.width;
						wallhit = true;
					}else if(tiles[i].pos.x+tiles[i].width > actor.pos.x && actor.v().x<0){
						actor.pos.x = tiles[i].pos.x+tiles[i].width;
						wallhit = true;
					}
				}			
				
			}else{
				tiles[i].hit=0;
				
			}
		}
		actor.wall = wallhit;
		actor.ground=groundhit;
	};
	
});