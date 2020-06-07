function LoadGame(div){

   SetDefaults(div);
   InitializeMemory(div); 
   InitializeControls();
   InitializeScene(div); 
}

function InitializeMemory(div){
    
    // I read somewhere it's worth it to cache materials and not make them
    // in the animation loop to avoid re-computing shaders on the fly.
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
        'star_lambert': new THREE.MeshLambertMaterial( { color: 0x898989, emissive: 0x343434}),
        'diamonator_lambert': new THREE.MeshLambertMaterial( { color: 0x896215, emissive: 0x292525}),

    };

    document.three = {};

}

function InitializeScene(div){
    document.three['scene'] = new THREE.Scene();
    document.three['camera'] = new THREE.OrthographicCamera(document.xeblaster_settings['screen_left'],
    document.xeblaster_settings['screen_right'],document.xeblaster_settings['screen_top'],
    document.xeblaster_settings['screen_bottom'], 1000, 15000 );

    
    document.three['renderer'] = new THREE.WebGLRenderer({ antialias: true, prevision: "lowp" } );
    divw = document.getElementById(div).getBoundingClientRect().width;
    divh = document.getElementById(div).getBoundingClientRect().height;
    console.log(divw, divh);
    document.three['renderer'].setSize( divw, divh );
    document.getElementById(div).appendChild( document.three['renderer'].domElement );
    
    document.three['camera'].position.x = 0;
    document.three['camera'].position.y = 0;
    document.three['camera'].position.z = document.xeblaster_settings['camera_height'];    

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
    while(document.xeblaster_items['xenon_lightpool'].length < 10){
        XenonObject.createlight();
    }
    while(document.xeblaster_items['diamonator_pool'].length < 60){
        DiamonatorObject.create();
    }
    while(document.xeblaster_items['star_pool'].length < 150){
        StarObject.create();
    }
    while(document.xeblaster_items['bullet_pool'].length < 5){
        BulletObject.create();
    }
    while(document.xeblaster_items['enemybullet_pool'].length < 10){
        EnemyBulletObject.create();
    }
    while(document.xeblaster_items['point_lights'].length < 10){
        light=new THREE.PointLight( 0xffffff, 0, 4000 );
        light.position.set(0, 0, 10000);
        document.three['scene'].add(light);
        document.xeblaster_items['point_lights'].push(light);
    }
}

function Reset(div){
    for(var i=0; i<document.xeblaster_items['active_objects'].length; i+=1){
        var obj = document.xeblaster_items['active_objects'][i];
        obj.remove_self();
    }
    SetDefaults(div, notobjects=true);


}





function animate() {
    if(document.xeblaster_settings['run']){
        $("#"+document.music[document.music_index]).trigger('play');

        if(document.xeblaster_items['camera_shake']>0){
            var inten = document.xeblaster_settings['camera_shake_intensity'];
            document.three['camera'].position.x = Math.random()*inten-inten/2;
            document.three['camera'].position.y = Math.random()*inten-inten/2;
            document.xeblaster_items['camera_shake']-=1;
        }
        else{
            document.three['camera'].position.x = 0;
            document.three['camera'].position.y = 0;
        }

        // Blue score: energy
        if(document.xeblaster_settings['blue_score']<=0){
            document.xeblaster_settings['run'] = false;
            document.xeblaster_settings['blue_score'] = 0;
            $("#reveal-container").show();
        }
        if(document.xeblaster_settings['blue_score']>100)
            document.xeblaster_settings['blue_score'] = 100;
        $("#scorebar_blue").height(parseInt(document.xeblaster_settings['blue_score']).toString() + "%");
        $("#scorebar_blue").css({top: 100-(parseInt(document.xeblaster_settings['blue_score']).toString()) + "%"});
        
        // Red score: weapon    
        var red_base = document.xeblaster_settings['gun_levels'][document.xeblaster_settings['gun_level']];
        var next_val = document.xeblaster_settings['gun_levels'][document.xeblaster_settings['gun_level']+1];
        if(document.xeblaster_settings['red_score'] > next_val){
            document.xeblaster_settings['gun_level'] += 1;
            document.xeblaster_settings['difficulty_modifier'] = 1+(document.xeblaster_settings['gun_level']);
            //document.xeblaster_settings['red_score'] = 0;
            document.sounds['whip'].currentTime = 0;
            document.sounds['whip'].play();
            red_base = next_val;
            next_val = document.xeblaster_settings['gun_levels'][document.xeblaster_settings['gun_level']+1];
            $("#scorebar_red_bg").css({"background-color": document.xeblaster_settings['gun_colors'][document.xeblaster_settings['gun_level']]});
            $("#scorebar_red").css({"background-color": document.xeblaster_settings['gun_colors'][document.xeblaster_settings['gun_level']]});

        }
        pct = Math.floor(100*(document.xeblaster_settings['red_score'] - red_base) / (next_val - red_base));

        $("#scorebar_red").css({top: parseInt(100.-pct).toString() + "%"});
        $("#scorebar_red").height(parseInt(pct).toString() + "%");

        $("#score").html(document.xeblaster_settings['score']);
        
        
        var sm = 1+(.5*(document.xeblaster_settings['difficulty_modifier']-1));

        if(document.xeblaster_settings['speed'] == true)
            sm = document.xeblaster_settings['run_modifier'];
        //document.xeblaster_settings['blue_score'] -= sm*document.xeblaster_settings['score_time_decay'];

        document.three['renderer'].render( document.three['scene'], document.three['camera'] );
        r = Math.random()/document.xeblaster_settings['difficulty_modifier'];
        r2 = Math.random()/(1.1*document.xeblaster_settings['difficulty_modifier']);
        if(r<document.xeblaster_settings['xe_spawn_chance']*sm)
            document.xeblaster_items['active_objects'].push(new XenonObject());
        if(r<.2*sm)
            document.xeblaster_items['active_objects'].push(new StarObject());
        if(r2<(document.xeblaster_settings['diamanator_spawn_chance']*sm))
            document.xeblaster_items['active_objects'].push(new DiamonatorObject());

        computePlayerMovement(1);
        for(var i=0; i<document.xeblaster_items['active_objects'].length; i+=1){
            if(document.xeblaster_items['active_objects'][i].exists==false)
                document.xeblaster_items['active_objects'].splice(i, 1);
            else if("name" in document.xeblaster_items['active_objects'][i] && 
                    document.xeblaster_items['active_objects'][i].name != 'bullet'
                    && document.xeblaster_items['active_objects'][i].name != 'enemybullet')
                document.xeblaster_items['active_objects'][i].animate(1*sm);
            else
                document.xeblaster_items['active_objects'][i].animate(1);
        }
        
        animateExplosions(1);
        requestAnimationFrame( animate );
    }
    else{
        $("#"+document.music[document.music_index]).trigger('pause');
    }
}

function SetDefaults(div, notobjects=false){
    mod = 10;
    divw = document.getElementById(div).getBoundingClientRect().width;
    divh = document.getElementById(div).getBoundingClientRect().height;
    document.xeblaster_settings = {
        "difficulty_modifier": 1.0,
        "blue_score": 50,
        'camera_shake_intensity': 100,
        "red_score": 0,
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
        'enemy_bullet_speed': 100,
        'bullet_speed': 400,
        'player_height': 4000, 
        'camera_height': 6000,
        'terrain_scaler': 1, // scale terrain to this times windows dimensions
        'terrain_height': 2000, // where to render background terrain
        'terrain_speed': 30, // how fast terrain flows
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
        'run': false,
        'xe_speed_variance': 2,
        'xe_min_speed': 3,
        'score_time_decay': .02,
        'bullet_cost': 0.05,
        'xe_spawn_chance': .0025,
        'diamanator_spawn_chance': 0.01,
        'score': 0,

        'gun_levels': [
            0, 250, 1000, 2500, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000
        ],
        'gun_colors': [
            0xffffff, 0x3333ff, 0x33ff33, 0x33ff33, 0xCC8899, 0xFF5E13, 0xCC8899, 0xFF5E13, 0xCC8899, 0xFF5E13, 0xCC8899, 0xFF5E13, 0xCC8899, 0xFF5E13
        ],
        'gun_level': 0,
    };
        if(!notobjects){
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
            camera_shake: 0,
            active_objects: [],

            enemies_rendered: [],
            enemies_pool: [],
            bullet_pool: [],
            bullet_lightpool: [],
            explosions: [],
            enemy_fire: [],
            xenon_pool: [],
            xenon_lightpool: [],
            diamonator_pool: [],
            enemybullet_pool: [],
            enemybullet_lightpool: [],
            star_pool: [],
            point_lights: [],
            terrain: [],
        };
    }

}