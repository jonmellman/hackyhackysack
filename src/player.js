function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return new THREE.Color(color);
}

class Player extends THREE.Object3D {
    constructor(isLocalPlayer, communication, spawnLocation, lookatObject, color) {
        super();
        this.isLocalPlayer = isLocalPlayer;
        this.communication = communication;

        this.head = "";
        this.leftHand = "";
        this.rightHand = "";
        this.camera = null;
        this.color = color || getRandomColor();

        this.headMesh = null;
        this.createPrefab(spawnLocation, lookatObject);
    }


    createHead() {
        const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.headMesh = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({ color: 0xFF0000 }));
        this.head.add(this.headMesh);
    }

    showHead(){
        this.headMesh.visible = true;
    }

    hideHead() {
        console.log("hideing head 1");
        this.headMesh.visible = false;
        console.log("hideing head 2");
    }


    createPrefab(spawnLocation, lookatObject) {
        this.head = new THREE.Group();
        //this.head.position.set(0,0,0);
        this.add(this.head);

        
        this.createHead();
       
        if (this.isLocalPlayer) {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.head.add(this.camera);
        }
        

        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMesh = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({ color: this.color }));
        this.head.add(headMesh);
        this.addControllers(this.head);
        this.showHead();
        
        this.position.copy(spawnLocation);
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
        const controllerMaterial = new THREE.Mesh(controllerGeometry, new THREE.MeshBasicMaterial({ color: 0xe28d16 }));
        return controllerMaterial;
    }
}