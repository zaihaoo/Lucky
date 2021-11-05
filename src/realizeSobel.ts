import "../lib/cuon-utils";
import "../lib/cuon-matrix";
import "../lib/webgl-debug";
import "../lib/webgl-utils";
import { GltfAsset, GltfLoader } from 'gltf-loader-ts';
import { GlTf, Image, Material, MaterialPbrMetallicRoughness, Mesh, Scene, Texture, TextureInfo } from "gltf-loader-ts/lib/gltf";


const models = ["src/shader/cube.vs", "src/shader/cube.fs"];
Promise.all(models.map(url =>
    fetch(url).then(resp => resp.text())
)).then(async shader => {
let loader = new GltfLoader();
let uri = '../model/居家工作办公环境.gltf';
let asset: GltfAsset = await loader.load(uri);
let gltf: GlTf = asset.gltf;
console.log(gltf);

	let sceneIndex = gltf.scene?gltf.scene:0;
        let scene = (gltf.scenes as Scene[])[sceneIndex];
        let rootNodes = scene.nodes;
        for (let nodeIndex of rootNodes as number[]) {
            // get to the first primitive
            let node = (gltf.nodes as Node[])[nodeIndex];
			console.log(node)
            let child = (node as any).mesh;
            let mesh = (gltf.meshes as Mesh[])[child];
            let primitive = mesh.primitives[0];

            // get the vertex data for the primitive
            let positionAccessorIndex = primitive.attributes.POSITION;

            //
            // Get the binary data, which might be in a .bin file that still has to be loaded,
            // in another part of the source GLB file, or embedded as a data URI.
            //
            let data = await asset.accessorData(positionAccessorIndex);
            console.log("Accessor containing positions: ", data);
            // For rendering, `data` can be bound via `gl.BindBuffer`,
            // and the accessor properties can be used with `gl.VertexAttribPointer`

            // parse the material to get to the first texture
            let material = (gltf.materials as Material[])[primitive.material as number];
			console.log(((material.pbrMetallicRoughness as MaterialPbrMetallicRoughness)))
            let baseColorTexture = (gltf.textures as Texture[])[((material.pbrMetallicRoughness as MaterialPbrMetallicRoughness).baseColorTexture as TextureInfo).index];
            let imageIndex = baseColorTexture.source;

            //
            // Get image data which might also be in a separate file, in a GLB file,
            // or embedded as a data URI.
            //
            let image = await asset.imageData.get(imageIndex as number);
            document.body.appendChild(image);
            // For rendering, use `gl.texImage2D` with the image
        }

    	const canvas = document.getElementById("canvas") as HTMLElement;
		const gl = getWebGLContext(canvas,{});

		if (!initShaders(gl, shader[0], shader[1])) {
			console.log("Error to init shader");
			return -1;
		}

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);

		const model_matrix = new Matrix4([]);
		const view_matrix = new Matrix4([]);
		const perspective_matrix = new Matrix4([]);

		let vertices = new Float32Array([
			 1.0,  1.0,  1.0, 1.0, 1.0, 1.0,
			-1.0,  1.0,  1.0, 1.0, 0.0, 1.0,
			-1.0, -1.0,  1.0, 1.0, 0.0, 0.0,
			 1.0, -1.0,  1.0, 1.0, 1.0, 0.0,
			 1.0, -1.0, -1.0, 0.0, 1.0, 0.0,
			 1.0,  1.0, -1.0, 0.0, 1.0, 1.0,
			-1.0,  1.0, -1.0, 0.0, 0.0, 1.0,
			-1.0, -1.0, -1.0, 0.0, 0.0, 0.0,
		]);


		let indices = new Uint8Array([
			0, 1, 2, 0, 2, 3,
			0, 3, 4, 0, 4, 5,
			0, 5, 6, 0, 6, 1,
			1, 6, 7, 1, 7, 2,
			7, 4, 3, 7, 3, 2,
			4, 7, 6, 4, 6, 5
		]);


		console.log(indices.length)
		const fsize = vertices.BYTES_PER_ELEMENT;

		const a_position = gl.getAttribLocation(gl.program, "a_position");
		// const a_color = gl.getAttribLocation(gl.program, "a_color");
		const u_model = gl.getUniformLocation(gl.program, "u_model");
		const u_view = gl.getUniformLocation(gl.program, "u_view");
		const u_perspective = gl.getUniformLocation(gl.program, "u_perspective");

		const vertex_buffer = gl.createBuffer();
		const index_buffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, fsize * 6, 0);
		// gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, fsize * 6, fsize * 3);

		gl.enableVertexAttribArray(a_position);
		// gl.enableVertexAttribArray(a_color);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

		let eyeX = -5, eyeY = 7, eyeZ = 16;
		document.addEventListener("keydown", function (e) {
			switch (e.key) {
			case "ArrowLeft":
				eyeX -= 0.01;
				break;
			case "ArrowRight":
				eyeX += 0.01;
				break;
			case "ArrowUp":
				eyeY += 0.01;
				break;
			case "ArrowDown":
				eyeY -= 0.01;
				break;
			}
		})

		perspective_matrix.setPerspective(45, canvas.clientWidth / canvas.clientHeight, 1, 100);

		gl.uniformMatrix4fv(u_perspective, false, perspective_matrix.elements);


        requestAnimationFrame(render);

        function render(nowMSec:any) {
            // model_matrix.setTranslate(0, 0, 0);
            // model_matrix.rotate(30, 0.0, 1.0, 1.0);
            view_matrix.setLookAt(eyeX, eyeY, eyeZ, -5.0, 7.0, 0.0, 0.0, 1.0, 0.0)

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniformMatrix4fv(u_view, false, view_matrix.elements);

            gl.uniformMatrix4fv(u_model, false, model_matrix.elements);

            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

            requestAnimationFrame(render);
        }
});






