const { createCanvas, createImageData } = require("canvas");
const { encode } = require("node-libpng");
const { writeFileSync } = require("fs");
const { createWebGLRenderingContext } = require("node-gles-prebuilt");

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

function writeCanvasPng(canvas) {
    const buffer = canvas.toBuffer("image/png");
    writeFileSync("canvas.png", buffer);
}

function writeGlPng(gl) {
    const pixels = new Uint32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_INT, pixels);
    const raw = Buffer.from(pixels);
    writeFileSync("gl.png", encode(raw, { width, height }));
}


const gl = createGl();
const canvas = createGlCanvas(gl);

const fragmentShader = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

const vertexShader = `
    precision lowp float;

    attribute vec2 vertexPosition;

    void main() {
        gl_Position = vec4(vertexPosition, 0.0, 0.0);
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
        gl.deleteShader(shader);
        throw new Error("Unable to compile shader.");
    }
    return shader;
}

gl.disable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.viewport(0, 0, 320, 240);
gl.clearColor(0, 0, 0, 255);
gl.clear(gl.COLOR_BUFFER_BIT);

const program = gl.createProgram();
if (!program) {
    throw new Error("Unable to create shader program.");
}
gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexShader));
gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
gl.linkProgram(program);
gl.useProgram(program);
const vertexPosition = gl.getAttribLocation(program, "vertexPosition")

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, -1, -1, 1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(vertexPosition);
gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLES, 0, 6);

writeGlPng(gl);
