import { ErrorTypes } from '../shared/ErrorTypes';


export class DomainError extends Error {
	public readonly type: ErrorTypes;

	constructor(message: string) {
		super(message);
		this.type = ErrorTypes.DomainError;
	}
}
