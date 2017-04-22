const WebGLRenderer = THREE.WebGLRenderer;
const BasicShadowMap = THREE.BasicShadowMap;
const ThreeScene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;

class Scene {
	constructor(emitter, communication) {
		this.emitter = emitter;
		this.communication = communication;
		this.config = Object.assign({}, INITIAL_CONFIG);
		this.physics = new Physics(this.config, this.emitter);
		this.container = document.querySelector('#container');
	}

	setup() {
		return new Promise(resolve => {
			this.setupThree();
			this.setupVR();
			resolve('loaded');
		});
	}

	setupThree() {
		this.renderer = new WebGLRenderer({antialias: true});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = BasicShadowMap;
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.container.appendChild(this.renderer.domElement);

		this.scene = new ThreeScene();
		this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

		this.camera.position.x = 0;
		this.camera.position.y = 1.6;
		this.camera.position.z = 5;

		this.createMeshes();

		const self = this;
		function render() {
			self.camera.position.x;
			requestAnimationFrame(render);
			self.renderer.render(self.scene, self.camera);
		}
		render();
	}

	createMeshes() {
		const WIDTH = 1;
		const HEIGHT = 1;
		const DEPTH = 1;

		// Box.
		const boxGeometry = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH);
		const boxMaterial = new THREE.MeshNormalMaterial();

		this.box = new THREE.Mesh(boxGeometry, boxMaterial);
		this.box.position.z = -5;

		// Room.
		const roomGeometry = new THREE.BoxGeometry(10, 2, 10, 10, 2, 10);
		const roomMaterial = new THREE.MeshBasicMaterial({
		  wireframe: true,
		  opacity: 0.3,
		  transparent: true,
		  side: THREE.BackSide
		});
		const room = new THREE.Mesh(roomGeometry, roomMaterial);

		room.position.z = -5;

		this.scene.add(this.box);
		this.scene.add(room);
	}

	setupVR() {

	}
}