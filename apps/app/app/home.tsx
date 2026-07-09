import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import type { Card } from '@deck-builder/shared'
import { Button, Image, Spinner, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

function pickRandom<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)]
}

function RandomCard() {
	const [cards, setCards] = useState<Card[]>([])
	const [card, setCard] = useState<Card | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch(`${process.env.EXPO_PUBLIC_API_URL}/cards`)
			.then((res) => res.json())
			.then((data: Card[]) => {
				setCards(data)
				setCard(pickRandom(data))
			})
			.finally(() => setIsLoading(false))
	}, [])

	if (isLoading) {
		return <Spinner size='large' />
	}

	if (!card) {
		return <Text color='$color'>No cards found</Text>
	}

	return (
		<YStack alignItems='center' gap='$3'>
			<Image source={{ uri: card.media.imageUrl }} width={240} height={335} borderRadius='$4' />
			<Text fontSize='$5' fontWeight='bold' color='$color'>
				{card.name}
			</Text>
			<Button onPress={() => setCard(pickRandom(cards))}>Random Card</Button>
		</YStack>
	)
}

export default function Home() {
	const { isAuthenticated, email, signOut } = useAuth()

	if (!isAuthenticated) {
		return <Redirect href='/login' />
	}

	return (
		<YStack flex={1} alignItems='center' justifyContent='center' backgroundColor='$background' gap='$4'>
			<Text fontSize='$6' fontWeight='bold' color='$color'>
				Deck Builder
			</Text>
			<Text fontSize='$3' color='$color'>
				Signed in as {email}
			</Text>
			<RandomCard />
			<Button onPress={() => signOut()}>Log out</Button>
		</YStack>
	)
}
