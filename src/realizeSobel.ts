import "../lib/cuon-utils";
import "../lib/cuon-matrix";
import "../lib/webgl-debug";
import "../lib/webgl-utils";
import { vertex, uv, normals } from './createModel';


const models = ["src/shader/cube.vs", "src/shader/cube.fs", "src/shader/outline.vs", "src/shader/outline.fs"];
Promise.all(models.map(url =>
	fetch(url).then(resp => resp.text())
)).then(async shader => {

	const canvas = document.getElementById("canvas") as HTMLElement;
	const gl = getWebGLContext(canvas, {});
	let ext = gl.getExtension("OES_standard_derivatives"); 
    if (!ext) { 
        alert("this machine or browser does not support OES_standard_derivatives"); 
    } 
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// 创建normalShader着色器
	const normalShader = createProgram(gl, shader[0], shader[1]);
	normalShader.a_position = gl.getAttribLocation(normalShader, "a_position");
	normalShader.a_uv = gl.getAttribLocation(normalShader, "uv");
	normalShader.a_normals = gl.getAttribLocation(normalShader, "normals");
	normalShader.u_model = gl.getUniformLocation(normalShader, "u_model");
	normalShader.u_view = gl.getUniformLocation(normalShader, "u_view");
	normalShader.u_perspective = gl.getUniformLocation(normalShader, "u_perspective");
	normalShader.u_sampler = gl.getUniformLocation(normalShader, "texture");
	normalShader.u_hatch0_sampler = gl.getUniformLocation(normalShader, "hatch0");
	normalShader.u_hatch1_sampler = gl.getUniformLocation(normalShader, "hatch1");
	normalShader.u_hatch2_sampler = gl.getUniformLocation(normalShader, "hatch2");
	normalShader.u_size = gl.getUniformLocation(normalShader, "u_size");


	// 创建outlineShader着色器
	const outlineShader = createProgram(gl, shader[2], shader[3]);
	outlineShader.outline_a_pos = gl.getAttribLocation(outlineShader, "pos");
	outlineShader.outline_normal_sampler = gl.getUniformLocation(outlineShader, "texture");
	outlineShader.outline_u_size = gl.getUniformLocation(outlineShader, "u_size");


	// 初始化VAO
	const _initVAOBuffer = (data:Float32Array) => {
		let buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		return buffer;
	}
	let ver32 = new Float32Array(vertex);
	let uv32 = new Float32Array(uv);
	let normals32 = new Float32Array(normals);
	const vertex_buffer = _initVAOBuffer(ver32);
	const uv_buffer = _initVAOBuffer(uv32);
	const normals_buffer = _initVAOBuffer(normals32);
	let cubeVertex32 = new Float32Array([ 0, 0,   1, 0,   1, 1, 1, 1,   0, 1,   0, 0 ]);
	const cube_vertex_buffer = _initVAOBuffer(cubeVertex32);


	// 准备PVM变换矩阵
	let eyeX = -7.0, eyeY = 9.0, eyeZ = 16.0;
	const model_matrix = new Matrix4([]);
	const view_matrix = new Matrix4([]);
	const perspective_matrix = new Matrix4([]);
	view_matrix.setLookAt(eyeX, eyeY, eyeZ, -5.0, 7.0, 0.0, 0.0, 1.0, 0.0);
	perspective_matrix.setPerspective(45, gl.drawingBufferWidth/gl.drawingBufferHeight, 0.1, 30);






	document.addEventListener("keydown", function (e) {
		switch (e.key) {
			case "ArrowLeft":
				eyeX -= 0.1;
				break;
			case "ArrowRight":
				eyeX += 0.1;
				break;
			case "ArrowUp":
				eyeY += 0.1;
				break;
			case "ArrowDown":
				eyeY -= 0.1;
				break;
		}
	})



	let finish = 0;
	let target = 4;
	let _loadShading = () => {
		let image = new Image();
		image.onload = function () {
			gl.useProgram(normalShader);
			let tex = _createTexture(gl.TEXTURE0, image);
			gl.uniform1i(normalShader.u_sampler, 0);
			finish++;
		}
		image.src = "../model/room_baked.png";
	}
	let _loadHatch0 = () => {
		let image = new Image();
		image.onload = function () {
			gl.useProgram(normalShader);
			let tex = _createTexture(gl.TEXTURE1, image);
			gl.uniform1i(normalShader.u_hatch0_sampler, 1);
			finish++;
		}
		image.src = "../model/hatch_0.jpg";
	}
	let _loadHatch1 = () => {
		let image = new Image();
		image.onload = function () {
			gl.useProgram(normalShader);
			let tex = _createTexture(gl.TEXTURE2, image);
			gl.uniform1i(normalShader.u_hatch1_sampler, 2);
			finish++;
		}
		image.src = "../model/hatch_1.jpg";
	}
	let _loadHatch2 = () => {
		let image = new Image();
		image.onload = function () {
			gl.useProgram(normalShader);
			let tex = _createTexture(gl.TEXTURE3, image);
			gl.uniform1i(normalShader.u_hatch2_sampler, 3);
			finish++;
		}
		image.src = "../model/hatch_2.jpg";
	}

	function _createTexture(textureNo: GLint, image: HTMLImageElement | null) {

		gl.activeTexture(textureNo);
		let mask = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, mask);
		if (image != null)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		else
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);


		//对纹理图像进行y轴反转
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		if (image == null) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}

		// gl.bindTexture(gl.TEXTURE_2D, null); // unbind the texture

		return mask;
	}

	const maskFB = gl.createFramebuffer();
	const renderBuffer = gl.createRenderbuffer();

	//绑定帧缓冲区
	gl.bindFramebuffer(gl.FRAMEBUFFER, maskFB);
	//绑定渲染缓冲区
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
	//初始化渲染缓冲区，这里只指定了模板缓冲区，没有指定深度缓冲区
	//如果需要深度缓冲区，第二参数可改为 DEPTH_STENCIL,同时 framebufferRenderbuffer 的第二个参数为 DEPTH_STENCIL_ATTACHMENT
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER,renderBuffer);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);


	const normalMask = _createTexture(gl.TEXTURE4, null);
	const outlineMask = _createTexture(gl.TEXTURE4, null);



	_loadShading(); _loadHatch0(); _loadHatch1(); _loadHatch2();
	requestAnimationFrame(render);

	function render(nowMSec: any) {
		if (finish == target) {
			view_matrix.setLookAt(eyeX, eyeY, eyeZ, -5.0, 7.0, 0.0, 0.0, 1.0, 0.0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, maskFB);
			gl.useProgram(normalShader);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, normalMask, 0);

			// VAO、VBO赋值
			gl.uniformMatrix4fv(normalShader.u_perspective, false, perspective_matrix.elements);
			gl.uniformMatrix4fv(normalShader.u_view, false, view_matrix.elements);
			gl.uniformMatrix4fv(normalShader.u_model, false, model_matrix.elements);
			gl.uniform2fv(normalShader.u_size, [gl.drawingBufferWidth, gl.drawingBufferHeight]);
			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			gl.vertexAttribPointer(normalShader.a_position, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(normalShader.a_position);
			gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
			gl.vertexAttribPointer(normalShader.a_uv, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(normalShader.a_uv);
			gl.bindBuffer(gl.ARRAY_BUFFER, normals_buffer);
			gl.vertexAttribPointer(normalShader.a_normals, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(normalShader.a_normals);

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, ver32.length / 3);
			gl.disableVertexAttribArray(normalShader.a_position);
			gl.disableVertexAttribArray(normalShader.a_uv);
			gl.disableVertexAttribArray(normalShader.a_normals);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);


			gl.useProgram(outlineShader);
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, normalMask);
			// gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outlineMask, 0);

			// VAO、VBO赋值
			gl.uniform2fv(outlineShader.outline_u_size, [gl.drawingBufferWidth, gl.drawingBufferHeight]);
			gl.uniform1i(outlineShader.outline_normal_sampler, 4);
			gl.bindBuffer(gl.ARRAY_BUFFER, cube_vertex_buffer);
			gl.vertexAttribPointer(outlineShader.outline_a_pos, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(outlineShader.outline_a_pos);

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, cubeVertex32.length / 2);
			gl.disableVertexAttribArray(outlineShader.outline_a_pos);
			gl.bindTexture(gl.TEXTURE_2D,null);



		}
		requestAnimationFrame(render);
	}
});






