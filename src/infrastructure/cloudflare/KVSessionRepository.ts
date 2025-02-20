import { ICharacterRepository } from '../../application/repository/ICharacterRepository';
import { Character } from '../../domain/entity/Character';
import { InfrastructureError } from '../InfrastructureError';
import { parseCharacterStatus } from '../parseStatus';

interface StoredCharacter {
	id: string;
	name: string;
	status: string;
}

export class KVSessionRepository implements ICharacterRepository {
	constructor(private kv: KVNamespace) {}

	// for debug purposes only
	async initialize(): Promise<void> {
		await this.kv.put(`character-1`, JSON.stringify(new Character('1', 'Circle')));
		await this.kv.put(`character-2`, JSON.stringify(new Character('2', 'Triangle')));
	}

	async listCharacters(): Promise<Character[]> {
		try {
			const listResult = await this.kv.list({ prefix: 'character' });
			const characterPromises = listResult.keys.map(async (entry) => {
				try {
					const value = await this.kv.get(entry.name);
					if (value) {
						const data = JSON.parse(value) as StoredCharacter;
						return new Character(data.id, data.name, parseCharacterStatus(data.status));
					}
				} catch (error) {
					console.error('Error parsing character data from KV for entry:', entry.name, error);
				}
				return undefined;
			});
			const characters = await Promise.all(characterPromises);
			return characters.filter((char): char is Character => !!char);
		} catch (error) {
			console.error('Error listing characters from KV:', error);
			return [];
		}
	}

	async getCharacter(characterId: string): Promise<Character | undefined> {
		try {
			const rawData = await this.kv.get(`character-${characterId}`);
			if (!rawData) return undefined;
			const data = JSON.parse(rawData);
			return new Character(data.id, data.name, parseCharacterStatus(data.status));
		} catch (error) {
			console.error(`Error getting character ${characterId}:`, error);
			return undefined;
		}
	}

	async updateCharacter(character: Character): Promise<void> {
		try {
			const key = `character-${character.id}`;
			const value = JSON.stringify({
				id: character.id,
				name: character.name,
				status: character.status,
			});
			await this.kv.put(key, value);
		} catch (error) {
			console.error(`Error updating character ${character.id}:`, error);
			throw new InfrastructureError(`Failed to update character ${character.id}`);
		}
	}
}
