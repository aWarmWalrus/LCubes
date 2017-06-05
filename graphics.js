var gl;
var canvas;
var perspectiveMatrix;

function start() {
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
    squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    var vertices = [
        1.0,  1.0,  0.0,
        -1.0, 1.0,  0.0,
        1.0,  -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var colors = [
		1.0, 1.0, 1.0, 1.0,      // white
		1.0, 0.0, 0.0, 0.5,      // red
		0.0, 1.0, 0.0, 0.5,	     // blue
		0.0, 0.0, 1.0, 0.5, 	 // green
	];

	squareVerticesColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

    loadIdentity();
    mvTranslate([-0.0, 0.0, -6.0]);

	// Draw the square by binding the array buffer to the square's vertices
    // array, setting atributes, and pushing it to GL

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	// Set the color attribute for the vertex

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	// Draw the Square

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0 ,4);
}

// Matrix Utility Functions
//

function loadIdentity() {
    mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
	mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) { 
	multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
