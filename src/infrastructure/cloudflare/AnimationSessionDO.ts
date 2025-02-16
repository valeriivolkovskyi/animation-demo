export class AnimationSessionDO {
	state: DurableObjectState;
	env: any;

	constructor(state: DurableObjectState, env: any) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/session') {
			if (request.method === 'GET') {
				// Retrieve the session state from storage.
				const sessionData = await this.state.storage.get('session');
				if (!sessionData) {
					return new Response('Session not found', { status: 404 });
				}
				return new Response(JSON.stringify(sessionData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} else if (request.method === 'POST') {
				try {
					const json = await request.json();
					await this.state.storage.put('session', json);
					return new Response('Session updated', { status: 200 });
				} catch (error) {
					return new Response('Invalid JSON payload', { status: 400 });
				}
			}
		}

		return new Response('Not Found', { status: 404 });
	}
}
