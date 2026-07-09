export type Domain = 'Body' | 'Calm' | 'Chaos' | 'Colorless' | 'Fury' | 'Mind' | 'Order'

export type CardType = 'Battlefield' | 'Gear' | 'Legend' | 'Rune' | 'Spell' | 'Unit'

export interface Card {
	id: string
	name: string
	riftboundId: string
	tcgplayerId: string | null
	collectorNumber: number
	attributes: {
		energy: number | null
		might: number | null
		power: number | null
	}
	classification: {
		type: CardType
		supertype: string | null
		rarity: string
		domain: Domain[]
	}
	text: {
		rich: string
		plain: string
		flavour: string | null
	}
	set: {
		setId: string
		label: string
	}
	media: {
		imageUrl: string
		artist: string
		accessibilityText: string
	}
	tags: string[]
	orientation: string
	metadata: {
		cleanName: string
		updatedOn: string | null
		alternateArt: boolean
		overnumbered: boolean
		signature: boolean
	}
}
