import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { Card } from '@deck-builder/shared'
import { dynamoClient } from '../lib/dynamoClient'

const RIFTCODEX_BASE_URL = 'https://api.riftcodex.com'
const PAGE_SIZE = 100
const BATCH_WRITE_LIMIT = 25

interface RiftcodexCard {
	id: string
	name: string
	riftbound_id: string
	tcgplayer_id: string | null
	collector_number: number
	attributes: { energy: number | null; might: number | null; power: number | null }
	classification: {
		type: Card['classification']['type']
		supertype: string | null
		rarity: string
		domain: Card['classification']['domain']
	}
	text: { rich: string; plain: string; flavour: string | null }
	set: { set_id: string; label: string }
	media: { image_url: string; artist: string; accessibility_text: string }
	tags: string[]
	orientation: string
	metadata: {
		clean_name: string
		updated_on: string | null
		alternate_art: boolean
		overnumbered: boolean
		signature: boolean
	}
}

interface RiftcodexCardPage {
	items: RiftcodexCard[]
	total: number
	page: number
	size: number
	pages: number
}

function toCard(raw: RiftcodexCard): Card {
	return {
		id: raw.id,
		name: raw.name,
		riftboundId: raw.riftbound_id,
		tcgplayerId: raw.tcgplayer_id,
		collectorNumber: raw.collector_number,
		attributes: raw.attributes,
		classification: raw.classification,
		text: raw.text,
		set: { setId: raw.set.set_id, label: raw.set.label },
		media: {
			imageUrl: raw.media.image_url,
			artist: raw.media.artist,
			accessibilityText: raw.media.accessibility_text,
		},
		tags: raw.tags,
		orientation: raw.orientation,
		metadata: {
			cleanName: raw.metadata.clean_name,
			updatedOn: raw.metadata.updated_on,
			alternateArt: raw.metadata.alternate_art,
			overnumbered: raw.metadata.overnumbered,
			signature: raw.metadata.signature,
		},
	}
}

async function fetchAllCards(): Promise<Card[]> {
	const cards: Card[] = []
	let page = 1
	let totalPages = 1

	do {
		const response = await fetch(`${RIFTCODEX_BASE_URL}/cards?page=${page}&size=${PAGE_SIZE}`)
		if (!response.ok) {
			throw new Error(`Riftcodex request failed: ${response.status} ${response.statusText}`)
		}
		const data = (await response.json()) as RiftcodexCardPage
		cards.push(...data.items.map(toCard))
		totalPages = data.pages
		page += 1
	} while (page <= totalPages)

	return cards
}

function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size))
	}
	return chunks
}

// Flatten a couple of fields to the item's top level so DynamoDB GSIs can
// key on them directly (GSI keys must be top-level scalar attributes).
function toItem(card: Card) {
	return { ...card, cardType: card.classification.type, setId: card.set.setId }
}

export async function syncCards(): Promise<{ synced: number }> {
	const cards = await fetchAllCards()
	const tableName = process.env.CARDS_TABLE

	for (const batch of chunk(cards, BATCH_WRITE_LIMIT)) {
		await dynamoClient.send(
			new BatchWriteCommand({
				RequestItems: {
					[tableName as string]: batch.map((card) => ({
						PutRequest: { Item: toItem(card) },
					})),
				},
			}),
		)
	}

	return { synced: cards.length }
}

export const handler = async () => {
	const result = await syncCards()
	console.log(`Synced ${result.synced} cards from Riftcodex`)
	return result
}
