import { ErrorTypes } from '../shared/ErrorTypes';

export class InfrastructureError extends Error {
	public readonly type: ErrorTypes;

	constructor(message: string) {
		super(message);
		this.type = ErrorTypes.InfrastructureError;
	}
}
