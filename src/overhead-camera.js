class OverheadCamera extends THREE.PerspectiveCamera {
    constructor(communication, lookAtObject) {
        super(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.communication = communication;

        this.position.x = 1;
        this.position.y = 10;
        this.position.z = 1;
        this.lookAt(lookAtObject.quaternion);
    }
}