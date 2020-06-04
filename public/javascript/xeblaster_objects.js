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
        var material = document.xeblaster_materials['star_lambert'];  
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(0, 0, 10000);
        document.three['scene'].add(sphere);
        document.xeblaster_items["star_pool"].push(sphere);
    }
}


class DiamonatorObject extends ScreenObject {
    constructor(position=[0,0,10000], direction=[0, -1, 0]){
        /*
        We ignore the supplied position and will randomly place this object
        */
        super('diamonator', position, direction);
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
        var s = Math.random() * 50 + 150;
        var geometry = new THREE.OctahedronGeometry( s, 0 );
        var material = document.xeblaster_materials['diamonator_lambert'];  
        var box = new THREE.Mesh( geometry, material );
        //box.rotation.set(0, Math.PI/4, Math.PI/4);
        box.position.set(0, 0, 10000);
        document.three['scene'].add(box);
        document.xeblaster_items["diamonator_pool"].push(box);
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
            if(obj.name != 'xenon' && obj.name != "diamonator")
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
                    if(obj.name == "diamonator"){
                        document.xeblaster_settings['red_score'] += 10;
                        if(document.xeblaster_settings['red_score'] > 100)
                            document.xeblaster_settings['red_score'] = 0;
                    }
                }
            }
        });
    }
}
