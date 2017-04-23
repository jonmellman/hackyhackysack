class Physics {
	constructor(config, emitter) {
		this.config = config;
		this.emitter = emitter;
	}

	setupWorld(bodies) {
		this.world = new CANNON.World();
		this.world.gravity.set(0, -this.config.gravity, 0);
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.solver.iterations = 20;
		this.setupGround(bodies.ground);
		this.setupHackysack(bodies.hackysack);
	}

	setupGround(plane) {
		const groundMaterial = new CANNON.Material();
		const groundShape = new CANNON.Plane();
		this.ground = new CANNON.Body({
			mass: 0,
			material: groundMaterial,
			shape: groundShape
		});
		this.ground.position.copy(plane.position);
		this.ground.quaternion.copy(plane.quaternion);

		// //LG: collisions
		// //hackysack.collisionResponse = 0;
		// this.ground.addEventListener("collide", function (e) {
		// 	console.log("ground sack collided");
		// });

		this.world.add(this.ground);
	}

	setupHackysack(hackysack) {
		this.hackysack = new CANNON.Body({
			mass: this.config.hackysackMass,
			shape: new CANNON.Sphere(this.config.hackysackRadius),
			material: new CANNON.Material()
		});
		this.addContactMaterial(this.hackysack.material, this.ground.material, .7, .3);
		this.hackysack.position.copy(hackysack.position);
		this.hackysack.quaternion.copy(hackysack.quaternion);
		this.hackysack.linearDamping = 0.1;

		//LG: collisions
		//hackysack.collisionResponse = 0;
		this.hackysack.addEventListener("collide", function (e) {
			console.log("hacky sack collided");
			this.emitter.emit(EVENT.FLOOR_COLLISION, e.body);
		}.bind(this));

		this.world.add(this.hackysack);
	}

	



	update() {
		this.world.step(this.config.timeStep)
		return this.hackysack.position;
	}

	addContactMaterial(mat1, mat2, bounce, friction) {
		const contact = new CANNON.ContactMaterial(
			mat1,
			mat2,
			{ friction: friction, restitution: bounce }
		);
		this.world.addContactMaterial(contact);
		return contact;
	}
}