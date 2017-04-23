class Game {
	constructor() {
		this.emitter = EventEmitter({});
		this.communication = new Communication(this.emitter);
    	this.scene = new Scene(this.emitter, this.communication);
  	
  		console.time('connect')  	
    	this.communication.connect()
    		.then((isInProgress) => {
    			console.timeEnd('connect')
    			if (!isInProgress) {
    				this.communication.sendNewGame();
    			}

    			return this.scene.setup();
    		})
	}
}

$(document).ready(() => {
	window.game = new Game();
})