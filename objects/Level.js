define([''],function(){
	
	
	jo.Level = jo.Tilemap.extend({
		
		init: function(options){
			this._super(options.tileset, options);
			
		},
		load: function(data){
			for(i in data){
				this[i] = data[i];
			}
			
		}
	});
	return jo.Level;
});