import React, { useEffect, useState } from 'react';
import { Center, Box, Button, Image, VStack, Text, Spinner } from 'native-base';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleSignIn(authentication);
    }
  }, [response]);

  const handleSignIn = async (authentication) => {
    setIsLoading(true);
    const { accessToken } = authentication;
    const credential = GoogleAuthProvider.credential(null, accessToken);
    try {
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;
      if (!userDoc.exists()) {
        // Create a new group
        const groupsCollectionRef = collection(db, 'groups');
        const newGroupRef = await addDoc(groupsCollectionRef, {
          name: `${user.displayName}'s Group`,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });

        // Create user document with the new group ID
        userData = {
          email: user.email,
          name: user.displayName,
          groups: [newGroupRef.id],
        };
        await setDoc(userDocRef, userData);
      } else {
        userData = userDoc.data();
      }

      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      navigation.replace('Main');
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center flex={1} bg="primary.50">
      <VStack space={5} alignItems="center">
        <Image 
          source={require('../../assets/fridgly-logo.png')} 
          alt="Fridgly Logo"
          size="xl"
        />
        <Text fontSize="3xl" fontWeight="bold" color="primary.500">
          Welcome to Fridgly
        </Text>
        <Text fontSize="md" textAlign="center" color="gray.600" px={4}>
          Keep track of your food and reduce waste
        </Text>
        {isLoading ? (
          <Spinner size="lg" color="primary.500" />
        ) : (
          <Button
            onPress={() => promptAsync()}
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            _text={{ color: 'white' }}
            startIcon={
              <Image 
                source={require('../../assets/google-logo.png')} 
                alt="Google Logo"
                size="xs"
                mr={2}
              />
            }
          >
            Sign in with Google
          </Button>
        )}
      </VStack>
    </Center>
  );
}