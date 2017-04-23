// TODO: move to Player
function deserialize(playerData) {
	console.assert(playerData.position.x !== undefined);
	console.assert(playerData.position.y !== undefined);
	console.assert(playerData.position.z !== undefined);

	console.assert(playerData.head.quaternion.length === 4)
	console.assert(playerData.head.quaternion.every(el => el !== undefined))
	return {
		position: new THREE.Vector3(
			playerData.position.x,
			playerData.position.y,
			playerData.position.z
		),
		color: new THREE.Color(playerData.color),
		head: {
			quaternion: (new THREE.Quaternion()).fromArray(playerData.head.quaternion)
		}
	};
}

class Communication {
	constructor(emitter) {
		this.callbacks = {};
		this.hackysackPosition;
		this.latestPlayersUpdate = {};

		// for restarting during dev
		window.disconnectHost = () => {
			this.gameRecord.set('inProgress', false);
		};

		window.forceClientRefresh = () => {
			this.gameRecord.set('forceRefresh', true);
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
			this.playersRecord = this.ds.record.getRecord(`players`);
			this.gameRecord = this.ds.record.getRecord('game');
			this.hackysackRecord = this.ds.record.getRecord('hackysack');
			this.hackysackRecord.subscribe('position', value => {
				this.hackysackPosition = value;
			});

			this.playersRecord.subscribe('playerData', (playersUpdate) => {
				console.assert(checkPos(playersUpdate));
				this.latestPlayersUpdate = playersUpdate;
			});

			this.gameRecord.subscribe('forceRefresh', (doIt) => {
				if (doIt) {
					this.gameRecord.set('forceRefresh', false);
					window.location.reload();
				}
			});
		})
		.then(() => {
			return this.detectGame();
		});
	}

	setCallbacks(callbacks) {
		this.callbacks = callbacks;
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

	sendPlayerData(data) {
		console.assert(checkPos(data));
		this.playersRecord.set('playerData', data);
	}

	resolvePlayerUpdates(playersInScene) {
		const result = {
			playersEntered: [],
			playersExited: []
		};

		for (let clientId in this.latestPlayersUpdate) {
			if (clientId === this.clientId) {
				continue;
			}

			const playerUpdate = deserialize(this.latestPlayersUpdate[clientId]);
			
			if (!playersInScene[clientId]) {
				const playerEntered = playerUpdate;
				playerEntered.clientId = clientId;
				result.playersEntered.push(playerEntered);
			} else {
				playersInScene[clientId].position.copy(playerUpdate.position);
				playersInScene[clientId].head.quaternion.copy(playerUpdate.head.quaternion);
			}
		}

		for (let clientId in playersInScene) {
			if (!this.latestPlayersUpdate[clientId] && clientId !== this.clientId) {
				result.playersExited.push(clientId);
			}
		}

		return result;
	}
}