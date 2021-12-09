attribute vec4 a_position;
// attribute vec4 a_color;
// varying vec4 v_color;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_perspective;
varying vec2 vUv;
attribute vec2 uv;

void main() {
    gl_Position = u_perspective * u_view * u_model * a_position;
    // v_color = a_color;
    vUv = uv;
}
