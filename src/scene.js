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
			this.physics.setupWorld({
				ball: this.sphere,
				plane: this.plane
			});

			const animate = () => {
				const ballPosition = this.physics.update();
				this.sphere.position.copy(ballPosition);
				this.renderer.render(this.scene, this.camera);
				requestAnimationFrame(animate);
			}
			animate();

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
	}

	createMeshes() {
		// Sphere
		const sphereGeometry = new THREE.SphereGeometry(this.config.ballRadius, 4, 4);
		const sphereMaterial = new THREE.MeshBasicMaterial({color: 0x8B4513, wireframe: true});
		this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		this.sphere.position.y = 4;

		// Room.
		const roomGeometry = new THREE.BoxGeometry(this.config.roomWidth, this.config.roomHeight, this.config.roomDepth, 10, 10, 10);
		const roomMaterial = new THREE.MeshBasicMaterial({
		  wireframe: true,
		  opacity: 0.3,
		  transparent: true,
		  side: THREE.BackSide
		});
		this.room = new THREE.Mesh(roomGeometry, roomMaterial);
		this.room.position.z = -5;

		// Plane
		const planeGeometry = new THREE.PlaneGeometry(this.config.roomWidth, this.config.roomDepth);
		const planeMaterial = new THREE.MeshBasicMaterial( {color: 0xfffff0, side: THREE.FrontSide} );
		this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
		this.plane.rotation.x = -Math.PI / 2;


		this.scene.add(this.sphere);
		this.scene.add(this.room);
		this.scene.add(this.plane);
	}

	setupVR() {

	}
}