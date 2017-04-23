class OverheadCamera extends THREE.PerspectiveCamera {
    constructor(communication, lookAtObject) {
        super(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.communication = communication;
        this.lookAt(lookAtObject);
    }
}