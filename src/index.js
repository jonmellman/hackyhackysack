class Game {
	constructor() {
		this.emitter = EventEmitter({});
		this.communication = new Communication(this.emitter);
    	this.scene = new Scene(this.emitter, this.communication);
    	
    	this.communication.detectGame()
    		.then((isInProgress) => {
    			if (!isInProgress) {
    				this.communication.sendNewGame();
    			}

    			const isHost = !isInProgress;
    			return this.scene.setup(isHost);
    		})
	}
}

$(document).ready(() => {
	window.game = new Game();
})