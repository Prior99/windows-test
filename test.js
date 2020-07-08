const { createCanvas, createImageData } = require("canvas");
const { writeFileSync } = require("fs");
const { createWebGLRenderingContext } = require("node-gles");

const width = 320;
const height = 240;

function createGl() {
    const alpha = true;
    const gl = createWebGLRenderingContext();
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, alpha ? gl.RGBA8 : gl.RGB8, width, height);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer);
    return gl;
}

function createGlCanvas(gl) {
    const pixels = new Uint8Array(width * height * 4);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const data = createImageData(new Uint8ClampedArray(pixels), width, height);
    ctx.putImageData(data, 0, 0);

    return canvas;
}

function writePng(canvas) {
    const buffer = canvas.toBuffer("image/png");
    writeFileSync("test.png", buffer);
}


const gl = createGl();
const canvas = createGlCanvas(gl);

const fragmentShader = `
    precision mediump float;

    varying vec2 textureCoords;

    void main() {
        gl_FragColor = vec4(1, 1, 0, 0);
    }
`;

const vertexShader = `
    precision lowp float;

    attribute vec2 vertexPosition;

    varying vec2 textureCoords;

    void main() {
        textureCoords = vertexPosition;
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`;

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Unable to create new shader.");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        console.error(log);
        logger.error(log);
        gl.deleteShader(shader);
        throw new Error("Unable to compile shader.");
    }
    return shader;
}

gl.disable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.viewport(0, 0, width, height);
gl.clearColor(255, 255, 0, 255);
gl.clear(gl.COLOR_BUFFER_BIT);

const program = gl.createProgram();
if (!program) {
    throw new Error("Unable to create shader program.");
}
gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexShader));
gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
gl.linkProgram(program);
const vertexPosition = gl.getAttribLocation(program, "vertexPosition")

// const vbo = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, -1, -1, 1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
// gl.useProgram(program);
// gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
// gl.enableVertexAttribArray(vertexPosition);
// gl.drawArrays(gl.TRIANGLES, 0, 6);

writePng(canvas);
