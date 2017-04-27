const WebGLRenderer = THREE.WebGLRenderer;
const BasicShadowMap = THREE.BasicShadowMap;
const ThreeScene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;

window.checkPos = function (obj) {
	for (let key in obj) {
		if (obj[key].position.x === undefined ||
			obj[key].position.y === undefined ||
			obj[key].position.z === undefined) {

			return false;
		}
	}

	return true;
}


// TODO: move to Player
function serialize(playersUpdate) {
	const serialized = {};
	for (let clientId in playersUpdate) {
		serialized[clientId] = Player.serialize(playersUpdate[clientId]);
	}
	return serialized;
}

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
function throttle(thisArg, func, wait, options) {
	var context, args, result;
	var timeout = null;
	var previous = 0;
	if (!options) options = {};
	var later = function () {
		previous = options.leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};
	return function () {
		var now = Date.now();
		if (!previous && options.leading === false) previous = now;
		var remaining = wait - (now - previous);
		context = thisArg;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
};

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

		this.sendPlayerData = throttle(this.communication, this.communication.sendPlayerData, 200);
		console.log("register onbeforeunload");
		//remove localPLayer if navigating away
		$(window).on("beforeunload", this.unload.bind(this));
		console.log("register onbeforeunload 2");
	}

	unload() {

		console.log("onbeforeunload");

		// Try to clean up the player data, and make sure the game exits
		if (this.communication.isHost) {
			this.communication.sendEndGame();
			this.players = {}; //delete all players!
		}

		// Try to clean up the player data
		if (this.players[this.communication.clientId] != null) {
			delete this.players[this.communication.clientId];
		}

		this.sendPlayerData(serialize(this.players));
	}

	setup() {
		return new Promise(resolve => {
			this.setupThree();
			if (this.config.isWebVRAvailable) {
				this.setupVR();
			}
			// this.physics.setupWorld({
			// 	hackysack: this.hackysack,
			// 	ground: this.ground
			// });

			window.addEventListener('resize', this.onWindowResize.bind(this), false);

			const animate = () => {
				this.update();
				requestAnimationFrame(animate);
			}
			animate();

			resolve('loaded');
		});
	}
	
	//local IsHost Property
	get isHost() { return this.communication.isHost; }

	//happens every frame (like unity)
	update() {
		let hackysackPosition;
		//hackysackPosition = this.physics.update();
		if (this.isHost) {
			hackysackPosition = this.physics.update();
			this.communication.sendHackysackPosition(hackysackPosition);
		} else {
			hackysackPosition = this.communication.getHackysackPosition();
		}

		console.assert(checkPos(this.players));
		const result = this.communication.resolvePlayerUpdates(this.players);
		console.assert(checkPos(this.players));

		if (result.playersEntered.length) {
			console.debug('enter', result.playersEntered)
		}
		if (result.playersExited.length) {
			console.debug('exit', result.playersExited);
		}

		for (let playerExited of result.playersExited) {
			delete this.players[playerExited]
		}
		for (let playerEntered of result.playersEntered) {
			this.players[playerEntered.clientId] = new Player(
				false,
				this.communication,
				playerEntered.position,
				this.hackysack,
				playerEntered.color,
				this.physics
			);
			this.scene.add(this.players[playerEntered.clientId]);
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

		if (this.scoreBoard) {
			this.scoreBoard.lookAt(new THREE.Vector3(this.camera.position.x, this.scoreBoard.position.y, this.camera.position.z));
			//this.scoreBoard.rotation.y += 0.01;
		}


		this.sendPlayerData(serialize(this.players))
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
		this.renderer.setClearColor(0xcefff7);
		this.renderer.sortObjects = false;
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		//this.renderer.shadowMap.type = BasicShadowMap;
		this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.container.appendChild(this.renderer.domElement);

		//Set up basic scene
		this.scene = new ThreeScene();
		this.createMeshes();

		//setup local player
		const spawnLocation = new THREE.Vector3(
			2.5 - Math.max(Math.random() * 5, 2),
			0,
			2.5 - Math.max(Math.random() * 5, 2)
		);
		this.localPlayer = new Player(true, this.communication, spawnLocation, this.hackysack, null, this.physics);
		this.scene.add(this.localPlayer);
		this.players[this.communication.clientId] = this.localPlayer;

		// add lobby camera
		this.overheadCamera = new OverheadCamera(this.communication, this.hackysack);
		this.scene.add(this.overheadCamera);

		this.toggleVR(false);
	}

	createMeshes() {

		// ground
		const groundGeometry = new THREE.PlaneGeometry(this.config.roomWidth, this.config.roomDepth);
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x78c62d });
		//groundMaterial.side = THREE.FrontSide;
		this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
		this.ground.rotation.x = -Math.PI / 2;
		this.ground.receiveShadow  = true; // the only object that recieves shadow - this helps depth perception (important for game)
		this.scene.add(this.ground);
		this.physics.setupGround(this.ground, this.config.roomDepth, this.config.roomWidth);

		// hackysack
		const hackysackGeometry = new THREE.SphereGeometry(this.config.hackysackRadius, 32, 32);
		const hackysackMaterial = new THREE.MeshStandardMaterial({
			color: this.communication.isHost ? 0xff0000 : 0xffffff,
			wireframe: false
		});
		this.hackysack = new THREE.Mesh(hackysackGeometry, hackysackMaterial);
		this.hackysack.position.y = 2;
		this.hackysack.castShadow = true; // the only object that casts - this helps depth perception (important for game)
		this.scene.add(this.hackysack);
		this.physics.setupHackysack(this.hackysack);

		// Room.
		// const roomGeometry = new THREE.BoxGeometry(this.config.roomWidth, this.config.roomHeight, this.config.roomDepth, 10, 10, 10);
		// const roomMaterial = new THREE.MeshBasicMaterial({
		// 	wireframe: true,
		// 	opacity: 0.3,
		// 	transparent: true,
		// 	side: THREE.BackSide
		// });
		// this.room = new THREE.Mesh(roomGeometry, roomMaterial);
		// this.room.position.z = -5;
		//this.scene.add(this.room);

		//lights
		this.directionalLight = new THREE.DirectionalLight({ color: 0xffffff, intensity: 0.9, castShadow:true });
		this.directionalLight.castShadow = true;
		this.directionalLight.position.set(1, 2, 3);
		this.directionalLight.shadowDarkness = 1;		
		this.directionalLight.shadowCameraVisible = true;	

		 this.directionalLight.shadow.mapSize.width = 512;  // default
		this.directionalLight.shadow.mapSize.height = 512; // default
		this.directionalLight.shadow.camera.near = 0.5;       // default
		this.directionalLight.shadow.camera.far = 500      // default

		this.scene.add(this.directionalLight);


		this.setupScoreBoard();
	}


	setupScoreBoard() {
		this.score = 10;
		this.scoreBoard = new THREE.Group();
		this.scene.add(this.scoreBoard);
		const fontloader = new THREE.FontLoader();
		new Promise(resolve => {
			fontloader.load('//raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json', font => {
				this.font = font;
				resolve();
			})
		}).then(() => {
			let material = new THREE.MeshLambertMaterial({
				color: 0xaef966,
				transparent: true,
			});
			let geometry = this.getScoreBoardTextGeometry(this.score);
			this.scoreBoardText = new THREE.Mesh(geometry, material);
			this.scoreBoardText.quaternion.setFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
			this.scoreBoard.position.y = 0.01; //just abaove the ground
			this.scoreBoard.add(this.scoreBoardText);
			this.updateScoreBoard(this.score);

			//link up scoring
			this.emitter.on(EVENT.FLOOR_COLLISION, () => {
				//update the score
				this.score--;
				this.updateScoreBoard(this.score + '');
			});
		})
	}

	getScoreBoardTextGeometry(score) {
		var geometry = new THREE.TextGeometry(`${score}`, {
			font: this.font,
			size: this.config.scoreFontSize,
			height: 0.001,
			curveSegments: 5,
		});
		//geometry.dynamic = true;
		geometry.computeBoundingBox();
		//geometry.verticesNeedUpdate = true;

		geometry.rotateX(Math.PI / 2);
		geometry.translate(-1, 0, -1);
		geometry.rotateZ(Math.PI);
		geometry.rotateY(Math.PI);
		return geometry;
	}


	updateScoreBoard(score) {
		this.scoreBoardText.geometry = this.getScoreBoardTextGeometry(score);
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
			window.addEventListener('vrdisplaypresentchange', () => {
				this.toggleVR(display.isPresenting);
			});
		});
	}

	toggleVR(enable) {
		if (enable) {
			this.camera = this.localPlayer.camera;
			this.localPlayer.hideHead();
			this.localPlayer.autoHands();
			this.onWindowResize();
		} else {
			this.camera = this.overheadCamera;
			this.localPlayer.showHead();
			this.localPlayer.showHands();
		}
	}
}