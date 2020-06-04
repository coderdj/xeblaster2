function InitializeControls(){
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
            if(document.xeblaster_items['bullet_pool'].length > 0){
                document.xeblaster_items['active_objects'].push(new BulletObject());
                document.sounds['blaster_player'].currentTime = 0;
                document.sounds['blaster_player'].play();
            }
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