class Communication {
	constructor(emitter) {
		this.client = deepstream('localhost:6020').login();
		this.gameRecord = this.client.record.getRecord('game');
		this.ballRecord = this.client.record.getRecord('ball');

		this.ballPosition;
		this.ballRecord.subscribe('position', value => {
			this.ballPosition = value;
		});

		// for restarting during dev
		window.leave = () => {
			this.gameRecord.set('inProgress', false);
		};
	}
	
	detectGame() {
		return new Promise((resolve) => {
			this.client.record.snapshot('game', (error, game) => {
				return resolve(!!game.inProgress);
			});
		});
	}

	sendNewGame() {
		this.gameRecord.set('inProgress', true);
	}

	sendBallPosition(ballPosition) {
		this.ballRecord.set('position', ballPosition);
	}

	getBallPosition() {
		return this.ballPosition;
	}
}