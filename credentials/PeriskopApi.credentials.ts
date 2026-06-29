import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PeriskopApi implements ICredentialType {
	name = 'periskopApi';

	displayName = 'Periskop API';

	documentationUrl = 'https://periskop.ai/developer';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Periskop API key (starts with dp_). Create one at https://periskop.ai/developer/keys. The node adds the "Bearer " prefix for you.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://mcp.periskop.ai',
			description: 'Periskop API base URL. Change only for sandbox/self-hosted environments.',
		},
	];

	// Sends Authorization: Bearer <apiKey> on every request.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// Auth-safe, non-billable credential test: listing supported stores does not
	// run a shopping discovery and therefore never burns credits.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/mcp/stores',
			method: 'GET',
		},
	};
}
