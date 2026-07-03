import { Redirect } from 'expo-router'
import { Button, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

export default function Home() {
	const { isAuthenticated, email, signOut } = useAuth()

	if (!isAuthenticated) {
		return <Redirect href='/login' />
	}

	return (
		<YStack flex={1} alignItems='center' justifyContent='center' backgroundColor='$background' gap='$4'>
			<Text fontSize='$6' fontWeight='bold' color='$color'>
				Riftbound
			</Text>
			<Text fontSize='$4' color='$color'>
				Hello World
			</Text>
			<Text fontSize='$3' color='$color'>
				Signed in as {email}
			</Text>
			<Button onPress={() => signOut()}>Log out</Button>
		</YStack>
	)
}
