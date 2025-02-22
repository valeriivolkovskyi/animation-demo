import { AnimateCharacter } from '../../application/usecases/AnimateCharacter';
import { DurableObject } from 'cloudflare:workers';
import { KVSessionRepository } from './KVSessionRepository';
import { Character, CharacterStatus } from '../../domain/entity/Character';
import { AnimateCharacterCommand, CharacterCommandDTO } from '../../application/data/CharacterCommandDTO';
import { InfrastructureError } from '../InfrastructureError';
import { checkAuth } from '../../utils/checkAuth';
import { DOSessionRepository } from './DOSessionRepository';

const MAX_MESSAGE_SIZE = 1000;

export interface Env {
	ANIMATION_KV: KVNamespace;
}

interface AnimateMessage {
	characterId: string;
	command: string;
}

export class AnimationSessionDO extends DurableObject<AnimationSessionDO> {
	state: DurableObjectState;
	// @ts-ignore
	env: Env;
	clients: Set<WebSocket>;
	logs: string[];
	createdAt: string;
	sessionId: string;
	kvRepository: KVSessionRepository;
	sessionRepository: DOSessionRepository;

	constructor(state: DurableObjectState, env: any) {
		super(state, env);
		this.state = state;
		this.env = env;
		this.clients = new Set<WebSocket>();
		this.logs = [];
		this.createdAt = new Date().toISOString();

		this.sessionId = state.id.toString();
		this.kvRepository = new KVSessionRepository(env.ANIMATION_KV);

		this.sessionRepository = new DOSessionRepository(this.state);

		// for debug
		this.sessionRepository.initialize();

		// init characters for domo purposes
		// this.kvSessionRepository.initialize();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method.toUpperCase();

		const pathSegment = url.pathname.split('/')[2] || '';
		const path = `/${pathSegment}`;

		// --- WebSocket Endpoint ---
		if (path === '/ws') {
			if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
				return new Response('Expected WebSocket upgrade', { status: 426 });
			}

			const pair = new WebSocketPair();
			const [client, server] = [pair[0], pair[1]];
			this.handleSessionWebSocket(server);
			return new Response(null, { status: 101, webSocket: client });
		}

		// --- REST API Endpoints ---
		if (method === 'GET') {
			const authError = checkAuth(request);

			if (authError) {
				return authError;
			}

			switch (path) {
				case '/state': {
					const characters = await this.sessionRepository.listCharacters();
					const stateData = {
						sessionId: this.sessionId,
						characters: characters.map((char) => ({
							id: char.id,
							name: char.name,
							status: char.status,
						})),
					};
					return new Response(JSON.stringify(stateData), {
						headers: { 'Content-Type': 'application/json' },
					});
				}
				case '/characters': {
					const characters = await this.sessionRepository.listCharacters();
					return new Response(
						JSON.stringify({
							characters: characters
								.map((char) => ({
									id: char.id,
									name: char.name,
									status: char.status,
								}))
								.filter((char) => char.status === CharacterStatus.Active),
						}),
						{ headers: { 'Content-Type': 'application/json' } },
					);
				}
				case '/logs': {
					const listResult = await this.env.ANIMATION_KV.list({ prefix: 'character-log-' });

					const logs = await Promise.all(
						listResult.keys.map(async (entry) => {
							const raw = await this.env.ANIMATION_KV.get(entry.name);
							return raw ? JSON.parse(raw) : null;
						}),
					);

					return new Response(JSON.stringify({ logs: logs.filter(Boolean) }), {
						headers: { 'Content-Type': 'application/json' },
					});
				}

				default:
					return new Response('Not found', { status: 404 });
			}
		}

		// If method not handled, return 404.
		return new Response('Not found', { status: 404 });
	}

	private handleSessionWebSocket(webSocket: WebSocket): void {
		webSocket.accept();
		this.clients.add(webSocket);

		webSocket.addEventListener('message', (event) => {
			this.handleMessage(event.data, webSocket);
		});

		webSocket.addEventListener('close', () => {
			this.clients.delete(webSocket);
		});

		webSocket.addEventListener('error', (err) => {
			console.error('InfrastructureError: WebSocket error:', err);
			this.clients.delete(webSocket);
		});
	}

	private async handleMessage(message: any, sourceSocket: WebSocket): Promise<void> {
		// ensure the message is a string and within a reasonable size.
		if (typeof message !== 'string' || message.length > MAX_MESSAGE_SIZE) {
			sourceSocket.send(JSON.stringify({ error: 'InfrastructureError: Invalid message format or size.' }));
			return;
		}

		let data: AnimateMessage;
		try {
			data = JSON.parse(message);
		} catch (err) {
			sourceSocket.send(JSON.stringify({ error: 'InfrastructureError: Invalid JSON format.' }));
			return;
		}

		// Validate required fields.
		if (!data.characterId || typeof data.characterId !== 'string' || !data.command || typeof data.command !== 'string') {
			sourceSocket.send(JSON.stringify({ error: 'InfrastructureError: Missing or invalid characterId or command.' }));
			return;
		}

		const animateDto: CharacterCommandDTO = {
			characterId: data.characterId,
			command: parseCommand(data.command),
		};

		try {
			const animateCharacter = new AnimateCharacter(this.sessionRepository);
			const updatedCharacter = await animateCharacter.execute(animateDto);

			this.logCharacterState(updatedCharacter);

			this.broadcast(
				JSON.stringify({
					type: 'character_update',
					characterId: updatedCharacter.id,
					status: updatedCharacter.status,
				}),
			);
		} catch (err: any) {
			sourceSocket.send(JSON.stringify({ error: `${err.type}: ${err.message}` }));
		}
	}

	private broadcast(message: string): void {
		for (const client of this.clients) {
			try {
				client.send(message);
			} catch (err) {
				console.error('InfrastructureError: Error broadcasting message:', err);
				this.clients.delete(client);
			}
		}
	}

	private async logCharacterState(character: Character): Promise<void> {
		const timestamp = Date.now();
		const key = `character-log-${character.id}-${timestamp}`;
		const logData = {
			character: {
				id: character.id,
				name: character.name,
				status: character.status,
			},
			timestamp: new Date(timestamp).toISOString(),
		};

		await this.env.ANIMATION_KV.put(key, JSON.stringify(logData));
	}
}

export function parseCommand(commandStr: string): AnimateCharacterCommand {
	const lowerCommand = commandStr.toLowerCase();
	switch (lowerCommand) {
		case AnimateCharacterCommand.Start:
			return AnimateCharacterCommand.Start;
		case AnimateCharacterCommand.Stop:
			return AnimateCharacterCommand.Stop;
		case AnimateCharacterCommand.Rotate:
			return AnimateCharacterCommand.Rotate;
		case AnimateCharacterCommand.Move:
			return AnimateCharacterCommand.Move;
		case AnimateCharacterCommand.Reset:
			return AnimateCharacterCommand.Reset;
		default:
			throw new InfrastructureError(`Invalid command: ${commandStr}`);
	}
}
