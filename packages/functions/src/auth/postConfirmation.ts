import { PutCommand } from '@aws-sdk/lib-dynamodb'
import type { User } from '@riftbound/shared'
import type { PostConfirmationConfirmSignUpTriggerEvent } from 'aws-lambda'

import { dynamoClient } from '../lib/dynamoClient'

export const handler = async (event: PostConfirmationConfirmSignUpTriggerEvent) => {
	const { sub, email } = event.request.userAttributes
	const username = email.split('@')[0]

	const user: User = {
		id: sub,
		email,
		username,
		createdAt: new Date().toISOString(),
	}

	try {
		await dynamoClient.send(
			new PutCommand({
				TableName: process.env.USERS_TABLE,
				Item: user,
				ConditionExpression: 'attribute_not_exists(id)',
			}),
		)
	} catch (error) {
		if ((error as { name?: string }).name !== 'ConditionalCheckFailedException') {
			throw error
		}
	}

	return event
}
