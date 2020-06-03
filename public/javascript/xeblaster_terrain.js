function CreateInitialTerrain(){
    // Assumes you have document.xeblaster_settings with screen_top/bottom/left/right
    var td = document.xeblaster_settings['terrain_detail'];
    document.xeblaster_items['last_terrain_row'] = [];
    document.xeblaster_items['last_terrain_slope'] = [];
    var tsr = document.xeblaster_settings['terrain_seed_range'];
    var th = document.xeblaster_settings['terrain_height'];
    var sr = document.xeblaster_settings['terrain_seed_range'];
    var initial_seed = (Math.random()*sr*2)-sr+document.xeblaster_settings['terrain_initial_height'];
    var df = document.xeblaster_settings['terrain_dramatic_factor'];
    var pv = initial_seed;
    for(var x=0; x<=td; x+=1){
        pv = (((Math.random()*2*sr)-sr)*df)+pv;
        document.xeblaster_items['last_terrain_row'].push(pv);
        document.xeblaster_items['last_terrain_slope'].push(
            ((Math.random()*2*tsr)-tsr)*df);
    }
    MakeTerrainGrid(0, 0, 
        document.xeblaster_settings['terrain_scaler']*2*
        (document.xeblaster_settings['screen_top'] - document.xeblaster_settings['screen_bottom']),
        document.xeblaster_settings['terrain_scaler']*1.5*
        (document.xeblaster_settings['screen_right'] - document.xeblaster_settings['screen_left']),
        td, td);
    

}

function AnimateTerrain(){

    var ts = document.xeblaster_settings['terrain_speed'];
    if(document.xeblaster_settings['speed'] == true)
        ts *= document.xeblaster_settings['run_modifier'];
    //console.log(document.xeblaster_items['terrain'].length)
    for(var i=0; i<document.xeblaster_items['terrain'].length; i+=1){
        document.xeblaster_items['terrain'][i].position.x -= ts*document.xeblaster_settings['movement_direction'][0];
        document.xeblaster_items['terrain'][i].position.y -= ts*document.xeblaster_settings['movement_direction'][1];
        
        var x = document.xeblaster_items['terrain'][i].position.x;
        var y = document.xeblaster_items['terrain'][i].position.y;
        var sh = (document.xeblaster_settings['screen_top'] - document.xeblaster_settings['screen_bottom']);
        var sw = (document.xeblaster_settings['screen_right'] - document.xeblaster_settings['screen_left']);
        var th = document.xeblaster_settings['terrain_scaler']*sh*2;
        var tw = document.xeblaster_settings['terrain_scaler']*sw*1.5;
        // We want to check if this thing is OUT of the render space, considering movement direction
        if(
            // Case 1: Movement Y positive (terrain flows down)
            (document.xeblaster_settings['movement_direction'][1] > 0 &&
            y < -th) ||

            // Case 2: Movement Y negative (terrain flows up)
            (document.xeblaster_settings['movement_direction'][1] < 0 &&
            y > th) ||

            // Case 3: Movement X positive (terrain flows left)
            (document.xeblaster_settings['movement_direction'][0] > 0 &&
            x < -tw) ||

            // Case 3: Movement X negative (terrain flows right)
            (document.xeblaster_settings['movement_direction'][0] < 0 &&
            x > tw) 
        ){
            //console.log("REMOVED");
            
            document.three['scene'].remove(document.xeblaster_items['terrain'][i]);
            document.xeblaster_items['terrain'].splice(i, 1);
            continue;
        }

        // Now assuming it's in the render space, if this is the last piece of terrain in the list
        // we want to check if we should render its follower. The follower should be rendered as soon
        // as this terrain piece passes the Y midpoint (if there is movement in Y), otherwise the X mid
        if(i == document.xeblaster_items['terrain'].length -1){
            if(
                (document.xeblaster_settings['movement_direction'][1]>0 &&
                document.xeblaster_items['terrain'][i].position.y < 0) ||

                (document.xeblaster_settings['movement_direction'][1]<0 &&
                document.xeblaster_items['terrain'][i].position.y > 0) ||

                (document.xeblaster_settings['movement_direction'][1]==0 &&
                 document.xeblaster_settings['movement_direction'][0]>0 &&
                 document.xeblaster_items['terrain'][i].position.x < 0) ||

                 (document.xeblaster_settings['movement_direction'][1]==0 &&
                 document.xeblaster_settings['movement_direction'][0]<0 &&
                 document.xeblaster_items['terrain'][i].position.x > 0)                 
            ){

            
            var xfac = 0;
            var yfac = 0;
            if(document.xeblaster_settings['movement_direction'][0]>0)
                xfac = 1;
            if(document.xeblaster_settings['movement_direction'][0]<0)
                xfac = -1;
            if(document.xeblaster_settings['movement_direction'][1]>0)
                yfac = 1;
            if(document.xeblaster_settings['movement_direction'][1]<0)
                yfac = -1;
            var td = document.xeblaster_settings['terrain_detail']
            MakeTerrainGrid(xfac*(document.xeblaster_items['terrain'][i].position.x + tw), 
                            yfac*(document.xeblaster_items['terrain'][i].position.y + th),
                            th, tw, td, td); 
            }
        }

    }
}

function MakeTerrainGrid(x, y, height, width, segmentsx, segmentsy){
    var z_min = -1;
    var z_max = 1;
    var z_pos = document.xeblaster_settings['terrain_height'];

    var geometry = 
    new THREE.PlaneGeometry(width, height,segmentsx, segmentsy);

    var length = geometry.vertices.length;
    var last_slope = [];
    var last_values = [];
    //console.log(geometry.vertices.length);
    //console.log(geometry.faces.length);

    // This double for puts into coodinates I can understand
    for(var yindex=segmentsy; yindex>=0; yindex-=1){ 
        for(var xindex=0; xindex<=segmentsx; xindex+=1){
            var index = yindex*(segmentsy+1) + xindex;
            
            //geometry.vertices[index].z = (segmentsy-yindex)*1 + z_pos;
            //console.log("INDEX: " + String(index) + " has position " + String(geometry.vertices[index].x) + 
            //", " + String(geometry.vertices[index].y) + ", " + String(geometry.vertices[index].z))
            //continue;
            var random_index_2 = Math.floor(Math.random()*segmentsx);
            var random_index_3 = Math.floor(Math.random()*segmentsx);

            //console.log(index);
            if(yindex == segmentsy){
                last_values.push(document.xeblaster_items['last_terrain_row'][xindex]);
                last_slope.push(document.xeblaster_items['last_terrain_slope'][xindex]);
                geometry.vertices[index].z = document.xeblaster_items['last_terrain_row'][xindex];
                continue;
            }

            var bin_project = document.xeblaster_items['last_terrain_slope'][xindex] + 
                document.xeblaster_items['last_terrain_row'][xindex];
            prev_bin = document.xeblaster_items['last_terrain_row'][xindex];
            var prev_slope = document.xeblaster_items['last_terrain_slope'][xindex];
            
            // For random indices
            bin_project += document.xeblaster_items['last_terrain_slope'][random_index_2] + 
                    document.xeblaster_items['last_terrain_row'][random_index_2];
            prev_bin += document.xeblaster_items['last_terrain_row'][random_index_2];
            prev_slope += document.xeblaster_items['last_terrain_slope'][random_index_2];
            bin_project += document.xeblaster_items['last_terrain_slope'][random_index_3] + 
                document.xeblaster_items['last_terrain_row'][random_index_3];
            prev_bin += document.xeblaster_items['last_terrain_row'][random_index_3];
            prev_slope += document.xeblaster_items['last_terrain_slope'][random_index_3];
            /*if(xindex !=0){
                bin_project += document.xeblaster_items['last_terrain_slope'][xindex-1] + 
                    document.xeblaster_items['last_terrain_row'][xindex-1];
                prev_bin += document.xeblaster_items['last_terrain_row'][xindex-1];
                prev_slope += document.xeblaster_items['last_terrain_slope'][xindex-1];
            }
            else{
                bin_project += document.xeblaster_items['last_terrain_slope'][segmentsx] + 
                    document.xeblaster_items['last_terrain_row'][segmentsx];
                prev_bin += document.xeblaster_items['last_terrain_row'][segmentsx];
                prev_slope += document.xeblaster_items['last_terrain_slope'][segmentsx];

            }
            if(xindex < segmentsx){
                bin_project += document.xeblaster_items['last_terrain_slope'][xindex+1] + 
                    document.xeblaster_items['last_terrain_row'][xindex+1];
                prev_bin += document.xeblaster_items['last_terrain_row'][xindex+1];
                prev_slope += document.xeblaster_items['last_terrain_slope'][xindex+1];
            }
            else{
                bin_project += document.xeblaster_items['last_terrain_slope'][0] + 
                    document.xeblaster_items['last_terrain_row'][0];
                prev_bin += document.xeblaster_items['last_terrain_row'][0];
                prev_slope += document.xeblaster_items['last_terrain_slope'][0];
            }
            */

            bin_project = bin_project/3;
            prev_bin = prev_bin/3;
            prev_slope = prev_slope/3;

            //bin_project = prev_bin;

            // Compute a random walk 
            random_possibility = (Math.random()*2*document.xeblaster_settings['terrain_total_range']*
                                    document.xeblaster_settings['terrain_dramatic_factor']);

            // Place this walk into the +/- space depending on our direction-switch probability
            var sf = document.xeblaster_settings['terrain_direction_change_probability'];
            if(prev_slope<0)
                sf = 1.+sf;
            random_possibility -= (document.xeblaster_settings['terrain_total_range']*
                                    document.xeblaster_settings['terrain_dramatic_factor'])*sf;
            
            //random_possibility = ((Math.random()*2*document.xeblaster_settings['terrain_total_range'])-
            //    document.xeblaster_settings['terrain_total_range'])*document.xeblaster_settings['terrain_dramatic_factor'];
            bin_project+=random_possibility;
            //console.log(random_possibility);

            if(bin_project > document.xeblaster_settings['terrain_total_range'] + z_pos){
                bin_project = document.xeblaster_settings['terrain_total_range'] + z_pos;
                last_slope[xindex] = (-1);
                last_values[xindex] = (bin_project);
                geometry.vertices[index].z = bin_project;
                continue;
            }
            else if(bin_project < -1*document.xeblaster_settings['terrain_total_range'] + z_pos){
                bin_project = -1*document.xeblaster_settings['terrain_total_range'] + z_pos;
                last_slope[xindex] = 1;
                last_values[xindex] = bin_project;
                geometry.vertices[index].z = bin_project;
                continue;
            }
            last_slope[xindex]=(bin_project-prev_bin);
            last_values[xindex]=(bin_project);
            
            if(bin_project > document.xeblaster_settings['terrain_display_minimum'])
                geometry.vertices[index].z = bin_project;
            else
                geometry.vertices[index].z = document.xeblaster_settings['terrain_display_minimum'];
        }
    }
    document.xeblaster_items['last_terrain_row'] = last_values;
    document.xeblaster_items['last_terrain_slope'] = last_slope;
    
    // Try with textures
    /*var water = new THREE.TextureLoader().load("/javascript/water.jpg");
    water.wrapS = THREE.RepeatWrapping;
    water.wrapT = THREE.RepeatWrapping;
    water.repeat.set( 5, 5 );
    var grass = new THREE.TextureLoader().load("/javascript/grass.jpg");
    grass.wrapS = THREE.RepeatWrapping;
    grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set( 5, 5);
    var sand = new THREE.TextureLoader().load("/javascript/sand.jpg");
    sand.wrapS = THREE.RepeatWrapping;
    sand.wrapT = THREE.RepeatWrapping;
    sand.repeat.set( 5, 5 );
    var rock = new THREE.TextureLoader().load("/javascript/rock.jpg");
    rock.wrapS = THREE.RepeatWrapping;
    rock.wrapT = THREE.RepeatWrapping;
    rock.repeat.set( 5, 5 );
    var snow = new THREE.TextureLoader().load("/javascript/snow.jpg");
    snow.wrapS = THREE.RepeatWrapping;
    snow.wrapT = THREE.RepeatWrapping;
    snow.repeat.set( 5, 5 );
    var materials = [];
    materials.push(new THREE.MeshBasicMaterial({map : water}));
    materials.push(new THREE.MeshBasicMaterial({map : sand}));
    materials.push(new THREE.MeshBasicMaterial({map : grass}));
    materials.push(new THREE.MeshBasicMaterial({map : rock}));
    materials.push(new THREE.MeshBasicMaterial({map : snow}));
    */
    for(var i=0; i<geometry.faces.length; i+=1){
        var val = geometry.vertices[geometry.faces[i].a].z+
                geometry.vertices[geometry.faces[i].b].z+
                geometry.vertices[geometry.faces[i].c].z;
        val = val/3;
        //var tr = document.xeblaster_settings['terrain_total_range'];
        for(var index in document.xeblaster_settings['terrain_color_map']){
            var c = document.xeblaster_settings['terrain_color_map'][index];
            // var dex = c['geo_index'];
            if(val <= c['val']){
                col = c['col'];
                geometry.faces[i].color.setRGB(col[0], col[1], col[2]);
                geometry.colorsNeedUpdate = true;
                // geometry.faces[i].materialIndex = dex;

                break;
            }
        }
        //geometry.faces[i].color.setRGB(0, (Math.abs(val-z_pos)+tr)/(tr*2),
        //(Math.abs(val-z_pos)+tr)/tr);
    }
    geometry.sortFacesByMaterialIndex();

    //document.xeblaster_items['last_terrain_slope'] = last_slope;
    //document.xeblaster_items['laster_terrain_row'] = last_values;
    
    //for(var index=0;index<length;index++){
    //    geometry.vertices[index].z
    //        = Math.floor((Math.random()*(z_max-z_min))+z_pos);
    //}
    //var tl = new THREE.TextureLoader();
    var material = document.xeblaster_materials['background_phong'];

    //var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, 
    //   wireframe: true, transparent: true } );

    //var wireframe = new THREE.Mesh( geometry, wireframeMaterial );
    var terrain = new THREE.Mesh(geometry, material);//,materials);
    //terrain.add(wireframe);
    //    terrain.overdraw = true;

    //terrain.rotation.x=0;
    //terrain.rotation.z=0;
    terrain.position.x = x - (.25*x);
    terrain.position.y = y;
    //terrain.rotation.setFromVector3 (new THREE.Vector3( 0, 0, Math.PI));

    document.three['scene'].add(terrain);
    document.xeblaster_items['terrain'].push(terrain);

}