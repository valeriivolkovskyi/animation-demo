import { Character } from "./Character";

export class Session {
	public id: string;
	public characters: Map<string, Character>;

	constructor(id: string) {
		this.id = id;
		this.characters = new Map();
	}

	public addCharacter(character: Character): void {
		this.characters.set(character.id, character);
	}

	public removeCharacter(characterId: string): void {
		this.characters.delete(characterId);
	}

	public getCharacter(characterId: string): Character | undefined {
		return this.characters.get(characterId);
	}
}
