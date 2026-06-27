import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class Periskop implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Periskop',
		name: 'periskop',
		icon: 'file:periskop.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ "Run Shopping Discovery" }}',
		description:
			'Product discovery for AI agents and workflows — turn a shopping prompt into structured product results. Discovery only: no checkout, payments, or stock reservation.',
		defaults: {
			name: 'Periskop',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'periskopApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Run Shopping Discovery',
						value: 'runShoppingDiscovery',
						action: 'Run a shopping discovery from a prompt',
						description: 'Turn a natural-language shopping prompt into structured product results',
					},
				],
				default: 'runShoppingDiscovery',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				required: true,
				placeholder: 'best desk chair under 60€',
				description: 'Natural-language shopping intent. The only required field.',
				displayOptions: {
					show: { operation: ['runShoppingDiscovery'] },
				},
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{ name: 'Simple', value: 'simple' },
					{ name: 'Full', value: 'full' },
				],
				default: 'simple',
				description:
					'Simple returns a compact, easy-to-render shape (recommended). Full returns the complete contract.',
				displayOptions: {
					show: { operation: ['runShoppingDiscovery'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { operation: ['runShoppingDiscovery'] },
				},
				options: [
					{
						displayName: 'Constraints (JSON)',
						name: 'constraints',
						type: 'json',
						default: '',
						description:
							'Optional constraints, e.g. {"max_price": 200, "optimization": "best_quality"}',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'PT',
						description: 'ISO country code. Defaults to the account default.',
					},
					{
						displayName: 'Currency',
						name: 'currency',
						type: 'string',
						default: '',
						placeholder: 'EUR',
						description: 'ISO currency code. Defaults to the account default.',
					},
					{
						displayName: 'External User ID',
						name: 'externalUserId',
						type: 'string',
						default: '',
						description: 'Your end-user identifier, for your own analytics',
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: '',
						placeholder: 'en',
						description: 'BCP 47 language tag',
					},
					{
						displayName: 'Max Results',
						name: 'maxResults',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 50 },
						default: 3,
						description: 'Maximum number of products to return (1-50)',
					},
					{
						displayName: 'Mode',
						name: 'mode',
						type: 'options',
						options: [
							{ name: 'Auto', value: 'auto' },
							{ name: 'Best', value: 'best' },
							{ name: 'Browse', value: 'browse' },
							{ name: 'Bundle', value: 'bundle' },
							{ name: 'Recommend', value: 'recommend' },
						],
						default: 'auto',
						description: 'Discovery mode. Leave on Auto to let Periskop infer it.',
					},
					{
						displayName: 'Previous Result ID',
						name: 'previousResultId',
						type: 'string',
						default: '',
						description: 'Optional prior result ID for follow-up discovery',
					},
					{
						displayName: 'Store',
						name: 'store',
						type: 'string',
						default: '',
						description: 'Store ID or natural store hint to scope the search',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// requestDefaults.baseURL is only resolved for declarative routing, not for
		// programmatic httpRequestWithAuthentication calls. Build an absolute URL here
		// so the final request URL is always valid.
		const credentials = await this.getCredentials('periskopApi');
		const baseUrl = String(credentials.baseUrl || 'https://mcp.periskop.ai').replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				if (operation !== 'runShoppingDiscovery') {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}

				const prompt = (this.getNodeParameter('prompt', i) as string).trim();
				if (!prompt) {
					throw new NodeOperationError(this.getNode(), 'Prompt is required.', { itemIndex: i });
				}

				const responseFormat = this.getNodeParameter('responseFormat', i) as string;
				const additional = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

				const body: IDataObject = {
					prompt,
					response_format: responseFormat,
				};

				if (additional.country) body.country = additional.country;
				if (additional.currency) body.currency = additional.currency;
				if (additional.language) body.language = additional.language;
				if (additional.mode && additional.mode !== 'auto') body.mode = additional.mode;
				if (additional.maxResults) body.max_results = additional.maxResults;
				if (additional.store) body.store = additional.store;
				if (additional.externalUserId) body.external_user_id = additional.externalUserId;
				if (additional.previousResultId) body.previous_result_id = additional.previousResultId;

				if (additional.constraints) {
					let constraints = additional.constraints;
					if (typeof constraints === 'string' && constraints.trim() !== '') {
						try {
							constraints = JSON.parse(constraints);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Constraints must be valid JSON.',
								{ itemIndex: i },
							);
						}
					}
					if (constraints && typeof constraints === 'object') {
						body.constraints = constraints;
					}
				}

				const options: IHttpRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `${baseUrl}/v1/mcp/shopping/discover`,
					body,
					json: true,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'periskopApi',
					options,
				);

				returnData.push({
					json: response as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
