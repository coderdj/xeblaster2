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

function MakeExplosion(type, posx, posy, posz){
    tpm = document.xeblaster_settings['terrain_perspective_modifier'];
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
    else if(type == 'xenon' || type == 'diamonator'){
        explosion = {
            //"light": new THREE.PointLight( 0xaaaaff, 1000, 5000 ),
            "light": document.xeblaster_items['point_lights'][0],
            "particles": null,
            'particle_timer': 0,
            'falloff': 500
        }
        if(type == 'xenon')
            explosion['light'].color.setHex(0x6666ff);
        if(type == 'diamonator')
            explosion['light'].color.setHex(0xffaa66);
        explosion['light'].intensity = 2000;
        //explosion['light'].decay = 1000
        //explosion['light'].decay = 20000;
        explosion['light'].position.set(tpm*posx, tpm*posy, posz);
        //explosion['light'].visible = true;  
        document.xeblaster_items['point_lights'].splice(0, 1);
     
        
        // Make Particles
        var photons = new THREE.Geometry();
        particle_vel = 2;
        for(var x=0; x<document.xeblaster_settings['explosion_particles_small']; x+=1){
            var particle = new THREE.Vector3( posx, posy, posz);
            particle.velocity = new THREE.Vector3( particle_vel*GetV(Math.random()),
                           particle_vel*GetV(Math.random()), particle_vel*GetV(Math.random()) );
        
            photons.vertices.push(particle);
        }
        properties = {map: new THREE.CanvasTexture( generateSprite(.5) ),
            size: 20, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, };
        if(type == "xenon") properties['color'] = 0x6666ff;
        else if(type == "diamonator") properties['color'] = 0xffaa66;
        material = new THREE.PointsMaterial(properties);
        var photon_system = new THREE.ParticleSystem( photons, material );
        photon_system.sortParticles = true;
        document.three['scene'].add(photon_system);
        explosion['particles'] = {};
        explosion['particles']['system'] = photon_system;
        explosion['particles']['geometry'] = photons;
        explosion['particle_timer'] = 5;

        idx = Math.floor(Math.random()*3);
        document.sounds['littleboom'][idx].currentTime = 0;
        document.sounds['littleboom'][idx].play(); 

        document.xeblaster_items['explosions'].push(explosion);    

    }
}