import { supabase } from '@/lib/supabase';
import { Tabs } from 'expo-router';
import {
  BadgePercent,
  Landmark,
  Map,
  Store,
  Wrench,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';

type Role = 'buyer' | 'seller' | 'admin' | null;

export default function TabsLayout() {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          setRole(null);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role_prf')
          .eq('id_prf', userId)
          .single();
        setRole(profile?.role_prf ?? null);
      } catch (e) {
        setRole(null);
      }
    };

    load();
  }, []);

  const showManage = role === 'seller';

  return (
    <Tabs
      initialRouteName="businesses"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Comercios',
          tabBarIcon: ({ color, size }) => (
            <Store color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="attractions"
        options={{
          title: 'Atracciones',
          tabBarIcon: ({ color, size }) => (
            <Landmark color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promociones',
          tabBarIcon: ({ color, size }) => (
            <BadgePercent color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="maps"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Map color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen name="products" options={{ href: null }} />

      <Tabs.Screen
        name="manage"
        options={{
          href: showManage ? undefined : null,
          title: 'Gestionar',
          tabBarIcon: ({ color, size }) => (
            <Wrench color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
