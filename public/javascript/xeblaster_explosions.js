function animateExplosions(clock_corr){
    for(var x=0; x< document.xeblaster_items['explosions'].length; x+=1){
        ex = document.xeblaster_items['explosions'][x];

        if(ex['light'] != null){
            inte = ex['light'].intensity;
            inte -= ex['falloff']*clock_corr;
            if(inte<=0){
                ex['light'].intensity=0;
                //explosion['light'].visible = false;
                ex['light'].position.set(0, 0, 10000);
                document.xeblaster_items['point_lights'].push(ex['light']);
                document.xeblaster_items['explosions'][x]['light'] = null;
            }
            else
                ex['light'].intensity = inte;
        }
        
        // Particle animation
        if(ex['particles']!= null){
            if(ex['particle_timer'] <= 0){
                document.three['scene'].remove(ex['particles']['system']);
                document.xeblaster_items['explosions'][x]['particles'] = null;
            }
            else{
                photons = ex['particles']['geometry'];
                photon_system = ex['particles']['system'];
                for ( p=0; p<photons.vertices.length; p+=1 ){
                    var photon = photons.vertices[p];
                    velocity = new THREE.Vector3(photon.velocity.x*1.5,
                        photon.velocity.y*1.5, photon.velocity.z*1.5 - 25);
                    photon.add(velocity);
                }
                photon_system.geometry.verticesNeedUpdate=true;
                document.xeblaster_items['explosions'][x]['particle_timer'] -= clock_corr;
            }
        }

        if(ex['light'] == null && ex['particles'] == null){
            document.xeblaster_items['explosions'].splice(x, 1);
        }

    }

}

function GetV(seed){
    // seed is between 0 and 1. This returns a random      
    // number with magnitude at least 5     
      absval = (12.*seed - 6.)*12.;
      if(absval<0)
          absval-=5.;
      if(absval>=0)
          absval+=5.;
      return absval;
}
function generateSprite(scaler) {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 16*scaler;
    canvas.height = 16*scaler;
    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
    gradient.addColorStop( 0.4, 'rgba(0,255,255,.6)' );
    gradient.addColorStop( 0.6, 'rgba(0,0,64,.3)' );
    gradient.addColorStop( 1, 'rgba(0,0,64,0.0)' );
    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );
    return canvas;
    }

function MakeExplosion(type, posx, posy, posz, vx=0, vy=0, vz=0){
    tpm = document.xeblaster_settings['terrain_perspective_modifier'];
    var bigobjects = ['xenon', 'diamonator', 'playerhit', 'kamikaze', 'bomber', 'bomb'];
    if(document.xeblaster_items['point_lights'].length == 0)
        return;
    if(type=='hit'){
        explosion = {
            //"light": new THREE.PointLight( colors[document.xeblaster_settings['bullet_damage']], 75, 5000 ),
            "light": document.xeblaster_items['point_lights'][0],
            "particles": null,
            "particle_timer": 0,
            'falloff': 25
        }
        document.xeblaster_items['point_lights'].splice(0, 1);
        explosion['light'].color.setHex(0xffffff);
        explosion['light'].intensity = 75;
        //explosion['light'].decay = 4000;
        //explosion['light'].visible = true;  
        explosion['light'].position.set(tpm*posx, tpm*posy, posz);
        document.xeblaster_items['explosions'].push(explosion);  
        document.sounds['minihit'].currentTime = 0;
        document.sounds['minihit'].play();                         
    }
    else if(bigobjects.includes(type)){
        // Defaults
        var falloff=500;
        var color = 0x6666ff;
        var particle_vel=2;
        var nparticles = document.xeblaster_settings['explosion_particles_small'];
        var psize=20;
        var ptimer=5;
        if(type == 'diamonator')
            color = 0xff8844;
        if(type == 'xenon')
           color = 0x6666ff;
        if(type == "bomber")
            color = 0xff5e13;
        if(type == 'playerhit'){
            nparticles/=2;
            color = 0xff0000;
        }
        if(type=="bomb"){
            color = 0xff5e13;
            falloff = 100;
            nparticles*=3;
            particle_vel=1;
            psize=40;
            ptimer=25;
        }
        if(type=='kamikaze'){ 
            color = 0xff0000;
            falloff = 100;
            nparticles*=3;
            particle_vel=.5;
            psize=50;
            ptimer=35;
        }
        explosion = {
            "light": document.xeblaster_items['point_lights'][0],
            "particles": null,
            'particle_timer': 0,
            'falloff': falloff
        }
        explosion['light'].color.setHex(color);
        explosion['light'].intensity = 2000;
        explosion['light'].position.set(tpm*posx, tpm*posy, posz);
        document.xeblaster_items['point_lights'].splice(0, 1);
     
        
        // Make Particles
        var photons = new THREE.Geometry();
        for(var x=0; x<nparticles; x+=1){
            var particle = new THREE.Vector3( posx, posy, posz);
            particle.velocity = new THREE.Vector3( vx+particle_vel*GetV(Math.random()),
                           vy+particle_vel*GetV(Math.random()), vz+particle_vel*GetV(Math.random()) );
        
            photons.vertices.push(particle);
        }
        
        
        properties = {map: new THREE.CanvasTexture( generateSprite(.5) ),
            size: psize, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, };
        if(type == "xenon") properties['color'] = 0x6666ff;
        else if(type == "diamonator") properties['color'] = 0xff8844;
        else if(type == "playerhit" || type=='kamikaze') properties['color'] = 0xff0000;
        else if(type=="bomb") properties['color'] = 0xff5e13;

        material = new THREE.PointsMaterial(properties);
        var photon_system = new THREE.ParticleSystem( photons, material );
        photon_system.sortParticles = true;
        document.three['scene'].add(photon_system);
        explosion['particles'] = {};
        explosion['particles']['system'] = photon_system;
        explosion['particles']['geometry'] = photons;
        explosion['particle_timer'] = ptimer;

        if(type == 'kamikaze'){
            document.sounds['bigboom'].currentTime = 0;
            document.sounds['bigboom'].play(); 
        }
        else if(type=="bomb"){
            document.sounds['bomb_explode'].currentTime = 0;
            document.sounds['bomb_explode'].play();
        }
        else if(type=="xenon"){
            document.sounds['littleboom'][3].currentTime = 0;
            document.sounds['littleboom'][3].play(); 
        }
        else if(type=="bomber"){
            document.sounds['coin'].currentTime = 0;
            document.sounds['coin'].play(); 
        }
        else{
            idx = Math.floor(Math.random()*3);
            document.sounds['littleboom'][idx].currentTime = 0;
            document.sounds['littleboom'][idx].play(); 
        }
        document.xeblaster_items['explosions'].push(explosion);    

    }
}