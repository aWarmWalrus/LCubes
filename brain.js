var gl;

function start() {
    var canvas = document.getElementById('glCanvas');

    gl = initWebGl(canvas);

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
}
