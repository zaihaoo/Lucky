import "../lib/cuon-utils";
import "../lib/cuon-matrix";
import "../lib/webgl-debug";
import "../lib/webgl-utils";
import { vertex, uv } from './createModel';


const models = ["src/shader/cube.vs", "src/shader/cube.fs"];
Promise.all(models.map(url =>
	fetch(url).then(resp => resp.text())
)).then(async shader => {

	const canvas = document.getElementById("canvas") as HTMLElement;
	const gl = getWebGLContext(canvas, {});
	let ext = gl.getExtension("OES_standard_derivatives"); 
    if (!ext) { 
        alert("this machine or browser does not support OES_standard_derivatives"); 
    } 

	// if (!initShaders(gl, shader[0], shader[1])) {
	// 	console.log("Error to init shader");
	// 	return -1;
	// }

	const selectionShader = createProgram(gl, shader[0], shader[1]);
	gl.useProgram(selectionShader);
	gl.program = selectionShader;

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	const model_matrix = new Matrix4([]);
	const view_matrix = new Matrix4([]);
	const perspective_matrix = new Matrix4([]);


	let ver32 = new Float32Array(vertex);
	let uv32 = new Float32Array(uv);
	const a_position = gl.getAttribLocation(gl.program, "a_position");
	const a_uv = gl.getAttribLocation(gl.program, "uv");
	const u_model = gl.getUniformLocation(gl.program, "u_model");
	const u_view = gl.getUniformLocation(gl.program, "u_view");
	const u_perspective = gl.getUniformLocation(gl.program, "u_perspective");
	const u_sampler = gl.getUniformLocation(gl.program, "texture");
	const u_hatch0_sampler = gl.getUniformLocation(gl.program, "hatch0");
	const u_hatch1_sampler = gl.getUniformLocation(gl.program, "hatch1");
	const u_hatch2_sampler = gl.getUniformLocation(gl.program, "hatch2");
	const u_size = gl.getUniformLocation(gl.program, "u_size");

	const vertex_buffer = gl.createBuffer();
	const uv_buffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, ver32, gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
	// gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, fsize * 6, fsize * 3);
	gl.enableVertexAttribArray(a_position);
	// gl.enableVertexAttribArray(a_color);

	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);



	gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, uv32, gl.STATIC_DRAW);

	gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 0, 0);
	// gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, fsize * 6, fsize * 3);
	gl.enableVertexAttribArray(a_uv);



	let eyeX = 0.0, eyeY = 0.0, eyeZ = 16.0;
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

	perspective_matrix.setPerspective(45, canvas.clientWidth / canvas.clientHeight, 1, 30);

	gl.uniformMatrix4fv(u_perspective, false, perspective_matrix.elements);


	let finish = 0;
	let target = 4;
	let _loadShading = () => {
		let image = new Image();
		image.onload = function () {
			let tex = _createTexture(gl.TEXTURE0, image);
			gl.uniform1i(u_sampler, 0);
			finish++;
		}
		image.src = "../model/room_baked.png";
	}
	let _loadHatch0 = () => {
		let image = new Image();
		image.onload = function () {
			let tex = _createTexture(gl.TEXTURE1, image);
			gl.uniform1i(u_hatch0_sampler, 1);
			finish++;
		}
		image.src = "../model/hatch_0.jpg";
	}
	let _loadHatch1 = () => {
		let image = new Image();
		image.onload = function () {
			let tex = _createTexture(gl.TEXTURE2, image);
			gl.uniform1i(u_hatch1_sampler, 2);
			finish++;
		}
		image.src = "../model/hatch_1.jpg";
	}
	let _loadHatch2 = () => {
		let image = new Image();
		image.onload = function () {
			let tex = _createTexture(gl.TEXTURE3, image);
			gl.uniform1i(u_hatch2_sampler, 3);
			finish++;
		}
		image.src = "../model/hatch_2.jpg";
	}

	function _createTexture(textureNo: GLint, image: HTMLImageElement | null) {

		gl.activeTexture(textureNo);
		let selectionMask = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, selectionMask);
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

		return selectionMask;
	}

	const maskFB = gl.createFramebuffer();
	const selectionMask = _createTexture(gl.TEXTURE4, null);
	_loadShading(); _loadHatch0(); _loadHatch1(); _loadHatch2();
	requestAnimationFrame(render);

	function render(nowMSec: any) {
		if (finish == target) {
			// gl.bindFramebuffer(gl.FRAMEBUFFER, maskFB);
			// gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, selectionMask, 0);

			gl.useProgram(selectionShader);
			gl.program = selectionShader;
			// model_matrix.setTranslate(0, 0, 0);
			// model_matrix.rotate(30, 0.0, 1.0, 1.0);
			view_matrix.setLookAt(eyeX, eyeY, eyeZ, -5.0, 7.0, 0.0, 0.0, 1.0, 0.0);

			gl.uniformMatrix4fv(u_view, false, view_matrix.elements);

			gl.uniformMatrix4fv(u_model, false, model_matrix.elements);
			gl.uniform2fv(u_size, [gl.drawingBufferWidth, gl.drawingBufferHeight]);

			// gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, vertex.length / 3);
			// gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);



		}
		requestAnimationFrame(render);
	}
});






