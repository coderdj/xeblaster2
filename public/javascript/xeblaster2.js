function LoadGame(){
   // alert("Game loaded");
   InitializeMemory(); 

   $(document).on("keydown", function (e) {
        if(e.which == 87)
	        document.xeblaster_items['ship']['udown']=true;
        else if(e.which == 83)
	        document.xeblaster_items['ship']['ddown']=true;
        else if(e.which == 65)
	        document.xeblaster_items['ship']['ldown']=true;
        else if(e.which == 68)
            document.xeblaster_items['ship']['rdown']=true;
        //else if(e.which==13)
	    //    document.xeblaster_items['ship']['fire']=true;
    });

    $(document).on("keyup", function(e){
        if(e.which == 87)
            document.xeblaster_items['ship']['udown']=false;
        else if(e.which == 83)
            document.xeblaster_items['ship']['ddown']=false;
        else if(e.which == 65)
            document.xeblaster_items['ship']['ldown']=false;
        else if(e.which == 68)
            document.xeblaster_items['ship']['rdown']=false;
        else if(e.which == 13)
            FireBullet(1);
//            document.xeblaster_items['ship']['fire']=false;
        else
            console.log(e.which);
    });
}

function InitializeMemory(){
    // x: -4.7 to 4.7
    // y: -3.5 to 3.5
    // for x 975, y 802

    document.xeblaster_settings = {
        'pause': false,
        'screen_right': window.innerWidth/(2*108.3),
        'screen_left': -1*(window.innerWidth/(2*108.3)),
        'screen_top': window.innerHeight/(2*114.5),
        'screen_bottom': -1*(window.innerHeight/(2*114.5)),
        'move_size': .1,
        'movement_direction': [0, 1, 0],
        'bullet_speed': .4
    };
    document.xeblaster_items = {
        'ship': {
            'x': 0, 
            'y': 0, 
            'z': 0,
            'health': 100,
            'udown': false,
            'ddown': false,
            'ldown': false,
            'rdown': false,
            'fire': false
        },
        enemies: [],
        bullets: [],
        enemy_fire: [],
        xenon: [],
    };

    document.three = {};

}



function MakeNewXenon(){
    var s = Math.random() * .1 + .01;
    var x = Math.random()*10 -5;
    var y = Math.random()*10 -5;
    var z = Math.random()*10 -5;
    var r_x = Math.random()*.05+.005;
    var r_y = Math.random()*.05+.005;
    //var geometry = new THREE.SphereGeometry(s, 64, 64);
    //var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    //var sphere = new THREE.Mesh( geometry, material );
    //document.three['scene'].add(sphere);

    var geometry = new THREE.SphereGeometry(s, 8, 8);
    var material = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set( x, y, z );
    document.three['scene'].add(sphere);
    
    document.xeblaster_items['xenon'].push({
        "sphere": sphere,
        "x": x, "y": y, "z": z,
        "r_x": r_x, "r_y": r_y,
    })
}

function InitializeScene(){
    document.three['scene'] = new THREE.Scene();
    document.three['camera'] = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    document.three['renderer'] = new THREE.WebGLRenderer();
    document.three['renderer'].setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( document.three['renderer'].domElement );

    while(document.xeblaster_items['xenon'].length < 20){
        MakeNewXenon();
    }
    
    document.three['camera'].position.z = 5;

    var lights = [];
			lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
			lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
			lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

			lights[ 0 ].position.set( 0, 200, 0 );
			lights[ 1 ].position.set( 100, 200, 100 );
			lights[ 2 ].position.set( - 100, - 200, - 100 );

			document.three['scene'].add( lights[ 0 ] );
			document.three['scene'].add( lights[ 1 ] );
            document.three['scene'].add( lights[ 2 ] );
            
    var geometry = new THREE.SphereGeometry(1, 64, 64);
    var material = new THREE.MeshPhongMaterial( { color: 0xff0000, side: THREE.DoubleSide, flatShading: true } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set( -5,-2, 0 );
    document.three['scene'].add(sphere);

    // Initialize player avatar
    document.xeblaster_items['ship']['object'] = new THREE.Mesh(new THREE.CylinderGeometry(0,.1,.5),
                            new THREE.MeshBasicMaterial({ wireframe: true } ));
    document.xeblaster_items['ship']['object'].position.set(
                                    document.xeblaster_items['ship']['x'], 
                                    document.xeblaster_items['ship']['y'], 
                                    document.xeblaster_items['ship']['z']);
    document.three['scene'].add(document.xeblaster_items['ship']['object']);

}

function computePlayerMovement(clock_corr){
    if(document.xeblaster_items['ship']['udown'] && 
        document.xeblaster_items['ship']['object'].position.y < document.xeblaster_settings['screen_top']){
            document.xeblaster_items['ship']['object'].position.y += document.xeblaster_settings['move_size']*clock_corr;
    }
    if(document.xeblaster_items['ship']['ddown'] && 
        document.xeblaster_items['ship']['object'].position.y > document.xeblaster_settings['screen_bottom']){
            document.xeblaster_items['ship']['object'].position.y -= document.xeblaster_settings['move_size']*clock_corr;
    }
    if(document.xeblaster_items['ship']['ldown'] && 
        document.xeblaster_items['ship']['object'].position.x > document.xeblaster_settings['screen_left']){
            document.xeblaster_items['ship']['object'].position.x -= document.xeblaster_settings['move_size']*clock_corr;
    } 
    if(document.xeblaster_items['ship']['rdown'] && 
        document.xeblaster_items['ship']['object'].position.x < document.xeblaster_settings['screen_right']){
            document.xeblaster_items['ship']['object'].position.x += document.xeblaster_settings['move_size']*clock_corr;
    } 
      
}

function moveBullets(){
    for(var x=0; x<document.xeblaster_items['bullets'].length; x+=1){
        document.xeblaster_items['bullets'][x].position.x += document.xeblaster_settings['movement_direction'][0]*
                                        document.xeblaster_settings['bullet_speed'];
        document.xeblaster_items['bullets'][x].position.y += document.xeblaster_settings['movement_direction'][1]*
                                        document.xeblaster_settings['bullet_speed'];
        document.xeblaster_items['bullets'][x].position.z += document.xeblaster_settings['movement_direction'][2]*
                                        document.xeblaster_settings['bullet_speed'];
    
        // Check if bullet out of bounds
        if( (document.xeblaster_items['bullets'][x].position.x < 1.2*document.xeblaster_settings['screen_left']) ||
            (document.xeblaster_items['bullets'][x].position.x > 1.2*document.xeblaster_settings['screen_right']) ||
            (document.xeblaster_items['bullets'][x].position.y < 1.2*document.xeblaster_settings['screen_bottom']) ||
            (document.xeblaster_items['bullets'][x].position.y > 1.2*document.xeblaster_settings['screen_top'])){
            document.three['scene'].remove(document.xeblaster_items['bullets'][x]);
            document.xeblaster_items['bullets'].splice(x, 1);
            console.log(document.xeblaster_items['bullets']);
        }
    }
}

function animate() {
    if(!document.xeblaster_settings['pause']){
    	requestAnimationFrame( animate );
        document.three['renderer'].render( document.three['scene'], document.three['camera'] );
        
        for(var i in document.xeblaster_items['xenon']){
            document.xeblaster_items['xenon'][i]['sphere'].rotation.x += 
                document.xeblaster_items['xenon'][i]['r_x'];
            document.xeblaster_items['xenon'][i]['sphere'].rotation.y += 
                document.xeblaster_items['xenon'][i]['r_y'];
        }

        computePlayerMovement(1);
        moveBullets();
       
    }
}


function FireBullet(n){
    colors = [0x4444aa, 0x44aa44, 0xaa4444, 0xffffff];
    color = colors[0];
    if(n<colors.length)
	color=colors[n];
    var laserBeam= new THREEx.LaserBeam(color);
    var object3d= laserBeam.object3d
    object3d.rotation.z= -Math.PI/2;
    object3d.scale.set(.25, 1, .25);
    bullet = object3d;

    //bul = {"x": document.xeblaster_items['ship']['object'].position.x, 'bul': bullet};
    document.xeblaster_items['bullets'].push(bullet);                                                  
    document.three['scene'].add(bullet);                                                          
    bullet.position.x = document.xeblaster_items['ship']['object'].position.x;                             
    bullet.position.y = document.xeblaster_items['ship']['object'].position.y+document.xeblaster_settings['screen_top']/5;                          
    bullet.position.z = document.xeblaster_items['ship']['object'].position.z;                             

}