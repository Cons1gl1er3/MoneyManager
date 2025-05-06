import "../../global.css"
import { Text, View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useGlobalContext } from "../../context/GlobalProvider"
import React from "react"

const AuthLayout = () => {
  const { loading, isLoggedIn } = useGlobalContext();

  if (!loading && isLoggedIn) return <Redirect href="/home" />;

  return (
    <>
      <Stack>
        <Stack.Screen 
          name='sign-in'
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen 
          name='sign-up'
          options={{
            headerShown: false
          }}
        /> 
      </Stack>

      <StatusBar backgroundColor="#161662"
      style='light' />
    </>
  )
}

export default AuthLayout