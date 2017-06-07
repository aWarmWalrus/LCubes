var graphics = (function() {
    var container, stats;
    var camera, scene, renderer, controls;
    var plane;
    var cubes = [];
    var targetRotation = 0;
    var targetRotationOnMouseDown = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();


    function init() {
        container = document.getElementById('container');
        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.y = 150;
        camera.position.z = 500;

        scene = new THREE.Scene();

        // Plane 
        var geometry = new THREE.PlaneBufferGeometry( 800, 800 );
        geometry.rotateX( - Math.PI / 2 );
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
        renderer.setClearColor( 0xf0f0f0, 1.0 );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.maxPolarAngle = Math.PI / 2.1;

        container.appendChild( renderer.domElement );
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );
        window.addEventListener( 'resize', onWindowResize, false );
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function onDocumentMouseDown( event ) {
        event.preventDefault();
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        document.addEventListener( 'mouseup', onDocumentMouseUp, false );
        document.addEventListener( 'mouseout', onDocumentMouseOut, false );
        //mouseXOnMouseDown = event.clientX - windowHalfX;
        mouseYOnMouseDown = event.clientY - windowHalfY;
        targetRotationOnMouseDown = targetRotation;
    }

    function onDocumentMouseMove( event ) {
        //mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        //targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
        targetRotation = targetRotationOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.02;
    }

    function onDocumentMouseUp( event ) {
        document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
        document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
    }

    function onDocumentMouseOut( event ) {
        document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
        document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
    }

    function onDocumentTouchStart( event ) {
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
            targetRotationOnMouseDown = targetRotation;
        }
    }

    function onDocumentTouchMove( event ) {
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            mouseX = event.touches[ 0 ].pageX - windowHalfX;
            targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
        }
    }

    //
    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function render() {
        renderer.render( scene, camera );
    }

    return {
        addCube: function(pos, color) {
            var geometry = new THREE.BoxGeometry( 67, 67, 67 );
            //console.log(geometry.faces.length);
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
            console.log(cubes);
        },

        popCube: function(){
            var cube = cubes.pop();    
            scene.remove( cube );
            console.log(cubes);
        },

        queueAdd: function(pos, color) {
        }
    };
})();
