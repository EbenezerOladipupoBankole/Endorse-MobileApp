import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, KeyboardAvoidingView, ScrollView, Platform, FlatList, Modal } from 'react-native';
import { router } from 'expo-router';
import { X, ChevronDown, Check, Search } from 'lucide-react-native';
import { Logo } from '@/components/Logo';

const countries = [
  'Nigeria', 'United States', 'United Kingdom', 'Canada', 'Ghana', 'South Africa', 
  'United Arab Emirates', 'Australia', 'Germany', 'France', 'India', 'Brazil'
];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('Ebenezer');
  const [lastName, setLastName] = useState('Bankole');
  const [email, setEmail] = useState('bankoleebenezer@gmail.com');
  const [country, setCountry] = useState('Nigeria');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRegister = () => {
    router.replace('/(tabs)');
  };

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View /> 
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
            style={styles.closeBtn}
          >
            <X size={28} color="#1E1B4B" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of professionals on Endorse</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.helperText}>All fields required *</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country *</Text>
            <TouchableOpacity 
              style={styles.selectBox} 
              activeOpacity={0.7}
              onPress={() => setIsCountryModalOpen(true)}
            >
              <Text style={styles.selectText}>{country}</Text>
              <ChevronDown size={20} color="#1E1B4B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Free Account</Text>
          </TouchableOpacity>

          <Text style={styles.footerLegal}>
            By selecting Create Free Account, you agree to the <Text style={styles.link}>Terms and Conditions</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Selection Modal */}
      <Modal visible={isCountryModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setIsCountryModalOpen(false)}>
              <X size={24} color="#1E1B4B" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
             <Search size={18} color="#94A3B8" />
             <TextInput 
               style={styles.modalSearchInput}
               placeholder="Search countries..."
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item}
            contentContainerStyle={{ padding: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.countryRow} 
                onPress={() => {
                  setCountry(item);
                  setIsCountryModalOpen(false);
                }}
              >
                <Text style={[styles.countryText, country === item && styles.countryTextActive]}>{item}</Text>
                {country === item && <Check size={20} color="#4F46E5" />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -10,
  },
  closeBtn: {
    padding: 8,
  },
  headerTextContainer: {
    marginTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  helperText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 24,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 8,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '500',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
  },
  selectText: {
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4F46E5', 
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerLegal: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  link: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  /* Modal Styles */
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 50,
    backgroundColor: '#F8FAFC',
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E1B4B',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  countryText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  countryTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
});
