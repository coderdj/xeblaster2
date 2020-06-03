function LoadGame(div){
   // alert("Game loaded");
   InitializeMemory(div); 

   $(document).on("keydown", function (e) {
        if(e.which == 87)
	        document.xeblaster_items['ship']['udown']=true;
        else if(e.which == 83)
	        document.xeblaster_items['ship']['ddown']=true;
        else if(e.which == 65)
	        document.xeblaster_items['ship']['ldown']=true;
        else if(e.which == 68)
            document.xeblaster_items['ship']['rdown']=true;
        else if(e.which == 16)
            document.xeblaster_settings['speed']=true;
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
        else if(e.which == 13){
            if(document.xeblaster_items['bullet_pool'].length > 0)
                document.xeblaster_items['active_objects'].push(new BulletObject());
        }
//            document.xeblaster_items['ship']['fire']=false;
        else if(e.which == 16)
            document.xeblaster_settings['speed']=false;
        else if(e.which == 8){
            if(document.xeblaster_settings['run'] == true)
                document.xeblaster_settings['run'] = false;
            else{
                document.xeblaster_settings['run'] = true;
                animate();
            }
        }
        else
            console.log(e.which);
    });
}

function InitializeMemory(div){
    mod = 10;
    divw = document.getElementById(div).getBoundingClientRect().width;
    divh = document.getElementById(div).getBoundingClientRect().height;
    document.xeblaster_settings = {
        "blue_score": 50,
        "red_score": 0,
        'pause': false,
        'bullet_damage': 1,
        'explosion_particles_small': 75,
        "play_left": mod*-1*(divw/2),
        "play_right": mod*(divw/2)*.98,
        "screen_left": mod*-1*(divw/2),
        "screen_right": mod*(divw/2),
        'screen_top': mod*(divw/2),
        'screen_bottom': mod*-1*(divw/2),
        'move_size': 60, 
        'movement_direction': [0, 1, 0],
        'bullet_speed': 400,
        'player_height': 4000, 
        'camera_height': 6000,
        'terrain_scaler': 1, // scale terrain to this times windows dimensions
        'terrain_height': 2000, // where to render background terrain
        'terrain_speed': 20, // how fast terrain flows
        'terrain_detail':10, //x and y dimensions of BG terrain
        'terrain_perspective_modifier': 1.4,
        'run_modifier': 4.5,
        'terrain_seed_range': .1,
        'terrain_total_range': 500, //10,
        'terrain_dramatic_factor': .1, // between 0 and 1
        'terrain_display_minimum': 2000, //water level
        'terrain_direction_change_probability': .1, // how likely for an elevation change
        'terrain_initial_height': 0,
        'terrain_color_map': [
            {val: -19, col: [33, 33, 33], geo_index: 0},
            {val: -17, col:  [88, 88, 88], geo_index: 1},
            {val: -13, col: [110, 110, 110], geo_index: 2},
            {val: -11, col: [135, 135, 135], geo_index: 3},
            {val: -9, col: [170, 170, 170], geo_index: 4},
        ],
        /*'terrain_color_map': [
            {val: -19, col: [0, 0, 183], geo_index: 0},
            {val: -17, col:  [183, 86, 0], geo_index: 1},
            {val: -13, col: [0, 111, 7], geo_index: 2},
            {val: -11, col: [135, 135, 135], geo_index: 3},
            {val: -9, col: [250, 250, 250], geo_index: 4},
        ],*/
        'run': true,
        'xe_speed_variance': 2,
        'xe_min_speed': 2,
        'score_time_decay': .02,
        'bullet_cost': 0.05,
        'xe_spawn_chance': .005,
        'score': 0
    };
    document.xeblaster_items = {
        'ship': {
            'x': 0, 
            'y': 0, 
            'z': 4000,
            'health': 100,
            'udown': false,
            'ddown': false,
            'ldown': false,
            'rdown': false,
            'fire': false
        },

        active_objects: [],

        enemies_rendered: [],
        enemies_pool: [],
        bullet_pool: [],
        bullet_lightpool: [],
        explosions: [],
        enemy_fire: [],
        xenon_pool: [],
        star_pool: [],
        point_lights: [],
        terrain: [],
    };


    document.xeblaster_materials = {
        "background_phong": new THREE.MeshPhongMaterial( {
            color: THREE.FaceColors, //0xffffff,
            vertexColors: THREE.FaceColors,
            reflectivity: 1,
            side: THREE.FrontSide,
            transparent: true,
            opacity: .3
        }),
        'sphere_lambert': new THREE.MeshLambertMaterial( { color: 0x156289, emissive: 0x072534}),
    };

    document.three = {};

}

function InitializeScene(div){
    document.three['scene'] = new THREE.Scene();
    document.three['camera'] = new THREE.OrthographicCamera(document.xeblaster_settings['screen_left'],
    document.xeblaster_settings['screen_right'],document.xeblaster_settings['screen_top'],
    document.xeblaster_settings['screen_bottom'], 1000, 15000 );

    document.three['renderer'] = new THREE.WebGLRenderer({ antialias: true } );
    divw = document.getElementById(div).getBoundingClientRect().width;
    divh = document.getElementById(div).getBoundingClientRect().height;
    console.log(divw, divh);
    document.three['renderer'].setSize( divw, divh );
    document.getElementById(div).appendChild( document.three['renderer'].domElement );
    
    document.three['camera'].position.x = 0;
    document.three['camera'].position.y = 0;
    document.three['camera'].position.z = document.xeblaster_settings['camera_height'];

    //document.three['camera'].target.position.y=10;
    

    // Initialize player avatar
    document.xeblaster_items['ship']['object'] = new THREE.Mesh(new THREE.CylinderGeometry(0,100,150),
                            new THREE.MeshBasicMaterial({ wireframe: true } ));
    document.xeblaster_items['ship']['object'].position.set(
                                    document.xeblaster_items['ship']['x'], 
                                    document.xeblaster_items['ship']['y'], 
                                    document.xeblaster_items['ship']['z']);
    // Somehow, a directional light must point at an object. So we need the light plus an object...
    var target = new THREE.Object3D();
    document.xeblaster_items['ship']['light_target'] = target;
    document.xeblaster_items['ship']['light_target'].position.set(
        document.xeblaster_items['ship']['x'], 
        document.xeblaster_items['ship']['y']+500, 
        document.xeblaster_items['ship']['z']);
    
    // Now add ship headlight
    document.xeblaster_items['ship']['light'] = new THREE.SpotLight(0xffffff, 10, 0, Math.PI/7, .2, 2);
    document.xeblaster_items['ship']['light'].position.set(
        document.xeblaster_items['ship']['x'], 
        document.xeblaster_items['ship']['y'], 
        document.xeblaster_items['ship']['z']);
    document.xeblaster_items['ship']['light'].target = target;
    document.three['scene'].add(document.xeblaster_items['ship']['object']);
    document.three['scene'].add(document.xeblaster_items['ship']['light']);
    document.three['scene'].add(document.xeblaster_items['ship']['light_target']);

    CreateInitialTerrain();

    while(document.xeblaster_items['xenon_pool'].length < 30){
        XenonObject.create();
    }
    while(document.xeblaster_items['star_pool'].length < 150){
        StarObject.create();
    }
    while(document.xeblaster_items['bullet_pool'].length < 5){
        BulletObject.create();
    }
    while(document.xeblaster_items['point_lights'].length < 10){
        light=new THREE.PointLight( 0xffffff, 0, 4000 );
        light.position.set(0, 0, 10000);
        document.three['scene'].add(light);
        //light.visible = false;
        document.xeblaster_items['point_lights'].push(light);
    }
    //MakeBackgroundSphere();
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
        document.xeblaster_items['ship']['object'].position.x < document.xeblaster_settings['play_right']){
            document.xeblaster_items['ship']['object'].position.x += document.xeblaster_settings['move_size']*clock_corr;
    } 
    document.xeblaster_items['ship']['light'].position.x = document.xeblaster_items['ship']['object'].position.x;
    document.xeblaster_items['ship']['light'].position.y = document.xeblaster_items['ship']['object'].position.y;
    document.xeblaster_items['ship']['light_target'].position.x = document.xeblaster_items['ship']['object'].position.x;
    document.xeblaster_items['ship']['light_target'].position.y = document.xeblaster_items['ship']['object'].position.y+500;

      
}





function animate() {
    if(document.xeblaster_settings['run']){
        
        $("#scorebar_blue").height(parseInt(document.xeblaster_settings['blue_score']).toString() + "%");
        $("#scorebar_red").height(parseInt(document.xeblaster_settings['red_score']).toString() + "%");
        $("#scorebar_blue").css({top: 100-(parseInt(document.xeblaster_settings['blue_score']).toString()) + "%"});
        $("#scorebar_red").css({top: 100-(parseInt(document.xeblaster_settings['blue_score']).toString()) + "%"});
        $("#score").html(document.xeblaster_settings['score']);
        if(document.xeblaster_settings['blue_score']<0)
            document.xeblaster_settings['blue_score'] = 0;
        sm = 1.;
        if(document.xeblaster_settings['speed'] == true)
            sm = document.xeblaster_settings['run_modifier'];
        document.xeblaster_settings['blue_score'] -= sm*document.xeblaster_settings['score_time_decay'];

        document.three['renderer'].render( document.three['scene'], document.three['camera'] );
        r = Math.random();
        if(r<document.xeblaster_settings['xe_spawn_chance'])
            document.xeblaster_items['active_objects'].push(new XenonObject());
        if(r<.2)
            document.xeblaster_items['active_objects'].push(new StarObject());

        computePlayerMovement(1);
        for(var i=0; i<document.xeblaster_items['active_objects'].length; i+=1){
            if(document.xeblaster_items['active_objects'][i].exists==false)
                document.xeblaster_items['active_objects'].splice(i, 1);
            else
                document.xeblaster_items['active_objects'][i].animate(1);
        }
        
        //animateShootable(1);
        //moveBullets(1);
        animateExplosions(1);
        AnimateTerrain();
        requestAnimationFrame( animate );
    }
}

