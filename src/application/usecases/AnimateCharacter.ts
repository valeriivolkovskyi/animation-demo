import { AnimateCharacterDTO } from '../data/AnimationCommand';
import { ISessionRepository } from '../repository/ISessionRepository';
import { Character } from '../../domain/entity/Character';
import { Session } from '../../domain/entity/Session';
import { DomainError } from '../../domain/DomainError';
import { ApplicationError } from '../ApplicationError';

export interface AnimateCharacterUseCase {
	execute(command: AnimateCharacterDTO): Promise<void>;
}

export class AnimateCharacter {
	constructor(private sessionRepository: ISessionRepository) {}

	private async getSession(sessionId: string): Promise<Session> {
		const session: Session | null = await this.sessionRepository.getSession(sessionId);
		if (!session) {
			throw new DomainError(`Session with id ${sessionId} not found.`);
		}

		return session;
	}

	public async execute(dto: AnimateCharacterDTO): Promise<Character> {
		const session = await this.getSession(dto.sessionId);
		const character = session.getCharacter(dto.characterId);

		if (!character) {
			throw new ApplicationError(`Character with id ${dto.characterId} not found in session ${dto.sessionId}.`);
		}

		await this.sessionRepository.saveSession(session);

		return character;
	}
}
