class ScreenObject {
    /*
    Any temporary foreground object that is not the player.
    Includes background stars, xenon spheres, lights, and enemies.
    */
    constructor(name, position=[0,0,10000], direction=[0, -1, 0]){
        this.name = name;
        this.x_behavior='remove';
        this.object_store = document.xeblaster_items[this.name+"_pool"];
        if(this.object_store.length > 0){
            this.obj = this.object_store[0];
            this.object_store.splice(0, 1);
            this.exists = true;
        }
        else
            this.remove_self();

        // In case the object has an associated light
        if(this.name != 'xenon' && this.name+"_lightpool" in document.xeblaster_items){
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
            if(this.name != 'xenon')
                this.light_store = null;
            else
                this.light_store = document.xeblaster_items[this.name+"_lightpool"];
        }   

        this.position=position;
        this.movement_direction=direction;
        this.speed=0;
        this.supersaiyan = false;

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
        if(this.supersaiyan) modifier=1;
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
        if( (this.x_behavior=='remove' &&
               ((this.position[0] < 1.2*document.xeblaster_settings['screen_left']) ||
                (this.position[0] > 1.2*document.xeblaster_settings['play_right']))) ||
            (this.position[1] < 1.2*document.xeblaster_settings['screen_bottom']) ||
            (this.position[1] > 1.2*document.xeblaster_settings['screen_top'])){
                this.remove_self();
            }
        if(this.x_behavior=='bounce' &&
            this.position[0] <= document.xeblaster_settings['screen_left']){
                this.movement_direction[0]*=-1;
                this.position[0] = document.xeblaster_settings['screen_left'];
            }
        else if(this.x_behavior=='bounce' && 
                this.position[0] >= document.xeblaster_settings['play_right']) {
            this.movement_direction[0]*=-1;
            this.position[0] = document.xeblaster_settings['play_right'];
         }
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
        this.bulletchance = 0.0013;
    }

    animate(modifier){
        super.animate(modifier);

        // If supersaiyan, explode if near player
        if(this.supersaiyan){
            var self=this;
            CheckPlayerCollisions(self, 500, 500, 'kamikaze');
        }

        var rand = Math.random()*document.xeblaster_settings['difficulty_modifier'];
        if(rand < this.bulletchance && (this.supersaiyan || 
            document.xeblaster_items['xenon_lightpool'].length>0)){
            if(!this.supersaiyan){
                this.light = document.xeblaster_items['xenon_lightpool'][0];
                document.xeblaster_items['xenon_lightpool'].splice(0, 1);
            }
            this.light.intensity = 30;
            var direction = [
                document.xeblaster_items['ship']['object'].position.x - this.position[0],
                document.xeblaster_items['ship']['object'].position.y - this.position[1],
                0
            ];
            var mag = Math.sqrt(direction[0]*direction[0] + direction[1] * direction[1]);
            this.movement_direction = [direction[0]/mag, direction[1]/mag, 0];
            this.speed = document.xeblaster_settings['enemy_bullet_speed'];
            //document.xeblaster_items['active_objects'].push(new EnemyBulletObject(this.position,direction));
            document.sounds['whoosh'].currentTime = 0;
            document.sounds['whoosh'].play();
            this.supersaiyan = true;
        }
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

    static createlight(){
        var light = new THREE.PointLight( 0xff0000, 0, 4000 );
        light.position.set(0, 0, 10000);
        document.three['scene'].add(light);
        light.intensity=0;
        document.xeblaster_items['xenon_lightpool'].push(light);
    }
}

class StarObject extends ScreenObject {
    constructor(position, direction=[0, -1, 0]){
        super('star', position, direction);

        var screenw = document.xeblaster_settings['play_right'] - 
                        document.xeblaster_settings['screen_left'];
        this.position = [
            document.xeblaster_settings['screen_left'] + Math.random()*screenw,
            document.xeblaster_settings['screen_top']*1.1,
            document.xeblaster_settings['player_height'] + Math.random()*
            (document.xeblaster_settings['camera_height']-document.xeblaster_settings['player_height'])
        ];
        this.speed = 4.5*(Math.random() * 25 + 5);

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
        this.x_behavior = 'bounce';
        this.movement_direction[0] = Math.random()*2-1.;

        // Place off top of screen
        var screenw = document.xeblaster_settings['play_right'] - document.xeblaster_settings['screen_left'];
        this.position = [
            document.xeblaster_settings['screen_left'] + Math.random()*screenw,
            document.xeblaster_settings['screen_top']*1.1,
            document.xeblaster_settings['player_height']
        ];
        this.speed = 3*(Math.random() * document.xeblaster_settings['xe_speed_variance'] + document.xeblaster_settings['xe_min_speed']);
        this.bulletchance=.01;
        this.rotation_speed = 0;
    }

    animate(modifier){
        super.animate(modifier);

        if(this.rotation_speed>=0){
            this.rotation_speed-=Math.PI/240;
            this.obj.rotation.z += this.rotation_speed;
        }
        var rand = Math.random()*document.xeblaster_settings['difficulty_modifier'];
        if(rand < this.bulletchance){
            var position = [this.position[0], this.position[1], this.position[2]];
            var direction = [
                document.xeblaster_items['ship']['object'].position.x - this.position[0],
                document.xeblaster_items['ship']['object'].position.y - this.position[1],
                0
            ];
            var mag = Math.sqrt(direction[0]*direction[0] + direction[1] * direction[1]);
            direction = [direction[0]/mag, direction[1]/mag, 0];
            this.rotation_speed = Math.PI / 12;
            document.xeblaster_items['active_objects'].push(new EnemyBulletObject(position,direction));
            document.sounds['blaster_player'].currentTime = 0;
            document.sounds['blaster_player'].play();
       }
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

class BomberObject extends ScreenObject {
    constructor(position=[0,0,10000], direction=[1, 0, 0]){
        /*
        We ignore the supplied position and will randomly place this object
        */
        super('bomber', position, direction);
        this.hp=2;
        
        // Place off left of screen in top half
        var screenw = document.xeblaster_settings['play_right'] - document.xeblaster_settings['screen_left'];
        var screenh = document.xeblaster_settings['screen_top'] - document.xeblaster_settings['screen_bottom'];
        this.position = [
            document.xeblaster_settings['screen_left'] - .1*screenw,
            document.xeblaster_settings['screen_bottom'] + 0.7*screenh + Math.random()*(0.25*screenh),
            document.xeblaster_settings['player_height']
        ];
        this.speed = 4.5*(Math.random() * document.xeblaster_settings['xe_speed_variance'] + document.xeblaster_settings['xe_min_speed']);
        this.bulletchance = 0.0025;
    }

    animate(modifier){
        super.animate(modifier);
        this.obj.rotation.y += Math.PI / 24;
        this.obj.rotation.x += Math.PI / 48;
        var rand = Math.random()*document.xeblaster_settings['difficulty_modifier'];
        if(rand < this.bulletchance && document.xeblaster_items['bomb_pool'].length>0){
            var pos = [this.position[0], this.position[1], this.position[2]];
            document.xeblaster_items['active_objects'].push(new EnemyBombObject(pos,[0,-1,0]));
            document.sounds['bomb'].currentTime = 0;
            document.sounds['bomb'].play();
            document.sounds['timer'].currentTime = 0;
            document.sounds['timer'].play();
            document.hasbomb = true;
        }
    }

    static create(){
        /*
        Create this object and add to store
        */
        var s = Math.random() * 100 + 50;
        var geometry = new THREE.TorusGeometry( 200, 40, 8, 20 );
        var material = document.xeblaster_materials['torus_lambert']; 
        var torus = new THREE.Mesh( geometry, material );
        torus.position.set(0, 0, 10000);
        document.three['scene'].add(torus);
        document.xeblaster_items["bomber_pool"].push(torus);
    }
}

class EnemyBombObject extends ScreenObject {
    constructor(position, direction=[0, -1, 0]){
        super('bomb', position, direction);
        this.livesfor = 70;
        this.speed = 2*(Math.random() * 25 + 25);

    }

    animate(modifier){
        super.animate(modifier);
        this.livesfor -=1;
        if(this.livesfor==0){
            MakeExplosion('bomb', this.position[0], this.position[1], this.position[2]);
            this.remove_self();
            var self = this;
            CheckPlayerCollisions(self, 500, 500, 'bomb');
        }
        if(this.exists)
            this.light.intensity = 10;
    }

    static create(){
        var color = 0xff5e13;
        var geometry = new THREE.IcosahedronGeometry( 150, 0 );
        var material = document.xeblaster_materials['bomb_lambert']; 
        var ico = new THREE.Mesh( geometry, material );
        ico.position.set(0, 0, 10000);
        document.three['scene'].add(ico);
        document.xeblaster_items["bomb_pool"].push(ico);

        var bomblight = new THREE.PointLight( color, 0, 4000 );
        bomblight.position.set(0, 0, 10000);
        document.three['scene'].add(bomblight);
        document.xeblaster_items['bomb_lightpool'].push(bomblight);
    }
}


function CreateBullet(name, color, topool=true){ 
    var laserBeam= new THREEx.LaserBeam(color);
    var bullet= laserBeam.object3d
    bullet.rotation.z= -Math.PI/2;
    if(name == 'bullet'){
        if(document.xeblaster_settings['gun_level'] < 2)
            bullet.scale.set(500, 200, 200);
        else  
            bullet.scale.set(500, 350, 350);
    }
    if(name == 'enemybullet')
        bullet.scale.set(200, 120, 120);
    bullet.position.set(0, 0, 10000);
    document.three['scene'].add(bullet); 

    var bulletlight = new THREE.PointLight( color, 0, 4000 );
    bulletlight.position.set(0, 0, 10000);
    document.three['scene'].add(bulletlight);
    
    if(topool){
        document.xeblaster_items[name + "_pool"].push(bullet);
        document.xeblaster_items[name + "_lightpool"].push(bulletlight);
    }
    else{
        return {'b': bullet, 'l': bulletlight}
    }
}

function CheckEnemyCollisions(self, playerbullet){
    document.xeblaster_items['active_objects'].forEach(function(obj){
        var objects = ['xenon', "diamonator", "bomber", "bomb"];
        if(!objects.includes(obj.name))
            return;
        
        var tolerance_x = 150 + (20*document.xeblaster_settings['gun_level']);
        var tolerance_y = 300 + (30*document.xeblaster_settings['gun_level']);
        if(Math.abs(self.position[0] - obj.position[0]) < tolerance_x &&
            Math.abs(self.position[1] - obj.position[1]) < tolerance_y &&
            self.exists){
            obj.hp -= (document.xeblaster_settings['bullet_damage']+(document.xeblaster_settings['gun_level']));
            if(obj.hp > 0){
                self.remove_self();
                MakeExplosion('hit', self.position[0], self.position[1], self.position[2]);
                document.xeblaster_settings['score'] += 1;
            }
            else{
                if(obj.name == 'bomb'){
                    document.sounds['bomb'].pause();

                }

                if(document.xeblaster_settings['gun_level'] < 4)
                    self.remove_self();
                var oname = obj.name;
                if(obj.name == 'xenon' && obj.supersaiyan)
                    oname = 'kamikaze';
                MakeExplosion(oname, self.position[0], self.position[1], self.position[2]);
                obj.remove_self();

                if(playerbullet){
                    if(obj.name == 'xenon'){
                        document.xeblaster_settings['blue_score'] += 5;
                        document.xeblaster_settings['score'] += 10;
                    }
                    if(obj.name == "diamonator"){
                        document.xeblaster_settings['red_score'] += 10;
                        document.xeblaster_settings['score'] += 10;
                    }
                    if(obj.name == "bomber"){
                        document.xeblaster_settings['red_score'] += 10;
                        document.xeblaster_settings['score'] += 10;
                    }
                    if(obj.name == "bomb"){
                        document.xeblaster_settings['red_score'] += 5;
                        document.xeblaster_settings['score'] += 5;
                    }
                }
            }
        }
    });
}

function CheckPlayerCollisions(self, tolerance_x=150, tolerance_y=300, type='playerhit'){
    var obj = document.xeblaster_items['ship']['object'];
    if(Math.abs(self.position[0] - obj.position.x) < tolerance_x &&
        Math.abs(self.position[1] - obj.position.y) < tolerance_y &&
        self.exists){
        self.remove_self();
        if(type=='playerhit'){
            document.xeblaster_settings['blue_score'] -= 25;
            document.xeblaster_items['camera_shake'] = 10;
            document.xeblaster_settings['camera_shake_intensity']=100;
        }
        else if(type=='kamikaze' || type == 'bomb'){
            document.xeblaster_settings['blue_score'] -= 50;
            document.xeblaster_items['camera_shake'] = 70;
            document.xeblaster_settings['camera_shake_intensity']=300;
        }
        if(type=='playerhit')
            MakeExplosion(type, self.position[0], self.position[1], self.position[2]);
        else if(type=='kamikaze' || type == 'bomb')
            MakeExplosion(type, self.position[0], self.position[1], self.position[2],
                    self.movement_direction[0]*self.speed, self.movement_direction[1]*self.speed, 
                    self.movement_direction[2]*self.speed);
    }
}

class BulletObject extends ScreenObject {
    constructor(position, direction=[0, 1, 0]){
        super('bullet', position, direction);

        // Hack to ensure bullet matches current power level
        this.colors=document.xeblaster_settings['gun_colors'];
        if(this.light.color.getHex() != this.colors[document.xeblaster_settings['gun_level']]){
            var bp = this.obj.position;
            var lp = this.light.position;
            document.three['scene'].remove(this.obj);
            document.three['scene'].remove(this.light);
            var bl = CreateBullet('bullet', this.colors[document.xeblaster_settings['gun_level']], false);
            bl['b'].position.set(bp);
            bl['l'].position.set(lp);
            this.obj = bl['b'];
            this.light = bl['l'];
        }

        this.position[0] = document.xeblaster_items['ship']['object'].position.x;                             
        this.position[1] = document.xeblaster_items['ship']['object'].position.y+document.xeblaster_settings['screen_top']/5;                          
        this.position[2] = document.xeblaster_items['ship']['object'].position.z;                             
        if(this.exists)
            this.light.intensity = 10;
        this.speed = document.xeblaster_settings['bullet_speed'];

        //this.animate(1);
    }

    static create(){
        
        var color = 0xffffff;
        CreateBullet('bullet', color);
    }

    animate(modifier){
        super.animate(modifier);

        // Collision detection
        var self = this;
        CheckEnemyCollisions(self, true);
        
    }
}

class EnemyBulletObject extends ScreenObject {
    constructor(position, direction=[0, 1, 0]){
        super('enemybullet', position, direction);
           
        if(this.exists){
            this.light.intensity = 10;
            this.obj.rotation.z = Math.atan(direction[1]/direction[0]);
        }
        this.speed = document.xeblaster_settings['enemy_bullet_speed'];
        //this.animate(1);
    }

    static create(){
        
        var color=0xff3333;
        CreateBullet('enemybullet', color);
    }

    animate(modifier){
        super.animate(modifier);

        // Collision detection
        var self = this;
        CheckPlayerCollisions(self);
        ///CheckEnemyCollisions(self, false);
    }
}
