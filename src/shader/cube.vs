attribute vec4 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_perspective;
varying vec2 vUv;
attribute vec2 uv;
attribute vec3 normals;
varying vec3 vNormals;

void main() {
    gl_Position = u_perspective * u_view * u_model * a_position;
    vUv = uv;
    vNormals = normals;
}
