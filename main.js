
define(['./jo/src/jo', 
        './jo/src/Game', 
        './jo/src/TileMap',
        './jo/src/math2d',
        './objects/Actor',
        './objects/Clone',
        './levels'], 
		function(jo, Game, Map, m2d, Actor, Clone, levels){
	
	//helps with the debugging in firebug
	$jo = jo;
	
	var game = jo.game= new Game({ name: '#canvas', fullscreen: true, fps: 30});
	
	jo.edit = true;
	jo.dev = true;
	game.setup(function(){
		game.load(['img/test.png', 
		           'img/player.png',
		           'img/player_shadow.png',
		           'img/tileset.png']);
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

	
	var caption = function(msg){
		jo.screen.text({ fill: jo.clr.white, stroke: 0}, new jo.Point(64, 32), msg);
	};
	game.OnDraw(function() {
		jo.screen.clear(jo.color(0,0,0));
		var p = game.cam.toWorld();
		game.map.draw({x: p.y, y: p.y, width: jo.screen.width, height: jo.screen.height}, game.cam.toScreen(), jo.screen);
		
		if(jo.edit && jo.dev){
			for(var i in game.tiles){
				jo.screen.rect({fill:game.tiles[i].hit,stroke: 'yellow'}, game.cam.toScreen(game.tiles[i].pos), 64,64);
			}
			game.drawEdit();	
			caption('Edit Mode | FPS: '+jo.screen.fps);
			jo.files.img.test.draw({angle: (jo.screen.frames/60)*Math.PI,pivot: 'center'}, new jo.Point(32, 32), jo.screen);
		}
		
	});
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
		
		game.loadLevel(levels.a.json, true);
		
	});
	game.loadLevel = function(lvlstring, init){
		var lvl= game.level = JSON.parse(lvlstring, jo.Object.revive);
		game.map = new Map(game.ts, lvl.width, lvl.height, lvl.data);
		game.objects = lvl.objects;
		game.level.json= lvlstring;
		
		if(init){
			game.initLevel();
		}
		return game.level;
	};
	game.saveLevel = function(){
		var lvl = {};
		lvl.width = game.map.width;
		lvl.height = game.map.height;
		//
		lvl.data = game.map.data;
		lvl.objects = {};
		for(var i in game.objects){
			lvl.objects[i] = game.objects[i];
		}
		lvl.json = JSON.stringify(lvl);
		return lvl;
		
	};
	game.stopLevel= function(){
		game.loadLevel(game.level.json, false);
		game.enemies = [];
		game.switches = [];
		for(var i in game.records){
			game.add(new Clone({name: 'record'+i, position: game.records[i][0].clone()}), 'record'+i);
		}
		for(var i in game.objects){
			if(game.level.objects[i].type === 'enemy'){
				game.enemies.push(i);
			}else if(game.level.objects[i].type === 'switch'){
				game.switches.push(i);
			}
		}
	};
	game.initLevel= function(){
		game.records = [];
		game.enemies = [];
		game.switches = [];
		for(var i in game.objects){
			if(game.level.objects[i].type === 'record'){
				game.records.push(i);
			}else if(game.level.objects[i].type === 'enemy'){
				game.enemies.push(i);
			}else if(game.level.objects[i].type === 'switch'){
				game.switches.push(i);
			}
		}
		game.resetRecording();
	};
	var recording = false;
	var current_rec = 0;
	var rec_frame = 0;
	game.resetRecording =function(){
		recording = false;
		current_rec = game.records.length;
		rec_frame = 0;
	};
	game.stopRecording= function(){
		recording=false;
		current_rec+=1;
		game.stopLevel();
		rec_frame=0;
	};
	game.startRecording= function(){
		recording = true;
		game.records[current_rec]= [];
		game.add(new Clone({name: 'record'+current_rec, position: game.get('player').pos.clone()}), 'record'+current_rec);
	};
	game.OnUpdate(function(ticks){
		

		
		if(jo.input.once('E')){
			jo.edit= !jo.edit;
		}
		if(jo.edit && jo.dev){
			this.editControls();
			this.controls();
		}else{			
			this.controls();
			this.adjustcam();

		}
		this.handleCollision();
		
		if(recording){
			game.records[current_rec].push(game.get('player').pos.clone());			
		}
		if(recording || current_rec>0){
			rec_frame+=1;
		}
		for(var i in game.records){
			var fr = Math.min(game.records[i].length-1, rec_frame);
			game.objects['record'+i].pos = game.records[i][fr];
		}
			
	});
	game.adjustcam = function(){
		var player = this.get('player');
		game.centerCam(player.pos);
	};
	game.centerCam = function(p){
		var half = new jo.Point(jo.screen.width / 2, jo.screen.height / 2);
		game.cam.copy( p.minus(half));
		var mf = this.map.getFrame();
		//game.cam.x = Math.min(mf.width - jo.screen.width, Math.max(mf.x, game.cam.x));
		//game.cam.y = Math.min(mf.height - jo.screen.height, Math.max(mf.y, game.cam.y));
	};

	game.controls = function(){
		this.player = this.get('player');		
		if(jo.input.once('SPACE')){
			this.player.jump();
		}
		if(jo.input.k('RIGHT')){
			this.player.side(1);
		}else if(jo.input.k('LEFT')){
			this.player.side(-1);
		}else{
			this.player.stand();
		}
		if(!recording && jo.input.once('SHIFT')){
			game.startRecording();
		}else if(recording && jo.input.once('SHIFT')){
			game.stopRecording();
		}
	};
	var pal = 0;
	game.editControls= function(){
		//player.pos.copy(game.cam.toWorld(jo.input.mouse));
		if(jo.input.k('D') ){
			jo.log(game.map.data);
		}
		if(jo.input.once('P') ){
			var lvl = game.saveLevel();
			jo.log(lvl.json);
		}
		if(jo.input.k('MOUSE1') && jo.input.k('CTRL') ){

			game.cam.subtract(jo.input.mouseMovement());
		}else if(jo.input.k('MOUSE1')){
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
	
		this.mapCollide(game.map, this.get('player'));
		
		for(i in this.enemy){
			this.mapCollide(game.map, this.get(enemy[i]));
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