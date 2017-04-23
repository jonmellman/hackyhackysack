class Player extends THREE.Object3D {
    constructor(isLocalPlayer, communication, spawnLocation, lookatObject) {
        super();
        this.isLocalPlayer = isLocalPlayer;
        this.communication = communication;
        
        this.head = "";
        this.leftHand = "";
        this.rightHand = "";
        this.camera = null;

        spawnLocation = new THREE.Vector3(2, 2, 2);
        this.createPrefab(spawnLocation, lookatObject);
    }
    createPrefab(spawnLocation, lookatObject) {
        this.head = new THREE.Group();
        this.add(this.head);

        if (this.isLocalPlayer) {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(spawnLocation);
            this.camera.lookAt(lookatObject.quaternion);
            this.head.add(this.camera);

            // temporary
            const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMesh = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: 0xFF0000 }));
            this.head.add(headMesh);
        }
        else {
            const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMesh = new THREE.Mesh(headGeometry, new THREE.MeshLambertMaterial({ color: 0xFF0000 }));
            this.head.add(headMesh);
        }
        this.addControllers(this.head);
    }

    update() {
        if (this.isLocalPlayer) {
            this.leftHand.update();
            this.rightHand.update();
            this.controls.update();
        }
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

        this.add(this.leftHand);
        this.add(this.rightHand);
    }

    buildControllerMesh() {
        const controllerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const controllerMaterial = new THREE.Mesh(controllerGeometry, new THREE.MeshLambertMaterial({ color: 0xe28d16 }));
        controllerMaterial.position.x = Math.random();
        controllerMaterial.position.y = 5;
        controllerMaterial.position.z = Math.random();
        controllerMaterial.scale.x = 1;
        controllerMaterial.scale.y = 1;
        controllerMaterial.scale.z = 1;
        return controllerMaterial;
    }
}