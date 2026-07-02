import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import type { User } from '@riftbound/shared'
import { dynamoClient } from '../lib/dynamoClient'

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
	const userId = event.requestContext.authorizer.jwt.claims.sub as string

	const result = await dynamoClient.send(
		new GetCommand({
			TableName: process.env.USERS_TABLE,
			Key: { id: userId },
		}),
	)

	if (!result.Item) {
		return { statusCode: 404, body: JSON.stringify({ message: 'User was not found' }) }
	}

	const user = result.Item as User
	return { statusCode: 200, body: JSON.stringify(user) }
}
