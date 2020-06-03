class ScreenObject {
    /*
    Any temporary foreground object that is not the player.
    Includes background stars, xenon spheres, lights, and enemies.
    */
    constructor(name, position=[0,0,10000], direction=[0, -1, 0]){
        this.name = name;
        this.object_store = document.xeblaster_items[this.name+"_pool"];
        if(this.object_store.length > 0){
            this.obj = this.object_store[0];
            this.object_store.splice(0, 1);
            this.exists = true;
        }
        else
            this.remove_self();

        // In case the object has an associated light
        if(this.name+"_lightpool" in document.xeblaster_items){
            this.light_store = document.xeblaster_items[this.name+"_lightpool"];
            if(this.light_store.length > 0){
                this.light = this.light_store[0];
                this.light_store.splice(0, 1);
            }
            else
                this.remove_self();
        }
        else{
            this.light = null;
            this.light_store = null;
        }   

        this.position=position;
        this.movement_direction=direction;
        this.speed=0;
    }

    remove_self(){
        /*
        Put object offscreen. Set local reference to null.
        */
        if(this.obj != null){
            this.obj.position.set(0, 0, 10000);
            this.object_store.push(this.obj);     
        }   
        if(this.light != null){
            this.light.position.set(0, 0, 10000);
            this.light.intensity = 0;
            this.light_store.push(this.light);
        }
        this.exists = false;
    }

    animate(modifier){
        /*
        Calculate new position this frame. Function is calculated
        assuming exactly 1 frame has passed. The modifier object 
        is used to adjust this in case frames are skipped or if the 
        'hyperspeed' key is on.
        */

        this.position[0] += this.movement_direction[0] * this.speed * modifier;
        this.position[1] += this.movement_direction[1] * this.speed * modifier;
        this.position[2] += this.movement_direction[2] * this.speed * modifier;

        this.obj.position.set(this.position[0], this.position[1], this.position[2]);
        if(this.light != null){
            var tpm = document.xeblaster_settings['terrain_perspective_modifier'];
            this.light.position.set(this.position[0]*tpm, this.position[1]*tpm, 
                this.position[2]);
        }

        // Check if out of bounds
        if( (this.position[0] < 1.2*document.xeblaster_settings['screen_left']) ||
            (this.position[0] > 1.2*document.xeblaster_settings['play_right']) ||
            (this.position[1] < 1.2*document.xeblaster_settings['screen_bottom']) ||
            (this.position[1] > 1.2*document.xeblaster_settings['screen_top']))
                this.remove_self();
            
    }
}

class XenonObject extends ScreenObject {
    constructor(position=[0,0,10000], direction=[0, -1, 0]){
        /*
        We ignore the supplied position and will randomly place this object
        */
        super('xenon', position, direction);
        this.hp=3;
        
        // Place off top of screen
        var screenw = document.xeblaster_settings['play_right'] - document.xeblaster_settings['screen_left'];
        this.position = [
            document.xeblaster_settings['screen_left'] + Math.random()*screenw,
            document.xeblaster_settings['screen_top']*1.1,
            document.xeblaster_settings['player_height']
        ];
        this.speed = Math.random() * document.xeblaster_settings['xe_speed_variance'] + document.xeblaster_settings['xe_min_speed'];
    }

    static create(){
        /*
        Create this object and add to store
        */
        var s = Math.random() * 100 + 50;
        var geometry = new THREE.SphereGeometry(s, 8, 8);
        var material = document.xeblaster_materials['sphere_lambert'];  
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(0, 0, 10000);
        document.three['scene'].add(sphere);
        document.xeblaster_items["xenon_pool"].push(sphere);
    }
}

class StarObject extends ScreenObject {
    constructor(position, direction=[0, -1, 0]){
        super('star', position, direction);

        var screenw = document.xeblaster_settings['play_right'] - document.xeblaster_settings['screen_left'];
        this.position = [
            document.xeblaster_settings['screen_left'] + Math.random()*screenw,
            document.xeblaster_settings['screen_top']*1.1,
            document.xeblaster_settings['player_height'] + Math.random()*
            (document.xeblaster_settings['camera_height']-document.xeblaster_settings['player_height'])
        ];
        this.speed = Math.random() * 25 + 5;

    }

    static create(){
        var s = Math.random() * 20 + 20;
        var geometry = new THREE.SphereGeometry(s, 8, 8);
        var material = document.xeblaster_materials['sphere_lambert'];  
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(0, 0, 10000);
        document.three['scene'].add(sphere);
        document.xeblaster_items["star_pool"].push(sphere);
    }
}


class BulletObject extends ScreenObject {
    constructor(position, direction=[0, 1, 0]){
        super('bullet', position, direction);

        this.position[0] = document.xeblaster_items['ship']['object'].position.x;                             
        this.position[1] = document.xeblaster_items['ship']['object'].position.y+document.xeblaster_settings['screen_top']/5;                          
        this.position[2] = document.xeblaster_items['ship']['object'].position.z;                             
        this.light.intensity = 10;
        this.speed = document.xeblaster_settings['bullet_speed'];

        this.animate(1);
    }

    static create(){
        var n = document.xeblaster_settings['bullet_damage'];
        var colors = {
            1: 0xffffff,
            2: 0x0000ff,
            3: 0x00ff00,
            4: 0xff0000
        };
        var color=colors[n];
    
        var laserBeam= new THREEx.LaserBeam(color);
        var bullet= laserBeam.object3d
        bullet.rotation.z= -Math.PI/2;
        bullet.scale.set(500, 200, 200);
        bullet.position.set(0, 0, 10000);
        document.three['scene'].add(bullet); 
        document.xeblaster_items["bullet_pool"].push(bullet);

        var bulletlight = new THREE.PointLight( color, 0, 4000 );
        bulletlight.position.set(0, 0, 10000);
        document.three['scene'].add(bulletlight);    
        document.xeblaster_items["bullet_lightpool"].push(bulletlight);
    }

    animate(modifier){
        super.animate(modifier);

        // Collision detection
        var self = this;
        document.xeblaster_items['active_objects'].forEach(function(obj){
            if(obj.name != 'xenon')
                return;
            
            var tolerance_x = 150;
            var tolerance_y = 300;

            if(Math.abs(self.position[0] - obj.position[0]) < tolerance_x &&
                Math.abs(self.position[1] - obj.position[1]) < tolerance_y &&
                self.exists){
                self.remove_self();
                obj.hp -= document.xeblaster_settings['bullet_damage'];
                if(obj.hp > 0)
                    MakeExplosion('hit', self.position[0], self.position[1], self.position[2]);
                else{
                    MakeExplosion(obj.name, self.position[0], self.position[1], self.position[2]);
                    obj.remove_self();

                    if(obj.name == 'xenon'){
                        document.xeblaster_settings['blue_score'] += 10;
                        if(document.xeblaster_settings['blue_score'] > 100)
                            document.xeblaster_settings['blue_score'] = 100;
                        document.xeblaster_settings['score'] += 10;
                    }
                }
            }
        });
    }
}




/*
function animateShootable(clock_corr){
    // Move xenon
    items = ['xenon_rendered', 'star_rendered'];
    stores = ['xenon_pool', 'star_pool'];
    rm = 1.;
    if(document.xeblaster_settings['speed'] == true)
        rm = document.xeblaster_settings['run_modifier'];
    for(var i=0; i<items.length; i+=1){
        item = items[i];
        store = stores[i];
        for(var x=0;x<document.xeblaster_items[item].length; x+=1){
            xe = document.xeblaster_items[item][x];
            //xe['x'] +=  document.xeblaster_settings['movement_direction'][1]*xe['speed']*clock_corr;
            xe['y'] -=  document.xeblaster_settings['movement_direction'][1]*xe['speed']*clock_corr*rm;
            xe['obj'].position.set(xe['x'], xe['y'], xe['z']);

            // Check if out
            if( (xe['x'] < 1.2*document.xeblaster_settings['screen_left']) ||
                (xe['x'] > 1.2*document.xeblaster_settings['play_right']) ||
                (xe['y'] < 1.2*document.xeblaster_settings['screen_bottom']) ||
                (xe['y'] > 1.2*document.xeblaster_settings['screen_top'])){
                xe['obj'].position.set(0, 0, 10000);
                document.xeblaster_items[store].push(xe);
                document.xeblaster_items[item].splice(x, 1);
            }
        }
    }
}
*/

/*
function RenderSphere(category){
    // Pull object out of category and render it in active area
    store = category + '_pool';
    active = category + '_rendered';
    if(document.xeblaster_items[store].length == 0)
        return;
    item = document.xeblaster_items[store][0];

    screenw = document.xeblaster_settings['play_right'] - document.xeblaster_settings['screen_left'];
    item['x'] = document.xeblaster_settings['screen_left'] + Math.random()*screenw;
    item['y'] =  document.xeblaster_settings['screen_top']*1.1;
    if(category == 'xenon')
        item['z'] = document.xeblaster_settings['player_height'];//Math.random()*3 - 1.5;
    else
        item['z'] = document.xeblaster_settings['player_height'] + Math.random()*(
            document.xeblaster_settings['camera_height']-document.xeblaster_settings['player_height']
        );

    if(category=='xenon')
        item['speed'] = Math.random() * document.xeblaster_settings['xe_speed_variance'] + document.xeblaster_settings['xe_min_speed'];
    else
        item['speed'] = Math.random() * 25 + 5;
    item['hp'] = 3;
    item['obj'].position.set( item['x'], item['y'], item['z']);

    document.xeblaster_items[active].push(item);
    document.xeblaster_items[store].splice(0, 1);
}
*/
/*
function MakeNewSphere(category){
    size_base = { 'xenon': 100, 'star': 20};
    size_variance = {'xenon': 100, 'star': 20};
    var s = Math.random() * size_base[category] + size_variance[category];
    var geometry = new THREE.SphereGeometry(s, 8, 8);
    var material = document.xeblaster_materials['sphere_lambert'];//, side: THREE.DoubleSide, flatShading: true } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(0, 0, 10000);
    document.three['scene'].add(sphere);
    item = {
        'obj': sphere,
        'hp': 3, 
        's': s,
        'x': 0, 'y': 0, 'z': 10000,
        'speed': 0
    }
    document.xeblaster_items[category+"_pool"].push(item);
}
*/

/*
function MakeNewBullet(){
    n = document.xeblaster_settings['bullet_damage'];
    colors = {
        1: 0xffffff,
        2: 0x0000ff,
        3: 0x00ff00,
        4: 0xff0000
    };
    color=colors[n];
    
    var laserBeam= new THREEx.LaserBeam(color);
    var object3d= laserBeam.object3d
    object3d.rotation.z= -Math.PI/2;
    object3d.scale.set(500, 200, 200);
    bullet = object3d;
    bullet.position.set(0, 0, 10000);
    document.three['scene'].add(bullet); 

    bulletlight = new THREE.PointLight( color, 0, 4000 );
    bulletlight.position.set(0, 0, 10000);
    document.three['scene'].add(bulletlight);    
    
    document.xeblaster_items['bullet_pool'].push({
        "bullet": bullet,
        "light": bulletlight,
        "damage": document.xeblaster_settings['bullet_damage']
    });   
}
*/
/*
function FireBullet(){

    if(document.xeblaster_items['bullet_pool'].length == 0)
        return;
    b = document.xeblaster_items['bullet_pool'][0];
    bullet = b['bullet'];
    bulletlight = b['light'];

    document.xeblaster_settings['blue_score'] -= document.xeblaster_settings['bullet_cost'];
    
    //bul = {"x": document.xeblaster_items['ship']['object'].position.x, 'bul': bullet};                                         
    bullet.position.x = document.xeblaster_items['ship']['object'].position.x;                             
    bullet.position.y = document.xeblaster_items['ship']['object'].position.y+document.xeblaster_settings['screen_top']/5;                          
    bullet.position.z = document.xeblaster_items['ship']['object'].position.z;                             
    
    // Bullet glow effect                               
    bulletlight.position.x = document.xeblaster_settings['terrain_perspective_modifier']*document.xeblaster_items['ship']['object'].position.x;                             
    bulletlight.position.y = document.xeblaster_settings['terrain_perspective_modifier']*document.xeblaster_items['ship']['object'].position.y+document.xeblaster_settings['screen_top']/5;                          
    bulletlight.position.z = document.xeblaster_items['ship']['object'].position.z;
    bulletlight.intensity = 10;

    document.xeblaster_items['bullet_rendered'].push(b);
    document.xeblaster_items['bullet_pool'].splice(0, 1);                                                   

}
*/
/*
function moveBullets(clock_corr){
    for(var x=0; x<document.xeblaster_items['bullet_rendered'].length; x+=1){
        bullet = document.xeblaster_items['bullet_rendered'][x];
        bullet['bullet'].position.x += document.xeblaster_settings['movement_direction'][0]*
                                        document.xeblaster_settings['bullet_speed']*clock_corr;
        bullet['bullet'].position.y += document.xeblaster_settings['movement_direction'][1]*
                                        document.xeblaster_settings['bullet_speed']*clock_corr;
        bullet['bullet'].position.z += document.xeblaster_settings['movement_direction'][2]*
                                        document.xeblaster_settings['bullet_speed']*clock_corr;
        bullet['light'].position.x += document.xeblaster_settings['movement_direction'][0]*
                                        document.xeblaster_settings['bullet_speed']*document.xeblaster_settings['terrain_perspective_modifier']*clock_corr;
        bullet['light'].position.y += document.xeblaster_settings['movement_direction'][1]*
                                        document.xeblaster_settings['bullet_speed']*document.xeblaster_settings['terrain_perspective_modifier']*clock_corr;
        bullet['light'].position.z += document.xeblaster_settings['movement_direction'][2]*
                                        document.xeblaster_settings['bullet_speed']*clock_corr;
    
        // Check if bullet out of bounds
        if( (bullet['bullet'].position.x < 1.2*document.xeblaster_settings['screen_left']) ||
            (bullet['bullet'].position.x > 1.2*document.xeblaster_settings['play_right']) ||
            (bullet['bullet'].position.y < 1.2*document.xeblaster_settings['screen_bottom']) ||
            (bullet['bullet'].position.y > 1.2*document.xeblaster_settings['screen_top'])){
                bullet['bullet'].position.set(0, 0, 10000);
                bullet['light'].position.set(0, 0, 10000);
                bullet['light'].intensity = 0;
                document.xeblaster_items['bullet_rendered'].splice(x, 1);
                document.xeblaster_items['bullet_pool'].push(bullet);
                continue;
        }
        for(var y=0;y<document.xeblaster_items['xenon_rendered'].length; y+=1){
            var xe = document.xeblaster_items['xenon_rendered'][y];
            tolerance_y = 3;
            if(Math.abs(bullet['bullet'].position.x - xe['x']) < xe['s'] &&
                Math.abs(bullet['bullet'].position.y - xe['y']) < xe['s']*tolerance_y){
                    RegisterHit('xenon', y, bullet['damage']);
                    bullet['bullet'].position.set(0, 0, 10000);
                    bullet['light'].position.set(0, 0, 10000);
                    bullet['light'].intensity = 0;
                    document.xeblaster_items['bullet_rendered'].splice(x, 1);
                    document.xeblaster_items['bullet_pool'].push(bullet);
                    break;
            }
        }
    }
}
*/

function RegisterHit(hittable, index, strength){
    hittable_source = hittable + "_pool";
    hittable_rendered = hittable + "_rendered";
    document.xeblaster_items[hittable_rendered][index]['hp'] -= strength;
    posx = document.xeblaster_items[hittable_rendered][index]['obj'].position.x;
    posy = document.xeblaster_items[hittable_rendered][index]['obj'].position.y;
    posz = document.xeblaster_items[hittable_rendered][index]['obj'].position.z;
    if(document.xeblaster_items[hittable_rendered][index]['hp']<=0){
        document.xeblaster_items[hittable_rendered][index]['obj'].position.set(0, 0, 10000);
        document.xeblaster_items[hittable_source].push(document.xeblaster_items[hittable_rendered][index]);
        MakeExplosion(hittable, posx, posy, posz);
        document.xeblaster_items[hittable_rendered].splice(index, 1);
        if(hittable == 'xenon'){
            document.xeblaster_settings['blue_score'] += 10;
            if(document.xeblaster_settings['blue_score'] > 100)
                document.xeblaster_settings['blue_score'] = 100;
            document.xeblaster_settings['score'] += 10;
        }
    }
    else
        MakeExplosion('hit', posx, posy, posz);
}

/*
function MakeBackgroundSphere(){
    var x=0, y=0, z=-300;
    var s=300;

    var loader = new THREE.TextureLoader();
    loader.load( '/javascript/dnb_land_ocean_ice.2012.13500x6750.jpg', function ( texture ) {

     
    var material = new THREE.MeshLambertMaterial( { map: texture } );
    var geometry = new THREE.SphereBufferGeometry(s, 300, 300);
    var sphere = new THREE.Mesh( geometry, material );
    //group.add( mesh );

    //
    //var geometry = new THREE.SphereBufferGeometry(s, 300, 300);
    //var material = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, 
    //    side: THREE.DoubleSide, flatShading: true } );
    //var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set( x, y, z );
    document.three['scene'].add(sphere);
    document.xeblaster_items['background_sphere'] = sphere;
});
}
*/