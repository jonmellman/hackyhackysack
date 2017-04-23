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
			this.setupVR();
			this.physics.setupWorld({
				hackysack: this.hackysack,
				ground: this.ground
			});


			window.addEventListener('resize', this.onWindowResize, false);

			const animate = () => {
				let hackysackPosition;
				if (this.communication.isHost) {
					hackysackPosition = this.physics.update();
					this.communication.sendHackysackPosition(hackysackPosition);
				} else {
					hackysackPosition = this.communication.getHackysackPosition();
				}

				this.communication.sendPlayerPosition(this.camera.position);

				if (hackysackPosition) {
					this.hackysack.position.copy(hackysackPosition);
					this.renderer.render(this.scene, this.camera);
				}

				this.animateVR();
				requestAnimationFrame(animate);
			}
			animate();

			resolve('loaded');
		});
	}

	animateVR() {
		if (this.controller1) {
			this.controller1.update();
			this.controller2.update();
		}
		this.controls.update();
		effect.render(scene, camera);
	}


	onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		effect.setSize(window.innerWidth, window.innerHeight);
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
		this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.cameraRig = new THREE.Group();
		this.cameraRig.add(this.camera);
		this.scene.add(this.cameraRig);

		this.camera.position.x = Math.max(Math.random() * 5, 2);
		this.camera.position.y = 1.6;
		this.camera.position.z = Math.max(Math.random() * 5, 2);

		this.createMeshes();
		this.camera.lookAt(this.hackysack.quaternion);

		this.players[this.communication.clientId] = {
			position: this.camera.position,
			quaternion: this.camera.quaternion
		};
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


		this.scene.add(buildControllerBasic());
		this.scene.add(this.hackysack);
		this.scene.add(this.room);
		this.scene.add(this.ground);
	}

	addControllers(scene, camera) {
		this.controls = new THREE.VRControls(camera);
		this.controls.standing = true;

		this.controller1 = new THREE.ViveController(0);
		this.controller1.standingMatrix = this.controls.getStandingMatrix();
		this.controller1.addEventListener('triggerdown', onTriggerDown);
		this.controller1.addEventListener('triggerup', onTriggerUp);
		this.cameraRig.add(this.controller1);
		this.controller2 = new THREE.ViveController(1);
		this.controller2.standingMatrix = this.controls.getStandingMatrix();
		this.controller2.addEventListener('triggerdown', onTriggerDown);
		this.controller2.addEventListener('triggerup', onTriggerUp);
		this.cameraRig.add(this.controller2);

		var controllerObject = buildControllerBasic();
		if (controllerObject != null) {
			this.controller1.add(controllerObject.clone());
			this.controller2.add(controllerObject.clone());
		}
	}


	//Loads a basic cube for the controller mesh
	buildControllerBasic() {
		var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0xe28d16 }));
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
		object.scale.x = 1;
		object.scale.y = 1;
		object.scale.z = 1;
		return object;
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
		WEBVR.getVRDisplay(function (display) {
			document.body.appendChild(WEBVR.getButton(display, this.renderer.domElement));
		});
	}
}