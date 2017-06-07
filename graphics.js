var gl;
var canvas;

var cubeVerticesBuffer;
var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;

var cubeRotation = 0.0;
var cubeXOffset = 0.0;
var cubeYOffset = 0.0;
var cubeZOffset = 0.0;

var lastCubeUpdateTime = 0;
var rotVal = [0.1, 0.1, 0.0];
var incVal = {x:0.0, y:0.0, z:0.0};

var programStart;

var mvMatrix;
var mv2Matrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

var cubeArray = [];

function start() {

    programStart = (new Date).getTime();

    canvas = document.getElementById('glcanvas');

    initWebGL(canvas);

    if (!gl) {
        return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things;
    gl.depthFunc(gl.LEQUAL);
    // Clear hte color as well as the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initShaders();
    initBuffers();
    setInterval(drawScene, 15);
}

function initWebGL(canvas) {
    gl = null;

    // Try to grab the standard context. IF it fails, fallback to experimental.
    try{
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }
    catch(e) {
    }

    // IF we don't have a GL context, give up now
    if (!gl) {
        alert("unable to initialize WebGl. Your browser may not support it.");
    }
}

function initShaders() {
    var fragmentShader = getShader(gl, 'shader-fs');
    var vertexShader = getShader(gl, 'shader-vs');

    // Create the shader program
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Unable to initialize the shader pgoram: ' + gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPositionAttribute);

	vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
	gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id, type) {
    var shaderScript, theSource, currentChild, shader;

    shaderScript = document.getElementById(id);

    if(!shaderScript) {
        return null;
    }

    theSource = shaderScript.text;

    if (!type) {
        if (shaderScript.type  == 'x-shader/x-fragment') {
            type = gl.FRAGMENT_SHADER;
        } else if (shaderScript.type == 'x-shader/x-vertex') {
            type = gl.VERTEX_SHADER;
        } else {
            // Unknown shader type
            return null;
        }
    }
    shader = gl.createShader(type);

    gl.shaderSource(shader, theSource);

    // Compile the shader program
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

var horizAspect = 480.0/640.0;

function initBuffers() {
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

    var vertices = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0,  -1.0, 1.0,
        1.0,  1.0,  1.0,
        -1.0, 1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var colors = [
		[1.0, 1.0, 1.0, 1.0],      // white
		[1.0, 0.0, 0.0, 0.5],      // red
		[0.0, 1.0, 0.0, 0.5],      // green
		[0.0, 0.0, 1.0, 0.5], 	   // blue
		[1.0, 1.0, 0.0, 0.5], 	   // yellow
		[1.0, 0.0, 1.0, 0.5], 	   // purple
	];

    // convert the array of colors into a table for all the vertices
    var generatedColors = [];

    for (j=0; j<6; j++) {
        var c = colors[j];

        // Repeate each color four times for the four vertices of the face
        for (var i=0; i<4; i++) {
            generatedColors = generatedColors.concat(c);
        }
    }

	cubeVerticesColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);

    cubeVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // front
        4, 5, 6,      4, 6, 7,    // back
        8, 9, 10,     8, 10, 11,  // top
        12, 13, 14,   12, 14, 15, // bottom
        16, 17, 18,   16, 18, 19, // right
        20, 21, 22,   20, 22, 23  // left
    ];

    // Now send the indices to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

    // load identities for both mvMatrices
    mvMatrix = loadIdentity();
    mv2Matrix = loadIdentity();

    // Translate both mvMatrices
    mvMatrix = mvTranslate(mvMatrix, [-2.0, 0.0, -5.0]);
    mv2Matrix = mvTranslate(mv2Matrix, [2.0, 0.0, -5.0]);

	// Save the current matrix, then rotate before we draw.
	mvMatrix = mvPushMatrix(mvMatrix);
	mv2Matrix = mvPushMatrix(mv2Matrix);

    mvMatrix = mvRotate(mvMatrix, cubeRotation, rotVal);
    mv2Matrix = mvRotate(mv2Matrix, cubeRotation, rotVal);

    mvMatrix = mvTranslate(mvMatrix, [cubeXOffset, cubeYOffset, cubeZOffset]);
    mv2Matrix = mvTranslate(mv2Matrix, [cubeXOffset, cubeYOffset, cubeZOffset]);

	// Draw the cube by binding the array buffer to the cube's vertices
    // array, setting atributes, and pushing it to GL

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	// Set the color attribute for the vertex

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	// Draw the cube
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0 ,4);  --  a relic from squares

    // Restore the original matrix

    mv2Matrix = mvPopMatrix();
    mvMatrix = mvPopMatrix();

    // Update the rotation for the next draw, if it's time to do so.

    var currentTime = (new Date).getTime();
    if (lastCubeUpdateTime) {
        var delta = currentTime - lastCubeUpdateTime;
        var timeElapsed = currentTime - programStart;

        cubeRotation += (100 * delta) / 1000.0 + Math.log(timeElapsed / 5000);
        cubeXOffset += incVal["x"] * ((30 * delta) / 1000.0);
        cubeYOffset += incVal["y"] * ((30 * delta) / 1000.0);
        cubeZOffset += incVal["z"] * ((30 * delta) / 1000.0);

        if (Math.abs(cubeYOffset) > 2.5) {
            incVal["y"] = -incVal["y"];
        }
        if (Math.abs(cubeXOffset) > 4.0) {
            incVal["x"] = -incVal["x"];
        }
        if (Math.abs(cubeZOffset) > 5.9) {
            incVal["z"] = -incVal["z"];
        }
    }

    lastCubeUpdateTime = currentTime;

}

//
// Matrix Utility Functions
//

function loadIdentity() {
    return Matrix.I(4);
}

function multMatrix(mv, m) {
	return mv.x(m);
}

function mvTranslate(mv, v) { 
	return multMatrix(mv, Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

	var mv2Uniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mv2Uniform, false, new Float32Array(mv2Matrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
    mvMatrixStack.push(m.dup());
    return m.dup();
    /*
	if (m) {
		mvMatrixStack.push(m.dup());
		mvMatrix = m.dup();
	} else {
		mvMatrixStack.push(mvMatrix.dup());
	}
    */
}

function mvPopMatrix(m) {
	if (!mvMatrixStack.length) {
        throw("Can't pop from an empty matrix stack.");
	}

    return mvMatrixStack.pop();
}

function mvRotate(mv, angle, v) {
    if (!v[0] && !v[1] && !v[2]) {
        return;
    }
    var inRadians = angle * Math.PI / 180.0;

    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    return multMatrix(mv, m);
}


//
// Cube Drawing Functions
// All cubes have 0 rotation.
// Specify color and position.
//


function addCube() {
    // convert the array of colors into a table for all the vertices
    var generatedColors = [];

    for (j=0; j<6; j++) {
        var c = colors[j];

        // Repeate each color four times for the four vertices of the face
        for (var i=0; i<4; i++) {
            generatedColors = generatedColors.concat(c);
        }
    }
}
