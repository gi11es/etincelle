/**
 * Minimal WebGL helper: draws one full-screen fragment shader on a canvas.
 * The shader receives u_res (device pixels), u_time (seconds) and u_dpr.
 * Other uniforms are set with set(name, type, value), e.g. set('u_k', '1f', 2).
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export class ShaderCanvas {
  constructor(canvas, fragSource) {
    this.canvas = canvas;
    this.uniforms = {};
    this.locations = {};
    this.onFrame = null;
    this.raf = 0;
    this.start0 = performance.now();
    const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false });
    this.ok = !!gl;
    if (!gl) return;
    this.gl = gl;
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, 'precision highp float;\n' + fragSource]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('Shader compile failed:', gl.getShaderInfoLog(sh));
        this.ok = false;
        return;
      }
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Shader link failed:', gl.getProgramInfoLog(prog));
      this.ok = false;
      return;
    }
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  get dpr() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  set(name, type, value) {
    this.uniforms[name] = { type, value };
  }

  start() {
    if (!this.ok) return;
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.draw();
    };
    loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  draw() {
    const { gl, canvas } = this;
    const dpr = this.dpr;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const t = (performance.now() - this.start0) / 1000;
    if (this.onFrame) this.onFrame(t);
    gl.viewport(0, 0, w, h);
    this.set('u_res', '2f', [w, h]);
    this.set('u_time', '1f', t);
    this.set('u_dpr', '1f', dpr);
    for (const [name, { type, value }] of Object.entries(this.uniforms)) {
      if (!(name in this.locations)) this.locations[name] = gl.getUniformLocation(this.prog, name);
      const loc = this.locations[name];
      if (!loc) continue;
      if (type === '1f') gl.uniform1f(loc, value);
      else if (type === '2f') gl.uniform2f(loc, value[0], value[1]);
      else if (type === '3f') gl.uniform3f(loc, value[0], value[1], value[2]);
      else if (type === '4f') gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
      else if (type === '2fv') gl.uniform2fv(loc, value);
      else if (type === '3fv') gl.uniform3fv(loc, value);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
