function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return new THREE.Color(color);
}

class Player extends THREE.Object3D {
    constructor(isLocalPlayer, communication, spawnLocation, lookatObject, color, physics) {
        super();
        this.isLocalPlayer = isLocalPlayer;
        this.communication = communication;

        this.config = {
            HAND_SIZE: 0.1, 
            HEAD_SIZE: 0.3
        }
        this.head = "";
        this.leftHand = "";
        this.rightHand = "";
        this.camera = null;
        this.color = color || getRandomColor();

        this.physics = physics;

        this.headMesh = null;
        this.createPrefab(spawnLocation, lookatObject);
    }


    createHead() {
        const headGeometry = new THREE.BoxGeometry(this.config.HEAD_SIZE, this.config.HEAD_SIZE, this.config.HEAD_SIZE);
        this.headMesh = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({ color: this.color }));
        this.head.add(this.headMesh);
    }

    showHead(){
        this.headMesh.visible = true;
    }

    hideHead() {
        this.headMesh.visible = false;
    }


    createPrefab(spawnLocation, lookatObject) {
        this.head = new THREE.Group();
        this.add(this.head);
        this.createHead();
       
        if (this.isLocalPlayer) {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.head.add(this.camera);
        }
        
        this.addControllers(this.head);
        this.showHead();
        
        this.position.copy(spawnLocation);

        // test if we're syncing rotations
        this.head.rotateX(Math.random() * 5);
        this.head.rotateY(Math.random() * 5);
        this.head.rotateY(Math.random()) * 5;
    }

    update() {
        if (this.isLocalPlayer) {
            this.leftHand.update();
            this.rightHand.update();
            this.controls.update();
            this.updatePhysicsModel(this.leftHandModel, this.leftHand);
            this.updatePhysicsModel(this.rightHandModel, this.leftHand);
        }
    }

    updatePhysicsModel(modelObject, object){
        modelObject.position.set(object.x, object.y, object.z);
        //modelObject.position.copy(object.position);
		//modelObject.quaternion.copy(object.quaternion);
    }

    addControllers(head) {
        if (this.isLocalPlayer) {
            this.controls = new THREE.VRControls(head, (err) => {
                console.error('VRControls', err);
            });
            this.controls.standing = true;

            this.leftHand = new THREE.ViveController(0);
            this.leftHand.standingMatrix = this.controls.getStandingMatrix();
            this.rightHand = new THREE.ViveController(1);
            this.rightHand.standingMatrix = this.controls.getStandingMatrix();
        } else {
            this.leftHand = new THREE.Group();
            this.rightHand = new THREE.Group();
        }
        const controllerMesh = this.buildControllerMesh();
        
        this.leftHand.add(controllerMesh.clone());
        this.rightHand.add(controllerMesh.clone());

        this.leftHandModel = this.addControllerPhysicsBody(this.leftHand);
        this.rightHandModel = this.addControllerPhysicsBody(this.rightHand);

        this.add(this.leftHand);
        this.add(this.rightHand);
    }

    addControllerPhysicsBody(controller){
        var body = new CANNON.Body({
			mass: 1,
            type: CANNON.Body.Kinematic,
			shape: new CANNON.Box(new CANNON.Vec3( this.config.HAND_SIZE, this.config.HAND_SIZE, this.config.HAND_SIZE)),
			material: new CANNON.Material()
		});
		
		//body.position.copy(controller.position);
		//body.quaternion.copy(controller.quaternion);
       
        //this.physics.addHand(body);

        return body;
    }

    buildControllerMesh() {
        const controllerGeometry = new THREE.BoxGeometry(this.config.HAND_SIZE, this.config.HAND_SIZE, this.config.HAND_SIZE);
        const controllerMaterial = new THREE.Mesh(controllerGeometry, new THREE.MeshBasicMaterial({ color: 0xe28d16 }));
        return controllerMaterial;
    }
}