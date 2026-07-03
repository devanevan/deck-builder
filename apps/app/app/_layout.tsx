import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { TamaguiProvider, Text, YStack } from 'tamagui'

import { AuthProvider, useAuth } from '../src/auth/AuthContext'
import config from '../tamagui.config'

function RootNavigator() {
	const { isLoading } = useAuth()

	if (isLoading) {
		return (
			<YStack flex={1} alignItems='center' justifyContent='center' backgroundColor='$background'>
				<Text color='$color'>Loading…</Text>
			</YStack>
		)
	}

	return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
	return (
		<TamaguiProvider config={config}>
			<AuthProvider>
				<RootNavigator />
			</AuthProvider>
			<StatusBar style='auto' />
		</TamaguiProvider>
	)
}
