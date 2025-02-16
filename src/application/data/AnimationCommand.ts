export enum AnimationCommand {
	Start = 'start',
	Stop = 'stop',
	Rotate = 'rotate',
	Move = 'rotate',
	Reset = 'reset',
}


export interface AnimateCharacterDTO {
	characterId: string;
	sessionId: string;
	command: AnimationCommand;
}
