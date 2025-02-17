import { DomainError } from '../DomainError';

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
		if (this.status !== CharacterStatus.Default && this.status !== CharacterStatus.Stopped) {
			throw new DomainError(`Cannot start character from status: ${this.status}`);
		}
		this.status = CharacterStatus.Active;
	}

	public stop(): void {
		if (this.status === CharacterStatus.Default || this.status === CharacterStatus.Stopped) {
			throw new DomainError(`Cannot stop character from status: ${this.status}`);
		}
		this.status = CharacterStatus.Stopped;
	}

	public rotate(): void {
		if (this.status !== CharacterStatus.Active) {
			throw new DomainError(`Cannot rotate character from status: ${this.status}`);
		}
		this.status = CharacterStatus.Rotating;
	}

	public move(): void {
		if (this.status !== CharacterStatus.Active) {
			throw new DomainError(`Cannot move character from status: ${this.status}`);
		}
		this.status = CharacterStatus.Moving;
	}

	public reset(): void {
		this.status = CharacterStatus.Default;
	}
}
