export function checkAuth(request: Request): Response | null {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Basic ')) {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
		});
	}

	const base64Credentials = authHeader.substring('Basic '.length);
	let credentials: string;
	try {
		credentials = atob(base64Credentials);
	} catch (error) {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
		});
	}

	const [username, password] = credentials.split(':');
	// For demo purposes, these values was hardcoded
	if (username !== 'admin' || password !== 'admin') {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
		});
	}

	return null;
}
