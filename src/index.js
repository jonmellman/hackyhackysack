class Game {
	constructor() {
		this.emitter = EventEmitter({});
		this.communication = new Communication(this.emitter);
    	this.scene = new Scene(this.emitter, this.communication);
    	this.startLoading();
	}

	startLoading() {
		this.scene.setup();
	}
}

$(document).ready(() => {
	const g = new Game();
})