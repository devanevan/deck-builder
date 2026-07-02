import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { User } from '@riftbound/shared'
import { dynamoClient } from '../lib/dynamoClient'

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
	const userId = event.requestContext.authorizer.jwt.claims.sub as string

	if (!event.body) {
		return { statusCode: 400, body: JSON.stringify({ message: 'Missing request body' }) }
	}

	const updates = JSON.parse(event.body) as Partial<Pick<User, 'username'>>

	if (!updates.username) {
		return { statusCode: 400, body: JSON.stringify({ message: 'Missing username' }) }
	}

	const result = await dynamoClient.send(
		new UpdateCommand({
			TableName: process.env.USERS_TABLE,
			Key: { id: userId },
			UpdateExpression: 'SET username = :username',
			ExpressionAttributeValues: { ':username': updates.username },
			ReturnValues: 'ALL_NEW',
		}),
	)

	return { statusCode: 200, body: JSON.stringify(result.Attributes as User) }
}
