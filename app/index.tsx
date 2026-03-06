import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/contexts/auth';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <View />; // tiny blank placeholder while Firebase checks session

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
