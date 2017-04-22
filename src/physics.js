class Physics {
	constructor(config, emitters) {
		this.config = config;
		this.emitters = emitters;
	}

	setupWorld(bodies) {
		this.world = new CANNON.World();
		this.world.gravity.set(1, -this.config.gravity, 0);
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.solver.iterations = 20;
		this.setupGround(bodies.plane);
		this.setupBall(bodies.ball);
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
		this.world.add(this.ground);
	}

	setupBall(ball) {
		this.ball = new CANNON.Body({
			mass: this.config.ballMass,
			shape: new CANNON.Sphere(this.config.ballRadius),
			material: new CANNON.Material()
		});
		this.addContactMaterial(this.ball.material, this.ground.material, .7, .3);
		this.ball.position.copy(ball.position);
		this.ball.quaternion.copy(ball.quaternion);
		this.ball.linearDamping = 0.1;
		this.world.add(this.ball);
	}

	update() {
		this.world.step(this.config.timeStep)
		return this.ball.position;
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