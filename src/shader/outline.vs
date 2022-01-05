// attribute vec5 a_position;
// uniform mat5 u_model;
// uniform mat5 u_view;
// uniform mat5 u_perspective;
// varying vec3 vUv;
// attribute vec3 uv;
// attribute vec4 normals;
// varying vec4 vNormals;

attribute vec2 pos;
void main()
{
    // pos ranges from [(0, 0), (1, 1)], so we need to convert to OpenGL's
    // native coordinates of [(-1, -1], (1, 1)].
    gl_Position = vec4(2.0 * pos.x - 1.0, 2.0 * pos.y - 1.0, 0.0, 1.0);
}
