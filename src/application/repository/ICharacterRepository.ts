import { Character } from '../../domain/entity/Character';

export interface ICharacterRepository {
	getCharacter(characterId: string): Promise<Character | undefined>;

	updateCharacter(character: Character): Promise<void>;
}
