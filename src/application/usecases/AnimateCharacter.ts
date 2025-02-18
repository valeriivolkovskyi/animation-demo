import { AnimateCharacterCommand, CharacterCommandDTO } from '../data/CharacterCommandDTO';
import { Character } from '../../domain/entity/Character';
import { ApplicationError } from '../ApplicationError';
import { ICharacterRepository } from '../repository/ICharacterRepository';

export interface AnimateCharacterUseCase {
	execute(command: CharacterCommandDTO): Promise<Character>;
}

export interface ICommand {
	execute(character: Character): void;
}

export class StartCommand implements ICommand {
	execute(character: Character): void {
		character.start();
	}
}

export class StopCommand implements ICommand {
	execute(character: Character): void {
		character.stop();
	}
}

export class RotateCommand implements ICommand {
	execute(character: Character): void {
		character.rotate();
	}
}

export class MoveCommand implements ICommand {
	execute(character: Character): void {
		character.move();
	}
}

export class ResetCommand implements ICommand {
	execute(character: Character): void {
		character.reset();
	}
}

// Factory to map the AnimateCharacterCommand to the corresponding command class
export class CommandFactory {
	static getCommand(command: AnimateCharacterCommand): ICommand {
		switch (command) {
			case AnimateCharacterCommand.Start:
				return new StartCommand();
			case AnimateCharacterCommand.Stop:
				return new StopCommand();
			case AnimateCharacterCommand.Rotate:
				return new RotateCommand();
			case AnimateCharacterCommand.Move:
				return new MoveCommand();
			case AnimateCharacterCommand.Reset:
				return new ResetCommand();
			default:
				// This case should never occur since our DTO enforces the enum type,
				// but it's good to have a fallback.
				throw new ApplicationError(`Invalid command: ${command}`);
		}
	}
}

export class AnimateCharacter implements AnimateCharacterUseCase {
	constructor(private sessionRepository: ICharacterRepository) {}

	public async execute(dto: CharacterCommandDTO): Promise<Character> {
		const character = await this.sessionRepository.getCharacter(dto.characterId);

		if (!character) {
			throw new ApplicationError(`Character with id ${dto.characterId} not found in session.`);
		}

		const commandInstance = CommandFactory.getCommand(dto.command);
		commandInstance.execute(character);

		await this.sessionRepository.updateCharacter(character);

		return character;
	}
}
