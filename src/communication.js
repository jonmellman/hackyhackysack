class Communication {
	constructor() {
		this.client = deepstream('localhost:6020').login()
	}
}