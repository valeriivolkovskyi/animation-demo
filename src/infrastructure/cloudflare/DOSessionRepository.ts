import { ICharacterRepository } from '../../application/repository/ICharacterRepository';
import { Character } from '../../domain/entity/Character';
import { parseCharacterStatus } from '../parseStatus';

export class DOSessionRepository implements ICharacterRepository {
	state: DurableObjectState;

	constructor(state: DurableObjectState) {
		this.state = state;
	}

	// For debug
	async initialize(): Promise<void> {
		if (!(await this.getCharacter('1'))) {
			await this.state.storage.put('character-1', JSON.stringify(new Character('1', 'Circle1')));
		}
		if (!(await this.getCharacter('2'))) {
			await this.state.storage.put('character-2', JSON.stringify(new Character('2', 'Triangle1')));
		}
	}

	async listCharacters(): Promise<Character[]> {
		console.log('** FROM SESSION');
		const list = await this.state.storage.list({ prefix: 'character-' });
		const characters: Character[] = [];
		for (const [key, value] of list.entries()) {
			if (value) {
				const data = JSON.parse(value as string);
				characters.push(new Character(data.id, data.name, parseCharacterStatus(data.status)));
			}
		}
		return characters;
	}

	async getCharacter(characterId: string): Promise<Character | undefined> {
		console.log('** FROM SESSION');
		const raw = await this.state.storage.get(`character-${characterId}`);
		if (!raw) return undefined;

		const data = JSON.parse(raw as string);
		return new Character(data.id, data.name, parseCharacterStatus(data.status));
	}

	async updateCharacter(character: Character): Promise<void> {
		const key = `character-${character.id}`;
		const value = JSON.stringify({
			id: character.id,
			name: character.name,
			status: character.status,
		});
		await this.state.storage.put(key, value);
	}
}
