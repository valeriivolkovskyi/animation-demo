import { CharacterStatus } from '../domain/entity/Character';

export function parseCharacterStatus(status: string): CharacterStatus {
	const normalized = status.toLowerCase();
	switch (normalized) {
		case CharacterStatus.Active:
			return CharacterStatus.Active;
		case CharacterStatus.Stopped:
			return CharacterStatus.Stopped;
		case CharacterStatus.Rotating:
			return CharacterStatus.Rotating;
		case CharacterStatus.Moving:
			return CharacterStatus.Moving;
		default:
			return CharacterStatus.Default;
	}
}
