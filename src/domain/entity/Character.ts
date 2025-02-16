export enum CharacterStatus {
	Default = 'default',
	Active = 'active',
	Stopped = 'stopped',
	Rotating = 'rotating',
	Moving = 'moving',
}

export class Character {
	public id: string;
	public name: string;
	public status: CharacterStatus;

	constructor(id: string, name: string, status: CharacterStatus = CharacterStatus.Default) {
		this.id = id;
		this.name = name;
		this.status = status;
	}

	public start(): void {
		this.status = CharacterStatus.Active;
	}

	public stop(): void {
		this.status = CharacterStatus.Stopped;
	}

	public rotate(): void {
		this.status = CharacterStatus.Rotating;
	}

	public move(): void {
		this.status = CharacterStatus.Moving;
	}

	public reset(): void {
		this.status = CharacterStatus.Default;
	}
}
