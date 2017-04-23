class Communication {
	constructor(emitter) {
		this.callbacks = {};
		this.hackysackPosition;

		// for restarting during dev
		window.disconnectHost = () => {
			this.gameRecord.set('inProgress', false);
		};
	}

	connect() {
		return new Promise((resolve, reject) => {
			this.ds = deepstream('128.208.184.85:6020').login();
			this.ds.on('connectionStateChanged', e => {
				if (e === deepstream.CONSTANTS.CONNECTION_STATE.OPEN) {
					resolve();
				}
				if (e === deepstream.CONSTANTS.CONNECTION_STATE.ERROR) {
					reject('error');
				}
			});

			this.clientId = this.ds.getUid();

			this.ds.on('error', () => {
				// server restarted?
				setTimeout(function() {
					window.location.reload();
				}, 1000);
			});
		})
		.then(() => {
			this.playersRecord = this.ds.record.getRecord(`player/${this.clientId}`);
			this.gameRecord = this.ds.record.getRecord('game')
			this.hackysackRecord = this.ds.record.getRecord('hackysack');
			this.hackysackRecord.subscribe('position', value => {
				this.hackysackPosition = value;
			});
		})
		.then(() => {
			return this.detectGame();
		});
	}

	setCallbacks() {
		this.callbacks = {};
	}
	
	detectGame() {
		return new Promise((resolve) => {
			this.ds.record.snapshot('game', (error, game) => {
				this.isHost = !game.inProgress;
				return resolve(!!game.inProgress);
			});
		});
	}

	sendNewGame() {
		this.gameRecord.set('inProgress', true);
	}

	sendHackysackPosition(hackysackPosition) {
		this.hackysackRecord.set('position', hackysackPosition);
	}

	getHackysackPosition() {
		return this.hackysackPosition;
	}

	sendPlayerPosition(position) {
		this.playersRecord.set({
			position: position
		});
	}
}