// TextBee SMS utility
// Provides a reusable function to send SMS via TextBee Gateway API

/**
 * Sends an SMS using the TextBee Gateway API.
 *
 * Required env vars (Vite):
 * - VITE_TEXTBEE_API_KEY: Your TextBee API key
 * - VITE_TEXTBEE_DEVICE_ID: Default device ID to use (can be overridden per call)
 * - VITE_TEXTBEE_BASE_URL (optional): Defaults to https://api.textbee.dev
 *
 * Note: Calling the TextBee API directly from the browser will expose your API key
 * to anyone with access to the built files or network requests. Prefer routing this
 * through a secure backend if possible.
 */
export async function sendTextBeeSms({
	recipients,
	message,
	deviceId,
	apiKey,
	baseUrl,
	timeoutMs = 20000,
}) {
	const resolvedApiKey = apiKey ?? import.meta.env.VITE_TEXTBEE_API_KEY;
	const resolvedDeviceId = deviceId ?? import.meta.env.VITE_TEXTBEE_DEVICE_ID;
	const resolvedBaseUrl = (baseUrl ?? import.meta.env.VITE_TEXTBEE_BASE_URL ?? 'https://api.textbee.dev').replace(/\/$/, '');

	if (!resolvedApiKey) {
		throw new Error('TextBee API key is missing. Set VITE_TEXTBEE_API_KEY.');
	}
	if (!resolvedDeviceId) {
		throw new Error('TextBee Device ID is missing. Provide deviceId or set VITE_TEXTBEE_DEVICE_ID.');
	}
	if (!message || typeof message !== 'string') {
		throw new Error('Message is required and must be a non-empty string.');
	}

	let normalizedRecipients;
	if (Array.isArray(recipients)) {
		normalizedRecipients = recipients;
	} else if (typeof recipients === 'string') {
		normalizedRecipients = [recipients];
	} else {
		throw new Error('Recipients must be a string phone number or an array of them.');
	}

	if (normalizedRecipients.length === 0) {
		throw new Error('At least one recipient is required.');
	}

	const url = `${resolvedBaseUrl}/api/v1/gateway/devices/${encodeURIComponent(resolvedDeviceId)}/send-sms`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': resolvedApiKey,
			},
			body: JSON.stringify({
				recipients: normalizedRecipients,
				message,
			}),
			signal: controller.signal,
		});

		const contentType = response.headers.get('content-type') || '';
		const isJson = contentType.includes('application/json');
		const data = isJson ? await response.json() : await response.text();

		if (!response.ok) {
			const errorMessage = isJson && data && data.message ? data.message : `HTTP ${response.status}`;
			const error = new Error(`TextBee send failed: ${errorMessage}`);
			error.status = response.status;
			error.data = data;
			throw error;
		}

		return { ok: true, status: response.status, data };
	} catch (error) {
		if (error.name === 'AbortError') {
			throw new Error('TextBee request timed out.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Convenience helper that ensures E.164 format for a single recipient.
 */
export async function sendSingleSms({ recipient, message, deviceId, apiKey, baseUrl, timeoutMs }) {
	if (!recipient || typeof recipient !== 'string') {
		throw new Error('recipient must be a non-empty string in E.164 format, e.g. +1234567890');
	}
	return sendTextBeeSms({ recipients: [recipient], message, deviceId, apiKey, baseUrl, timeoutMs });
}
