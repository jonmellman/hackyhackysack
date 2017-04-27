function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
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
            HEAD_SIZE: 0.3,
            HEAD_HEIGHT: 1.5
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

    static serialize(playerObject) {
        var serializedPlayer = NetworkTransform.serialize(playerObject);
        serializedPlayer.head = NetworkTransform.serialize(playerObject.head);
        serializedPlayer.leftHand = NetworkTransform.serialize(playerObject.leftHand);
        serializedPlayer.rightHand = NetworkTransform.serialize(playerObject.rightHand);
        serializedPlayer.color = playerObject.color;

        return serializedPlayer;
    }


    static deserialize(playerData) {
        console.assert(playerData.position.x !== undefined);
        console.assert(playerData.position.y !== undefined);
        console.assert(playerData.position.z !== undefined);

        console.assert(playerData.head.quaternion.length === 4)
        console.assert(playerData.head.quaternion.every(el => el !== undefined))

        var player = NetworkTransform.deserialize(playerData);
        player.color = new THREE.Color(playerData.color);
        player.head = NetworkTransform.deserialize(playerData.head);
        player.leftHand = NetworkTransform.deserialize(playerData.leftHand);
        player.rightHand = NetworkTransform.deserialize(playerData.rightHand);

        return player;
    }

    
    createHead() {
        const headGeometry = new THREE.BoxGeometry(this.config.HEAD_SIZE, this.config.HEAD_SIZE, this.config.HEAD_SIZE);
        this.headMesh = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: this.color }));
        this.head.add(this.headMesh);
    }

    showHead() {
        this.headMesh.visible = true;
    }

    hideHead() {
        this.headMesh.visible = false;
    }


    createPrefab(spawnLocation, lookatObject) {
        this.head = new THREE.Group();
        this.head.position.set(0, this.config.HEAD_HEIGHT, 0);
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

    updatePhysicsModel(modelObject, object) {
        modelObject.position.set(object.x, object.y, object.z);
        modelObject.position.copy(object.position);
        modelObject.quaternion.copy(object.quaternion);
    }

    addControllers(head) {

        //TODO: check if the machine is VR capable here too!
        if (this.isLocalPlayer) {
            this.controls = new THREE.VRControls(head, (err) => {
                console.error('VRControls', err);
            });
            this.controls.standing = true;

            this.leftHand = new THREE.ViveController(0);
            this.leftHand.standingMatrix = this.controls.getStandingMatrix();
            this.rightHand = new THREE.ViveController(1);
            this.rightHand.standingMatrix = this.controls.getStandingMatrix();


            //attach events
            //this.rightHand.attachEventListener("triggerdown", );
        } else {
            this.leftHand = new THREE.Group();
            this.rightHand = new THREE.Group();
        }

        //put the hNDS ON THE FLOOR.
        this.leftHand.position.set(0, this.config.HAND_SIZE, 0);
        this.rightHand.position.set(0, this.config.HAND_SIZE, 0);

        //const controllerMesh = this.buildControllerMesh();
        //this.leftHand.add(controllerMesh.clone());
        //this.rightHand.add(controllerMesh.clone());
        this.buildControllerMeshFromObj(this.leftHand);
        this.buildControllerMeshFromObj(this.rightHand);


        //position feet nicely apart
        this.leftHand.position.set(-0.2, 0, 0);
        this.rightHand.position.set(0.2, 0, 0);
        this.leftHand.quaternion.setFromEuler(new THREE.Euler(0, 25, 0, 'XYZ'));
        this.rightHand.quaternion.setFromEuler(new THREE.Euler(0, -25, 0, 'XYZ'));

        this.leftHandModel = this.addControllerPhysicsBody(this.leftHand);
        this.rightHandModel = this.addControllerPhysicsBody(this.rightHand);

        this.add(this.leftHand);
        this.add(this.rightHand);
    }

    addControllerPhysicsBody(controller) {
        var body = new CANNON.Body({
            mass: 1,
            type: CANNON.Body.Kinematic,
            shape: new CANNON.Box(new CANNON.Vec3(this.config.HAND_SIZE, this.config.HAND_SIZE, this.config.HAND_SIZE)),
            material: new CANNON.Material()
        });

        //todo - convert to world coordinates!
        body.position.copy(controller.position);
        body.quaternion.copy(controller.quaternion);

        this.physics.addHand(body);

        return body;
    }

    buildControllerMesh() {
        const controllerGeometry = new THREE.BoxGeometry(this.config.HAND_SIZE, this.config.HAND_SIZE, this.config.HAND_SIZE);
        const controllerMaterial = new THREE.Mesh(controllerGeometry, new THREE.MeshLambertMaterial({ color: this.color }));
        return controllerMaterial;
    }

    buildControllerMeshFromObj(controller) {
        var loader = new THREE.OBJLoader();
        // loader.setMaterials([
        //     new THREE.MeshLambertMaterial({ color: 0xe28d16 }), 
        //     new THREE.MeshLambertMaterial({ color: 0x000000 }), 
        //     new THREE.MeshLambertMaterial({ color: 0xffffff })
        // ]);
        var material = new THREE.MeshLambertMaterial({ color: this.color });
        loader.load("models/MarioShoe.obj", object => {
            console.log("loaded shoe");
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) child.material = material;
            });

            //LG: set this position to make it fit on the hand
            object.position.set(0, 0.1, 0);
            //object.scale.set(0.01,0.01,0.01);
            controller.add(object);
        });
    }

    // buildControllerMesh2(object) {
    //     return new Promise(resolve => {
    //         var loader = new THREE.OBJLoader();
    //         loader.load(
    //             'models/mariosshoe.obj',
    //             object => {
    //                 resolve();
    //                 scene.add(object);
    //             }
    //         );
    //     });
    // }
}