function Player(isLocalPlayer, communication, spawnLocation, lookatObject) {
    THREE.Object3D.call(this);

    this.isLocalPlayer = true;
    this.communication = communication;
    
    this.head = "";
    this.leftHand = "";
    this.rightHand = "";
    this.camera = null;

    this.createPrefab(spawnLocation, lookatObject);
}

Player.prototype = Object.create(THREE.Object3D.prototype);
Player.prototype.constructor = Player;

Player.prototype.createPrefab = function(spawnLocation, lookatObject) {
    if (this.isLocalPlayer) {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(spawnLocation);
        this.camera.lookAt(lookatObject.quaternion);
        this.add(this.camera);
    }
    else{
        //create a head
        
    }
    this.addControllers(this.camera);
}

Player.prototype.update = function() {
    if (this.isLocalPlayer) {
        if (this.leftHand) {
            this.leftHand.update();
            this.rightHand.update();
            this.controls.update();
        }
    }
    else {
        this.broadcast();
    }
}

Player.prototype.broadcast = function() {
    this.communication.sendPlayerPosition(this.camera.position);
}

Player.prototype.addControllers = function(camera) {
    if (this.isLocalPlayer) {
        this.controls = new THREE.VRControls(camera);
        this.controls.standing = true;

        this.leftHand = new THREE.ViveController(0);
        this.leftHand.standingMatrix = this.controls.getStandingMatrix();
        this.rightHand = new THREE.ViveController(1);
        this.rightHand.standingMatrix = this.controls.getStandingMatrix();
    }
    const controllerMesh = this.buildControllerMesh();
    this.leftHand.add(controllerMesh.clone());
    this.rightHand.add(controllerMesh.clone());

    this.add(this.leftHand);
    this.add(this.rightHand);
}

Player.prototype.buildControllerMesh = function() {
    const controllerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const controllerMaterial = new THREE.Mesh(controllerGeometry, new THREE.MeshLambertMaterial({ color: 0xe28d16 }));
    controllerMaterial.position.x = 0;
    controllerMaterial.position.y = 0;
    controllerMaterial.position.z = 0;
    controllerMaterial.scale.x = 1;
    controllerMaterial.scale.y = 1;
    controllerMaterial.scale.z = 1;
    return controllerMaterial;
}