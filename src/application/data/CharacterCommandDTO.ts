export enum AnimateCharacterCommand {
	Start = 'start',
	Stop = 'stop',
	Rotate = 'rotate',
	Move = 'move',
	Reset = 'reset',
}

export interface CharacterCommandDTO {
	characterId: string;
	command: AnimateCharacterCommand;
}
