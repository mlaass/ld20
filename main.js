
define(['./jo/src/jo', 
        './jo/src/Game', 
        './jo/src/TileMap',
        './jo/src/math2d',
        './objects/Actor',
        './objects/Clone',
        './levels',
        './jo/src/cookies'], 
		function(jo, Game, Map, m2d, Actor, Clone, levels, cookies){
	
	//helps with the debugging in firebug
	$jo = jo;
	
	var game = jo.game= new Game({ name: '#canvas', fullscreen: true, fps: 30});
	
	jo.edit = false;
	jo.dev = true;
	game.setup(function(){
		game.load(['img/test.png', 
		           'img/player.png',
		           'img/player_record.png',
		           'img/player_shadow.png',
		           'img/device.png',
		           'img/tileset.png',
		           'sfx/ja.wav',
		           'sfx/rrm.wav',
		           'sfx/clkclk.wav',
		           'sfx/uh.wav',
		           'sfx/woo.wav',
		           'music/LD20-replay_2.mp3']);
		
		jo.input.reserved.push(jo.input.CTRL);
		jo.input.reserved.push(jo.input.ALT);
		jo.input.reserved.push(jo.input.SHIFT);
		jo.input.reserved.push(jo.input.TAB);
		jo.input.reserved.push(jo.input.SPACE);
		jo.input.reserved.push(jo.input.ENTER);
		jo.input.reserved.push(jo.input.WHEEL_UP);
		
	});

	game.ready(function(){
		if(jo.dev){
			jo.files.mute();
		}
		
		game.state = 'start';
		game.cam =new jo.Camera();
		
		game.ts = new jo.TileSet([0,1,2,3, [{i:4, t:800},{i:5, t: 600}], 6], 64,64, jo.files.img.tileset);
		game.ts.solid=[0,1,2,3];
		game.ts.start = 5;
		game.ts.exit = 4;
		
		game.map = new Map(game.ts, 128, 32, null);
		for(var i=0; i< 10; i++){
			game.map.put(i,5,{index: i%4});
		}
		game.map.put(10,4,{index: i%4});
		game.map.put(11,4,{index: i%4});
		game.map.put(12,4,{index: i%4});
		game.add(new Actor({name: 'player', position: new jo.Point(100, 64)}), 'player');
		game.records = [];
		game.loadLevel(levels['start'], true);
		
		jo.files.music['LD20-replay_2'].play();		

		game.device= new jo.Animation([1,1,1], 80,42, jo.files.img.device);
	});

	
	var caption = function(msg){
		jo.screen.text({ fill: jo.clr.white, stroke: 0}, new jo.Point(64, 32), msg);
	};
	game.OnDraw(function() {
		jo.screen.clear('#a5e63f');
		if(!jo.edit ){
			this.adjustcam();
		}
		var p = game.cam.toWorld();
		game.map.draw({x: p.x, y: p.y, width: jo.screen.width, height:jo.screen.height, grid: jo.edit}, new jo.Point(0,0), jo.screen);
		if(game.level.device ){
			var fr = 0;
			if(recording){
				fr = 2;
			}
			game.device.draw({frame: fr}, new jo.Point(32, 32), jo.screen);
		}
		
		if(jo.edit && jo.dev){
			caption('Edit Mode | FPS: '+parseInt(jo.screen.realFps)+' @ width:'+jo.screen.width+' height:'+jo.screen.height);
			jo.files.img.test.draw({angle: (jo.screen.frames/60)*Math.PI,pivot: 'center'}, new jo.Point(32, 32), jo.screen);
			
			for(var i in game.tiles){
				jo.screen.rect({fill:game.tiles[i].hit,stroke: 'yellow'}, game.cam.toScreen(game.tiles[i].pos), 64,64);
				jo.screen.text({fill:'green',stroke: 0}, game.cam.toScreen(game.tiles[i].pos), '#'+i);
			}
			game.drawEdit();	
			
		}else if(jo.dev){
			caption('Play Mode | FPS: '+parseInt(jo.screen.realFps)+' @ width:'+jo.screen.width+' height:'+jo.screen.height);
			jo.files.img.test.draw({pivot: 'center'}, new jo.Point(32, 32), jo.screen);
		}
	});
	game.adjustcam = function(){
		game.centerCam(this.get('player').pos.clone());
	};
	game.centerCam = function(p){
		var half = new jo.Point(jo.screen.width / 2, jo.screen.height*0.5);
		game.cam.copy(p.minus(half));
		var mf = this.map.getFrame();
		
		game.cam.copy(new jo.Point(
				Math.min(mf.width - jo.screen.width, Math.max(0,game.cam.x)),									
				Math.min(mf.height - jo.screen.height, Math.max(-64, game.cam.y))
		));
	};
	game.drawEdit= function(){
		game.map.tileSet.draw({tile: pal}, new jo.Point(jo.screen.width-96, 32), jo.screen);
	};

	game.loadLevel = function(level, init){
		var lvl = JSON.parse(level.json, jo.Object.revive);
		game.map = new Map(game.ts, lvl.width, lvl.height, lvl.data);
		
		game.objects = lvl.objects;
		
		game.level = level;
		game.level.lvl = lvl;
		if(init){
			game.initLevel();
		}

		
		var s = game.map.find(game.ts.start);
		var pl =game.get('player');
		if(typeof s !== 'undefined'){
			pl.moveTo(s.pos.plus(jo.point(16,0)));
		}else{
			pl.moveTo( new jo.Point(100, 64));
		}
		return game.level;
	};
	game.initLevel= function(){
		game.records = [];
		game.enemies = [];
		game.switches = [];
		for(var i in game.objects){
			if(game.level.lvl.objects[i].type === 'record'){
				game.records.push(i);
			}else if(game.level.lvl.objects[i].type === 'enemy'){
				game.enemies.push(i);
			}else if(game.level.lvl.objects[i].type === 'switch'){
				game.switches.push(i);
			}
		}
		game.records = [];
		game.resetRecording();
	};
	game.saveLevel = function(){
		var lvl = {};
		lvl.width = game.map.width;
		lvl.height = game.map.height;
		//
		lvl.data = game.map.data;
		lvl.objects = {};
		
		for(var i in game.objects){
			if( !i.match(/record/)){
				lvl.objects[i] = game.objects[i];
			}
		}
		lvl.json = JSON.stringify(lvl);
		game.records = [];
		game.resetRecording();
		game.loadLevel(lvl);
		return lvl;
		
	};
	game.stopLevel= function(){
		game.loadLevel(game.level, false);
		game.enemies = [];
		game.switches = [];
 
		for(var i in game.records){
			game.add(new Clone({name: 'record'+i, position: game.records[i][0].pos.clone()}), 'record'+i);
		}
		for(var i in game.objects){
			if(game.level.lvl.objects[i].type === 'enemy'){
				game.enemies.push(i);
			}else if(game.level.lvl.objects[i].type === 'switch'){
				game.switches.push(i);
			}
		}
	};
	game.restartLevel = function(){
		game.records = [];
		game.loadLevel(game.level);
	};
	game.restart = function(){
		game.records= [];
		game.loadLevel(levels['start'], true);
	};

	game.levelDone = function(){
		game.loadLevel(levels[game.level.next], true);
		jo.cookies.setCookie('LD20Balooga03',game.level.next, 60);
		jo.files.sfx.woo.play();
	};
	
	var recording = false;
	var current_rec = 0;
	var rec_frame = 0;
	game.deleteRecords= function(){
		game.records=[];
		game.resetRecording();
		
	};
	game.resetRecording =function(){
		recording = false;
		current_rec = game.records.length;
		rec_frame = 0;
	};
	game.stopRecording= function(){
		recording=false;
		game.get('record'+current_rec).rec=false;
		current_rec+=1;
		game.stopLevel();
		rec_frame=0;
		game.get('player').rec=false;
	};
	game.startRecording= function(){
		recording = true;
		game.records[current_rec]= [];
		game.add(new Clone({name: 'record'+current_rec, position: game.get('player').pos.clone()}), 'record'+current_rec);
		game.get('record'+current_rec).rec=true;
		game.get('player').rec=true;
	};
	game.OnUpdate(function(ticks){
		game.map.update(ticks);
		if(jo.input.once('E')){
			jo.edit= !jo.edit;
			game.level.device=true;
		}
		if(jo.edit && jo.dev){
			this.editControls();
			this.controls();
		}else{			
			this.controls();
		}
		
		this.handleCollision();
		
		if(recording){
			var p= game.get('player');
			game.records[current_rec].push({pos: p.pos.clone(), fr: p.fr});			
		}
		if(recording || current_rec>0){
			rec_frame+=1;
		}
		for(var i in game.records){
			var f = Math.min(game.records[i].length-1, rec_frame);
			game.objects['record'+i].pos = game.records[i][f].pos;
			game.objects['record'+i].fr = game.records[i][f].fr;
		}
			
	});

	game.controls = function(){
		this.player = this.get('player');		
		if(jo.input.once('SPACE')){
			this.player.jump();
			$('#popup').hide();
			$('#menu').hide();
		}
		if(jo.input.once('ESC')){
			game.menu=$('#menu').show();
		}
		if(jo.input.k('RIGHT')){
			this.player.side(1);
		}else if(jo.input.k('LEFT')){
			this.player.side(-1);
		}else{
			this.player.stand();
		}
		if(!recording && jo.input.once('SHIFT') && game.level.device){
			
			jo.files.sfx.rrm.play();
			game.startRecording();
		}else if(recording && !jo.input.k('SHIFT') && game.level.device){
			jo.files.sfx.clkclk.play();
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
		if(jo.input.once('R') ){
			game.resetRecording();
		}
		if(jo.input.once('F') ){
			game.freeze = !game.freeze;
		}
		if(jo.input.k('CTRL')|| jo.input.k('ALT')){

			 if(jo.input.k('UP')){
				 game.map.shift(0,-1,{index: -1});
			 }
			 if(jo.input.k('DOWN')){
				 game.map.shift(0,1,{index: -1});
			 }
			 if(jo.input.k('LEFT')){
				 game.map.shift(-1,0,{index: -1});
			 }
			 if(jo.input.k('RIGHT')){
				 game.map.shift(1,0,{index: -1});
			 }
		}
		if(jo.input.once('TAB')){
			pal = (pal+1)%game.map.tileSet.tiles.length;
		}
		if(jo.tool==='pick'){
			if(jo.input.once('MOUSE1')){
				for(var i in game.objects){
					if(m2d.intersect.pointBox( game.cam.toWorld(jo.input.mouse), game.objects[i])){
						game.selection= i;
					}
				}
			}else if(jo.input.k('MOUSE1') ){
				if(game.selection){
					game.objects[game.selection].pos.copy(game.cam.toWorld(jo.input.mouse));
				}
			 }else{
				 game.selection=false;
			 }
		}
		
		if(jo.tool==='drag'){
			 if(jo.input.k('MOUSE1') ){
				game.cam.subtract(jo.input.mouseMovement());
			 }
		}
		if(jo.tool==='tile'){
			if(jo.input.k('MOUSE1')){
				var p=game.cam.toMap(jo.input.mouse);
				game.map.put(p.x, p.y, {index: pal});
			}
			if(jo.input.k('MOUSE2')){
				var p=game.cam.toMap(jo.input.mouse);
				game.map.put(p.x, p.y, {index: -1});
			}
		}
	};
	game.handleCollision = function(){	
		this.mapCollide3(game.map, this.get('player'));
		
		for(i in this.enemy){
			this.mapCollide(game.map, this.get(enemy[i]));
		}
		var others= [];
		for(i in this.records){
			if(i != current_rec){
				others.push(this.get('record'+i));
			}			
		}
		game.actorCollide2(this.get('player'), others);
	};
	game.actorCollide2 = function(actor, others){
		for(var i in others){
			if(m2d.intersect.boxBox(others[i], actor)){
				var ac = actor.pos.plus(jo.point(actor.width/2, actor.height/2)),
				oc = others[i].pos.plus(jo.point(others[i].width/2, others[i].height/2));
				var x, y;
				if(ac.y <= oc.y ){
					y = {mov: 'N', axis: 'y', dir: -1, depth: actor.pos.y+actor.height-others[i].pos.y };
				}
				else if(ac.y > oc.y){
					y = {mov: 'S', axis: 'y',dir:  1, depth:others[i].pos.y+others[i].height-actor.pos.y};
				}				
				if(ac.x <= oc.x){
					x = {mov: 'W', axis: 'x',dir: -1, depth:actor.pos.x+actor.width-others[i].pos.x };
				}
				else if(ac.x >oc.x){
					x = {mov: 'E', axis: 'x',dir:  1, depth:others[i].pos.x+others[i].width-actor.pos.x };
				}
				var mov=false;
				if(x.depth> y.depth && y.depth>=0){
					mov=y;
				}else if(x.depth>=0){
					mov=x;
				}
				if(typeof mov=== 'object'){
					actor.pos[mov.axis]+= mov.depth*mov.dir;
					if(mov.mov ==='N' ){
						actor.ground=true;
					}
				}				
			}				
		}
	};
	game.mapCollide3 = function(map, actor){
		var mf = map.getFrame();
		actor.pos.x = Math.min(mf.width-actor.width,Math.max(0,actor.pos.x));
		actor.pos.y = Math.min(mf.height,Math.max(0,actor.pos.y));
		if(actor.pos.y > mf.height-actor.height){
			if(recording){
				game.stopLevel();
			}else{
				game.stopLevel();
			}

		}
		
		var tiles = game.tiles = map.getIntersection({x:actor.pos.x, y: actor.pos.y, width: actor.width, height: actor.height});
		if(tiles.length != 4){//be extra sure about it 
			//game.stopLevel();
		}else{
			var col=[], ti=[];
			for(var i in tiles){
				if(jo.includes(game.ts.solid, tiles[i].index) || tiles[i].index == 4){
					ti.push(i);
					if(m2d.intersect.boxBox(tiles[i], actor)){
						if(tiles[i].index == game.ts.exit){
							game.levelDone();
							jo.log('level done');
						}else{
							col.push(i);	
							tiles[i].hit = "yellow";
						}
					}
				}
			}
			/**
			 * |0|1|
			 * |2|3| tiles is ordered like that
			 */
			a_bottom =actor.pos.y+actor.height;
			a_right = actor.pos.x+actor.width;

			var axis = {N :{axis: 'y', dir: -1, depth: a_bottom-tiles[2].pos.y},
						S :{axis: 'y', dir:  1, depth: tiles[0].pos.y+tiles[0].height-actor.pos.y},
						E :{axis: 'x', dir:  1, depth: tiles[0].pos.x+tiles[0].width-actor.pos.x},
						W :{axis: 'x', dir: -1, depth: a_right-tiles[1].pos.x}};
			var mov=[];
			
			if(ti.length>=2){
				//move up
				if(jo.incl(ti,['2','3'])){
					mov.push('N');				
					if(jo.incl(ti,['0'])){
						mov.push('E');								
					}
					if(jo.incl(ti,['1'])){
						mov.push('W');								
					}
				}//move down
				else if(jo.incl(ti,['0','1'])){
					mov.push('S');
					if(jo.incl(ti,['2'])){
						mov.push('E');								
					}
					if(jo.incl(ti,['3'])){
						mov.push('W');								
					}
				}else{
					
					if(jo.incl(ti,['0','2'])){//move right
						mov.push('E');
					}//move left
					else if(jo.incl(ti,['1','3'])){
						mov.push('W');
					}else{
						if(jo.incl(ti, ['0','3'])){
							if(m2d.intersect.boxBox(tiles[1], {pos: actor.lp, width: actor.width, height: actor.height })){//topright
								mov.push('N');
								mov.push('E');
							}else{
								mov.push('S');
								mov.push('W');
							}
						}else if(jo.incl(ti, ['1','2'])){
							if(m2d.intersect.boxBox(tiles[0], {pos: actor.lp, width: actor.width, height: actor.height })){//topright
								mov.push('N');
								mov.push('W');
							}else{
								mov.push('S');
								mov.push('E');
							}
						}
					}
				}
			}else{
				if(jo.incl(ti,['0'])){ //S or E
					mov.push((axis.S.depth < axis.E.depth)? 'S': 'E');								
				}
				if(jo.incl(ti,['1'])){//S or W
					mov.push((axis.S.depth < axis.W.depth)? 'S': 'W');							
				}
				if(jo.incl(ti,['2'])){//N or E
					mov.push((axis.N.depth < axis.E.depth)? 'N': 'E');							
				}
				if(jo.incl(ti,['3'])){//N or W
					mov.push((axis.N.depth < axis.W.depth)? 'N': 'W');							
				}	
			}
			actor.ground=false;
			var applied =[];
			for(var i in mov){
				if(axis[mov[i]].depth >= 0){				
					if(!jo.incl(applied,[mov[i]])){
						actor.pos[axis[mov[i]].axis]+= axis[mov[i]].dir*axis[mov[i]].depth;
						applied.push(mov[i]);
					}				
					if(mov[i]==='N'){
						actor.ground=true;
					}
				}
			}	
		}
	};
});