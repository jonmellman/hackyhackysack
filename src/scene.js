const WebGLRenderer = THREE.WebGLRenderer;
const BasicShadowMap = THREE.BasicShadowMap;
const ThreeScene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;

class Scene {
	constructor(emitter, communication) {
		this.emitter = emitter;
		this.communication = communication;
		this.config = INITIAL_CONFIG;
		this.physics = new Physics(this.config, this.emitter);
		this.container = document.querySelector('#container');
		this.communication.setCallbacks({
			recievedPlayerMove: this.onRecievedPlayerMove.bind(this),
			recievedHackysackMove: this.onRecievedHackysackMove.bind(this),
			recievedHostDiconnect: this.onRecievedHostDisconnect.bind(this)
		});
		this.players = {};
	}

	setup() {
		return new Promise(resolve => {
			this.setupThree();
			if (this.config.isWebVRAvailable) {
				this.setupVR();
			}
			this.physics.setupWorld({
				hackysack: this.hackysack,
				ground: this.ground
			});

			window.addEventListener('resize', this.onWindowResize.bind(this), false);

			const animate = () => {
				let hackysackPosition;
				if (this.communication.isHost) {
					hackysackPosition = this.physics.update();
					this.communication.sendHackysackPosition(hackysackPosition);
				} else {
					hackysackPosition = this.communication.getHackysackPosition();
				}

				for (let clientId in this.players) {
					this.players[clientId].update();
				}

				if (hackysackPosition) {
					this.hackysack.position.copy(hackysackPosition);
					this.renderer.render(this.scene, this.camera);
				}

				if (this.config.isWebVRAvailable) {
					this.animateVR();
				}
				requestAnimationFrame(animate);
			}
			animate();

			resolve('loaded');
		});
	}

	animateVR() {
		this.effect.render(this.scene, this.camera);
	}


	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.effect.setSize(window.innerWidth, window.innerHeight);
	}


	setupThree() {
		this.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0x505050);
		this.renderer.sortObjects = false;
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = BasicShadowMap;
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.container.appendChild(this.renderer.domElement);

		this.scene = new ThreeScene();

		const spawnLocation = new THREE.Vector3(
			Math.max(Math.random() * 5, 2), 
			 1.6,
			Math.max(Math.random() * 5, 2)
		);

		this.createMeshes();
		// this.localPlayer = new OverheadCamera(this.communication, this.hackysack);
		// this.camera = this.localPlayer;

		// this.scene.add(this.localPlayer);

		this.localPlayer = new Player(true, this.communication, spawnLocation, this.hackysack);
		this.players[this.communication.clientId] = this.localPlayer;
		this.camera = this.localPlayer.camera;

		this.scene.add(this.localPlayer);
	}

	createMeshes() {
		// hackysack
		const hackysackGeometry = new THREE.SphereGeometry(this.config.hackysackRadius, 4, 4);
		const hackysackMaterial = new THREE.MeshBasicMaterial({
			color: this.communication.isHost ? 0xcc0000 : 0x8B4513,
			wireframe: true
		});
		this.hackysack = new THREE.Mesh(hackysackGeometry, hackysackMaterial);
		this.hackysack.position.y = 2;

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

		// ground
		const groundGeometry = new THREE.PlaneGeometry(this.config.roomWidth, this.config.roomDepth);
		const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xfffff0, side: THREE.FrontSide });
		this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
		this.ground.rotation.x = -Math.PI / 2;


		this.scene.add(this.hackysack);
		this.scene.add(this.room);
		this.scene.add(this.ground);
	}

	onRecievedPlayerMove(playerId, position) {

	}

	onRecievedHackysackMove(position) {

	}

	onRecievedHostDisconnect() {
		// TODO
	}

	setupVR() {
		this.effect = new THREE.VREffect(this.renderer);
		WEBVR.getVRDisplay((display) => {
			document.body.appendChild(WEBVR.getButton(display, this.renderer.domElement));
			window.addEventListener( 'vrdisplaypresentchange', () => {
				if (display.isPresenting) {

				} else {
					console.log('??')
				}
			});
		});

	}
}