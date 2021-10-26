#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform sampler2D texture;
uniform vec2 pixelSize;
uniform vec4 color;
varying vec2 texCoord;
uniform float u_size;


void main()
{
    // one line code outline
    // gl_FragColor = vec4(vec3(1.0 - pow(fwidth(texture2D(texture, p / vec2(799.5,799.5)))*15.0, vec4(2)).rgb), 1.0);
    gl_FragColor = vec4(vec3(pow(fwidth(texture2D(texture,gl_FragCoord.xy/799.5))*8.5,vec4 (2.0)).rgb),1.0);
}