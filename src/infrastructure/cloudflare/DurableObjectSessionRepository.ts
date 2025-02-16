import { ISessionRepository } from '../../application/repository/ISessionRepository';
import { Session } from '../../domain/entity/Session';
import { Character } from '../../domain/entity/Character';

export class DurableObjectSessionRepository implements ISessionRepository {
	constructor(private namespace: DurableObjectNamespace) {}

	async getSession(sessionId: string): Promise<Session | null> {
		const id = this.namespace.idFromName(sessionId);
		const stub = this.namespace.get(id);

		const response = await stub.fetch('https://dummy/session', { method: 'GET' });

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return this.deserializeSession(data);
	}

	async saveSession(session: Session): Promise<void> {
		const id = this.namespace.idFromName(session.id);
		const stub = this.namespace.get(id);
		const serialized = this.serializeSession(session);

		await stub.fetch('https://dummy/session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(serialized),
		});
	}

	private serializeSession(session: Session): any {
		// todo: fix any
		const charactersObj: { [key: string]: any } = {};

		// Convert the Map of characters to a plain object
		session.characters.forEach((character, id) => {
			charactersObj[id] = {
				id: character.id,
				name: character.name,
				status: character.status,
			};
		});

		return {
			id: session.id,
			characters: charactersObj,
		};
	}

	private deserializeSession(data: any): Session {
		// todo: fix any
		const session = new Session(data.id);

		if (data.characters && typeof data.characters === 'object') {
			Object.keys(data.characters).forEach((key) => {
				const charData = data.characters[key];

				const character = new Character(charData.id, charData.name, charData.status);
				session.addCharacter(character);
			});
		}
		return session;
	}
}
