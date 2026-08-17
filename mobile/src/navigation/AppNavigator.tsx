import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { HospitalsScreen } from '../screens/HospitalsScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { HospitalDetailScreen } from '../screens/HospitalDetailScreen';
import { ServiceDetailScreen } from '../screens/ServiceDetailScreen';
import { EnquiryScreen } from '../screens/EnquiryScreen';
import { SuccessScreen } from '../screens/SuccessScreen';
import { MyRequestsScreen } from '../screens/MyRequestsScreen';
import { GetListedScreen } from '../screens/GetListedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedHospitalsScreen } from '../screens/SavedHospitalsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={{ fontSize: 20, color: focused ? colors.primary : colors.textMuted }}>{icon}</Text>
    </View>
  );
}

function MainTabs() {
  const { isAuthenticated, userEnquiries } = useAuth();
  const { showAlert } = useSweetAlert();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 64,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderColor: colors.borderLight,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <CustomTabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ServicesScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => <CustomTabIcon icon="🩺" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Hospitals"
        component={HospitalsScreen}
        options={{
          tabBarLabel: 'Hospitals',
          tabBarIcon: ({ focused }) => <CustomTabIcon icon="🏥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Requests"
        component={MyRequestsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ focused }) => <CustomTabIcon icon="📋" focused={focused} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              showAlert({
                title: 'Login Required',
                message: 'Please login first to view your requests.',
                type: 'warning',
                confirmText: 'Login',
                cancelText: 'Cancel',
                onConfirm: () => navigation.navigate('Auth'),
              });
            } else if (userEnquiries.length === 0) {
              e.preventDefault();
              showAlert({
                title: 'No Requests',
                message: "You haven't submitted any consultation requests yet.",
                type: 'info',
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <CustomTabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
          <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
          <Stack.Screen name="Enquiry" component={EnquiryScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
          <Stack.Screen name="GetListed" component={GetListedScreen} />
          <Stack.Screen name="SavedHospitals" component={SavedHospitalsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
