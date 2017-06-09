var graphics = (function() {
    var container, stats;
    var camera, scene, renderer, controls, raycaster, mouse;
    var plane;
    var gQueue = [];
    var cubes = [];
    var targetRotation = 0;
    var targetRotationOnMouseDown = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    // User-interface variables
    var opDelay = 100;

    // Synchronicity
    var pQueueWaiting = 1;

    // Postprocessing
    var composer, outlinePass1, outlinePass2;
    var moved;

    // Constants
    var CUBE_LENGTH = 70;
    var GAP_WIDTH = 3;
    var INTERSECTED;

    init();
    animate();

    var LOGGING = false;

    function cLog (msg) {
        if (LOGGING) { console.log(msg); }
    }

    function init() {
        container = document.getElementById('container');

        // Camera
        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.y = 450;
        camera.position.z = 600;

        scene = new THREE.Scene();

        // Raycaster
        raycaster = new THREE.Raycaster();

        // Mouse
        mouse = new THREE.Vector2();

        // Plane 
        var geometry = new THREE.PlaneBufferGeometry( 1500, 1500 );
        geometry.rotateX( - Math.PI / 2 );
        geometry.translate(0, -175, 0);
        //var material = new THREE.MeshPhongMaterial( { color: 0xe0e0e0, overdraw: 0.5 } );
        var material = new THREE.ShadowMaterial();
        material.opacity = 0.5;
        plane = new THREE.Mesh( geometry, material );
        plane.receiveShadow = true;
        scene.add( plane );

        // Light
        // Ambient 
        var ambientLight = new THREE.AmbientLight( 0xf0f0f0, 0.7);
        scene.add( ambientLight );

        // Spotlight, to cast a shadow
        var light = new THREE.SpotLight( 0xf0f0f0, 0.5 );
        light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 200, 10000 ) );
        light.position.set(400, 1200, 400);
        light.castShadow = true;
        scene.add( light );

        // Directed Light
        var dirLight = new THREE.DirectionalLight( 0xffffff, 0.5);
        dirLight.position.set(-1, 1, 1);
        dirLight.position.normalize();
        scene.add(dirLight);

        // Renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor( 0x202020 );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.maxPolarAngle = Math.PI / 2.1;

        container.appendChild( renderer.domElement );
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        window.addEventListener( 'resize', onWindowResize, false );
        window.addEventListener( 'mousedown', function() {
            moved = false;
        }, false );
        window.addEventListener( 'mouseup', function() {
            if (!moved) selectCube();
        });

        controls.addEventListener( 'change', function() {
            moved = true;
        });


        // Post Processing
        composer = new THREE.EffectComposer( renderer );

        var renderPass = new THREE.RenderPass( scene, camera );
        composer.addPass( renderPass );

        outlinePass1 = new THREE.OutlinePass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                scene, camera);
        outlinePass1.edgeStrength = 5.0;
        outlinePass1.edgeThickness = 0.2;
        outlinePass1.visibleEdgeColor = new THREE.Color(1, 0.2, 0.2, 1);
        composer.addPass( outlinePass1 );

        outlinePass2 = new THREE.OutlinePass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                scene, camera);
        outlinePass2.edgeStrength = 1.0;
        outlinePass2.edgeThickness = 0.2;
        outlinePass2.visibleEdgeColor = new THREE.Color(1, 1, 1, 0.5);
        composer.addPass( outlinePass2 );

        var shaderPass = new THREE.ShaderPass( THREE.CopyShader );
        shaderPass.renderToScreen = true;
        composer.addPass( shaderPass );

    }

    function onDocumentMouseMove( event ) {
        
        event.preventDefault();

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        //console.log( "mouse x:", mouse.x, "y:", mouse.y);
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }


    //
    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function isPhongMaterial(obj) {
        return ((obj !== undefined) && (obj.object !== undefined) && (obj.object.material !== undefined) && (obj.object.material.emissive !== undefined));
    }

    function handleRayIntersect() {
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children );

        intersects = intersects.filter(isPhongMaterial);

        if ( intersects.length > 0 ) {
            if ( INTERSECTED != intersects[0].object ) {
                // Reset the previously intersected object's color
                if ( INTERSECTED ) { INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex); }

                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex( 0x800000, 0.2 );
            }
        } else { 
            // Reset the previously intersected object's color
            if ( INTERSECTED ) { INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex); }
            INTERSECTED = null;
        }
    }

    function selectCube() {
        if ( INTERSECTED ) {
            outlinePass1.selectedObjects = [INTERSECTED];
            for (var i = 0; i<cubes.length; i++) {
                if (cubes[i] == INTERSECTED) break;
            }
            var prev = (i - 1 + cubes.length) % cubes.length;
            var next = (i + 1) % cubes.length;
            outlinePass2.selectedObjects = [cubes[prev], cubes[next]];
        } else {
            outlinePass1.selectedObjects = [];
            outlinePass2.selectedObjects = [];
        }
    }

    function render() {

        handleRayIntersect();

        composer.render();
        //renderer.render( scene, camera );
    }

    //
    // --------- Cube Graphics Methods
    //
    function addCube(pos, color) {
        var width = CUBE_LENGTH - GAP_WIDTH;
        var geometry = new THREE.BoxGeometry( width, width, width );
        //cLog(geometry.faces.length);
        for ( var i = 0; i < geometry.faces.length; i += 2 ) {
            geometry.faces[ i ].color.setHex( color );
            geometry.faces[ i + 1 ].color.setHex( color );
        }
        var material = new THREE.MeshPhongMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.x = pos.x;
        cube.position.y = pos.y;
        cube.position.z = pos.z;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add( cube );
        cubes.push( cube );    
    }
    
    function removeCube() {
        var cube = cubes.pop();    
        scene.remove( cube );
        //cLog( cubes );
    }

    function processQueue() {
        cLog("processing, queue length: " + gQueue.length);

        if (gQueue.length == 0) { 
            pQueueWaiting = 1;
            return 
        };
        var nextOp = gQueue.shift();

        if (nextOp.op == "pop") {
            cLog(" -> popping");
            removeCube();
        } else if (nextOp.op == "push") {
            var v = {
                x: nextOp.pos.x / CUBE_LENGTH,
                y: (nextOp.pos.y - (CUBE_LENGTH / 2)) / CUBE_LENGTH,
                z: nextOp.pos.z / CUBE_LENGTH
            };
            cLog(" -> pushing at: (" + v.x + ", " + v.y + ", " + v.z + ") " + nextOp.col);
            addCube(nextOp.pos, nextOp.col);   
        }

        setTimeout(processQueue, opDelay);
    }

    return {
        addCube: addCube,

        removeCube: removeCube,

        pushCube: function(position, color) {
            var tPos = {
                x: position.x * CUBE_LENGTH,
                y: position.y * CUBE_LENGTH,
                z: position.z * CUBE_LENGTH
            };

            gQueue.push({op: "push", pos: tPos, col: color});
            if (pQueueWaiting) {
                pQueueWaiting = 0;
                processQueue();
            }
        },

        popCube: function() {
            gQueue.push({op: "pop"});
            if (pQueueWaiting) {
                pQueueWaiting = 0;
                processQueue();
            }
        },

        setDelay: function(d) {
            opDelay = d;
        }
    };
})();
