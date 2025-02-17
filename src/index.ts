import { AnimationSessionDO } from './infrastructure/cloudflare/AnimationSessionDO';

export { AnimationSessionDO };

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const sessionId = url.pathname.split('/')[1];

		const validSessions = ['session1', 'session2', 'session3'];

		if (!validSessions.includes(sessionId)) {
			return new Response('Session not found', { status: 404 });
		}

		const id = env.ANIMATION_SESSION_DO.idFromName(sessionId);
		const stub = env.ANIMATION_SESSION_DO.get(id);
		return stub.fetch(request);
	},
} satisfies ExportedHandler<Env>;
