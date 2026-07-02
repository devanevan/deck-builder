import { TamaguiProvider, Text, YStack } from 'tamagui'
import { StatusBar } from 'expo-status-bar'
import config from './tamagui.config'

export default function App() {
	return (
		<TamaguiProvider config={config}>
			<YStack flex={1} alignItems='center' justifyContent='center' backgroundColor='$background'>
				<Text fontSize='$6' fontWeight='bold' color='$color'>
					Riftbound
				</Text>
				<Text fontSize='$4' color='$color'>
					Hello World
				</Text>
				<StatusBar style='auto' />
			</YStack>
		</TamaguiProvider>
	)
}
