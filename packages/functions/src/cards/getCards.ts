import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { Card } from '@deck-builder/shared'
import { dynamoClient } from '../lib/dynamoClient'

async function queryByIndex(indexName: string, keyName: string, keyValue: string): Promise<Card[]> {
	const items: Card[] = []
	let exclusiveStartKey: Record<string, unknown> | undefined

	do {
		const result = await dynamoClient.send(
			new QueryCommand({
				TableName: process.env.CARDS_TABLE,
				IndexName: indexName,
				KeyConditionExpression: '#key = :value',
				ExpressionAttributeNames: { '#key': keyName },
				ExpressionAttributeValues: { ':value': keyValue },
				ExclusiveStartKey: exclusiveStartKey,
			}),
		)
		items.push(...((result.Items as Card[]) ?? []))
		exclusiveStartKey = result.LastEvaluatedKey
	} while (exclusiveStartKey)

	return items
}

async function scanAll(): Promise<Card[]> {
	const items: Card[] = []
	let exclusiveStartKey: Record<string, unknown> | undefined

	do {
		const result = await dynamoClient.send(
			new ScanCommand({
				TableName: process.env.CARDS_TABLE,
				ExclusiveStartKey: exclusiveStartKey,
			}),
		)
		items.push(...((result.Items as Card[]) ?? []))
		exclusiveStartKey = result.LastEvaluatedKey
	} while (exclusiveStartKey)

	return items
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	const type = event.queryStringParameters?.type
	const setId = event.queryStringParameters?.setId

	let cards: Card[]
	if (type) {
		cards = await queryByIndex('TypeIndex', 'cardType', type)
	} else if (setId) {
		cards = await queryByIndex('SetIndex', 'setId', setId)
	} else {
		cards = await scanAll()
	}

	return { statusCode: 200, body: JSON.stringify(cards) }
}
