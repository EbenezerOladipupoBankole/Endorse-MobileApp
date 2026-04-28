import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { Text, View } from '@/components/Themed';
import { User, Shield, CreditCard, Bell, Moon, Globe, LogOut, ChevronRight, HelpCircle, FileText, Signature } from 'lucide-react-native';
import { router } from 'expo-router';
import { auth } from '@/lib/firebase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface SettingItem {
  icon: any;
  label: string;
  color: string;
  value?: string;
  badge?: string;
  right?: React.ReactNode;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const isDark = colorScheme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Information', color: '#3B82F6' },
        { icon: Signature, label: 'Digital Signature', color: '#8B5CF6', value: 'Saved' }, // Added this
        { icon: Shield, label: 'Security & Password', color: '#F43F5E' },
        { icon: CreditCard, label: 'Plans & Billing', color: '#10B981', badge: 'Pro' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', color: '#F59E0B', right: <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#767577', true: '#2563EB' }} /> },
        { icon: Globe, label: 'Language', color: '#8B5CF6', value: 'English (US)' },
      ]
    },
    {
      title: 'Support & Legal',
      items: [
        { icon: HelpCircle, label: 'Help Center', color: '#6B7280' },
        { icon: FileText, label: 'Privacy Policy', color: '#6B7280' },
        { icon: FileText, label: 'Terms of Service', color: '#6B7280' },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitials}>
              {(auth.currentUser?.displayName || 'User').split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{auth.currentUser?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{auth.currentUser?.email || 'user@endorse.com'}</Text>
          </View>
          <TouchableOpacity style={[styles.proBadge, { borderColor: tint }]}>
            <Text style={[styles.proBadgeText, { color: tint }]}>PRO</Text>
          </TouchableOpacity>
        </View>

        {/* Setting Sections */}
        {sections.map((section, sIndex) => (
          <View key={sIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.itemsWrapper}>
              {section.items.map((item, iIndex) => (
                <TouchableOpacity 
                  key={iIndex} 
                  style={styles.itemRow} 
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.label === 'Digital Signature') {
                      router.push('/modal');
                    }
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                  {item.badge && <View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{item.badge}</Text></View>}
                  {item.right ? item.right : <ChevronRight size={18} color="#D1D5DB" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (Build 54)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(150,150,150,0.05)',
    marginBottom: 32,
    gap: 16,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFC83D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  profileInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.4,
    fontWeight: '600',
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    marginBottom: 12,
    marginLeft: 4,
  },
  itemsWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  itemValue: {
    fontSize: 14,
    opacity: 0.4,
    fontWeight: '600',
    marginRight: 4,
  },
  itemBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 4,
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    marginTop: 12,
    marginBottom: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.3,
    fontWeight: '700',
  },
});
