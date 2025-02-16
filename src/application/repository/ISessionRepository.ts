import { Session } from '../../domain/entity/Session';

export interface ISessionRepository {
	getSession(sessionId: string): Promise<Session | null>;

	saveSession(session: Session): Promise<void>;
}
