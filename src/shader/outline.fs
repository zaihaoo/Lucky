#extension GL_OES_standard_derivatives : enable
precision highp float;
// varying vec2 vUv;
// uniform sampler2D texture;
// uniform sampler2D hatch0;
// uniform sampler2D hatch1;
// uniform sampler2D hatch2;
uniform vec2 u_size;
// varying vec3 vNormals;


uniform sampler2D texture;

// float shade(const in float shading, const in vec2 uv) {
//   float shadingFactor;
//   float stepSize = 1.0 / 3.0;

//   float alpha = 0.0;
//   float scaleWhite = 0.0;
//   float scaleHatch0 = 0.0;
//   float scaleHatch1 = 0.0;
//   float scaleHatch2 = 0.0;

//   if (shading <= stepSize) {
//     alpha = 3.0 * shading;
//     scaleHatch1 = alpha;
//     scaleHatch2 = 1.0 - alpha;
//   }
//   else if (shading > stepSize && shading <= 2.0 * stepSize) {
//     alpha = 3.0 * (shading - stepSize);
//     scaleHatch0 = alpha;
//     scaleHatch1 = 1.0 - alpha;
//   }
//   else if (shading > 2.0 * stepSize) {
//     alpha = 3.0 * (shading - stepSize * 2.0);
//     scaleWhite = alpha;
//     scaleHatch0 = 1.0 - alpha;
//   }

//   shadingFactor = scaleWhite + 
//     scaleHatch0 * texture2D(hatch0, uv).r +
//     scaleHatch1 * texture2D(hatch1, uv).r +
//     scaleHatch2 * texture2D(hatch2, uv).r;

//   return shadingFactor;
// }

void main() {

    // 生成素描线
    // vec2 uv = vUv * 15.0;
    // vec2 uv2 = vUv.yx * 10.0;
    // float shading = texture2D(texture, vUv).r + .1;
    // float crossedShading = shade(shading, uv) * shade(shading, uv2) * 0.6 + 0.4;
    // gl_FragColor = vec4(vec3(crossedShading), 1.0);





    



    // gl_FragColor = texture2D(texture, gl_FragCoord.xy/u_size);

    // 生成轮廓的深度贴图
    // gl_FragColor = vec4(vec3((gl_FragCoord.z / gl_FragCoord.w)* .02),1.0);

    vec2 screen_coord = gl_FragCoord.xy;
    vec4 current_normal = texture2D(texture,screen_coord/u_size);
    vec4 top_normal = texture2D(texture,vec2(screen_coord.x,screen_coord.y+1.)/u_size);
    vec4 down_normal = texture2D(texture,vec2(screen_coord.x,screen_coord.y-1.)/u_size);
    vec4 left_normal = texture2D(texture,vec2(screen_coord.x-1.,screen_coord.y)/u_size);
    vec4 right_normal = texture2D(texture,vec2(screen_coord.x+1.,screen_coord.y)/u_size);

    float top_theta = dot(current_normal,top_normal)/(length(current_normal)*length(top_normal));
    float down_theta = dot(current_normal,down_normal)/(length(current_normal)*length(down_normal));
    float left_theta = dot(current_normal,left_normal)/(length(current_normal)*length(left_normal));
    float right_theta = dot(current_normal,right_normal)/(length(current_normal)*length(right_normal));

    if (top_theta < 0.96 || down_theta < 0.96 || left_theta < 0.96 || right_theta < 0.96){
      gl_FragColor = vec4(0.,0.,0.,1.0);
    }
    else {
      discard;
    }
}