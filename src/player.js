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
        this.headMesh = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: (this.isLocalPlayer)? new THREE.Color("#FF0000") : this.color }));
        this.head.add(this.headMesh);
    }

    showHands() {
        if (this.isLocalPlayer) {
            this.setDefaultHandPositions();
            this.leftHand.forceShow();
            this.rightHand.forceShow();
            
        }

    }

    //show hands if VR hands are detected
    autoHands() {
        if (this.isLocalPlayer) {
            this.leftHand.autoHide();
            this.rightHand.autoHide();
        }
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


    //happens every tick
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

    setDefaultHandPositions(){
        //put the hands on the floor
        this.leftHand.position.set(0, this.config.HAND_SIZE, 0);
        this.rightHand.position.set(0, this.config.HAND_SIZE, 0);

        //position feet nicely apart
        this.leftHand.position.set(-0.2, 0, 0);
        this.rightHand.position.set(0.2, 0, 0);
        this.leftHand.quaternion.setFromEuler(new THREE.Euler(0, 25, 0, 'XYZ'));
        this.rightHand.quaternion.setFromEuler(new THREE.Euler(0, -25, 0, 'XYZ'));
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

        this.setDefaultHandPositions();
       
        this.buildControllerMeshFromObj(this.leftHand);
        this.buildControllerMeshFromObj(this.rightHand);

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
        var material = new THREE.MeshPhongMaterial({ color: this.color, shading: THREE.SmoothShading });
        loader.load("models/MarioShoe.obj", object => {
            console.log("loaded shoe");
            object.traverse( (mesh)=>{
                if (mesh instanceof THREE.Mesh) 
                {
                    mesh.geometry = this.createSmoothShadingGeometry(mesh.geometry);
                    mesh.material = material;
                }
            });

            //LG: set this position to make it fit on the hand
            object.position.set(0, 0.1, 0);
            controller.add(object);
        });
    }

    //to get THREE.smoothShading to work, you need computeFaceNormals,mergeVertices,computeVertexNormals to be run.
    //to do that, you need Geometry, and not BufferGeometry.
    createSmoothShadingGeometry(object){
        var attrib = object.getAttribute('position');
        if(attrib === undefined) {
            throw new Error('a given BufferGeometry object must have a position attribute.');
        }
        var positions = attrib.array;
        var vertices = [];
        for(var i = 0, n = positions.length; i < n; i += 3) {
            var x = positions[i];
            var y = positions[i + 1];
            var z = positions[i + 2];
            vertices.push(new THREE.Vector3(x, y, z));
        }
        var faces = [];
        for(var i = 0, n = vertices.length; i < n; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        var geometry = new THREE.Geometry();
        geometry.vertices = vertices;
        geometry.faces = faces;
        geometry.computeFaceNormals();              
        geometry.mergeVertices()
        geometry.computeVertexNormals();

        return geometry;

        // // //convert back to buffer geonmetry for perf
        // var buffer_g = new THREE.BufferGeometry();
        // buffer_g.fromGeometry(geometry);
        // var mesh = new THREE.Mesh(buffer_g, material);
        // scene.add( mesh )

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