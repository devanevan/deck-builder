import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { Deck } from '@riftbound/shared'
import { dynamoClient } from '../lib/dynamoClient'

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
	const userId = event.requestContext.authorizer.jwt.claims.sub as string

	const result = await dynamoClient.send(
		new QueryCommand({
			TableName: process.env.DECKS_TABLE,
			KeyConditionExpression: 'userId = :userId',
			ExpressionAttributeValues: { ':userId': userId },
		}),
	)

	const decks = result.Items as Deck[]
	return { statusCode: 200, body: JSON.stringify(decks) }
}
