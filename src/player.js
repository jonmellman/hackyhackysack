


class Player extends THREE.Group {
    constructor(isLocalPlayer, communication, spawnLocation, lookatObject) {
        this.head = "";
        this.leftHand = "";
        this.rightHand = "";
        // this.clientId = "";
        this.networkId = "";
        this.communication = communication;

        this.camera = null;

        //Create the prefab
        this.createPrefab(lookatObject);

    }


    createPrefab(lookatObject) {
        if (this.isLocalPlayer) {
            //create a camera
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.add(this.camera);

            this.camera.lookAt(lookatObject.quaternion);
        }
        else{
            //create a head
            
        }
        this.addControllers();
    }


    update() {

        if (this.isLocalPlayer) {
            //read from inputs and broadcast

            //
        }
        else {
            //recieve
        }
    }


    //Boradcast realtime info
    broadcast() {


    }

    addControllers(camera) {

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
    buildControllerMesh() {
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


}
