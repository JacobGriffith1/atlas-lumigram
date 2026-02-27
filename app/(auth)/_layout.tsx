import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;

  return <Stack screenOptions={{ headerTitleAlign: 'center' }} />;
}
