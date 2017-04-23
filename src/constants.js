const INITIAL_CONFIG = {
	gravity: 9.8,
	hackysackMass: 1,
	hackysackRadius: .1,
	isWebVRAvailable: WEBVR.isAvailable(),
	playerWidth: 1,
	playerHeight: 1,
	playerDepth: 1,
	roomWidth: 10,
	roomHeight: 10,
	roomDepth: 10,
	timeStep: 1/60
};


const EVENT = {
  FLOOR_COLLISION: 'FLOOR_COLLISION'
};