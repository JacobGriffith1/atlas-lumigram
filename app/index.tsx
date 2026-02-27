import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth';

export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
