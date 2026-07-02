export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type CardType = 'creature' | 'spell' | 'artifact' | 'land'

export interface Card {
	id: string
	name: string
	type: CardType
	rarity: CardRarity
	cost: number
	attack?: number
	defense?: number
	description: string
	imageUrl?: string
	createdAt: string
	updatedAt: string
}
