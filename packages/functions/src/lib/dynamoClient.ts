import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient(
	process.env.IS_OFFLINE
		? {
				endpoint: 'http://localhost:8000',
				region: 'localhost',
				credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
			}
		: {},
)

export const dynamoClient = DynamoDBDocumentClient.from(client)
