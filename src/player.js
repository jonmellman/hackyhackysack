function Player(isLocalPlayer, communication, spawnLocation, lookatObject) {
    THREE.Object3D.call(this);

    this.isLocalPlayer = true;
    this.communication = communication;
    
    this.head = "";
    this.leftHand = "";
    this.rightHand = "";
    this.camera = null;

    this.createPrefab(lookatObject);
}

Player.prototype = Object.create( THREE.Object3D.prototype );
Player.prototype.constructor = Player;

Player.prototype.createPrefab = function(lookatObject) {
    if (this.isLocalPlayer) {
        //create a camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.add(this.camera);

        this.camera.lookAt(lookatObject.quaternion);
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
        }
        this.controls.update();
    }
    else {
        //recieve
    }
}

Player.prototype.broadcast = function() {
    if (this.isLocalPlayer) {
        this.communication.sendPlayerPosition(this.camera.position);
    }
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
    var controllerMesh = this.buildControllerMesh();
    this.leftHand.add(controllerMesh.clone());
    this.rightHand.add(controllerMesh.clone());

    this.add(this.leftHand);
    this.add(this.rightHand);
}


//Loads a basic cube for the controller mesh
Player.prototype.buildControllerMesh = function() {
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