import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Mail, User, FileText, Send, ChevronDown, MessageSquare } from 'lucide-react-native';

export default function InviteSignerScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Signature Request: Agreement for Review');
  const [message, setMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('Service_Agreement_Draft.pdf');

  const handleSendInvite = () => {
    // Logic to send invite would go here
    router.replace({
      pathname: '/(tabs)/home',
      params: { success: 'true', message: 'Invite sent to ' + email }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} 
          style={styles.closeButton}
        >
          <X size={28} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite a Signer</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introBox}>
            <Text style={styles.introText}>
              Send a secure link to someone who needs to sign a document. They don't need an account.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Signer's Name</Text>
            <View style={styles.inputBox}>
              <User size={20} color="#94A3B8" />
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full name of the signer"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Signer's Email</Text>
            <View style={styles.inputBox}>
              <Mail size={20} color="#94A3B8" />
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
            <Text style={styles.label}>Select Document</Text>
            <TouchableOpacity style={styles.selectBox} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <FileText size={20} color="#94A3B8" />
                <Text style={styles.selectText}>{selectedDoc}</Text>
              </View>
              <ChevronDown size={20} color="#1E1B4B" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Subject</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="What should the email say?"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Message (Optional)</Text>
            <View style={[styles.inputBox, styles.textArea]}>
              <MessageSquare size={20} color="#94A3B8" style={{ marginTop: 12 }} />
              <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Add a friendly note..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleSendInvite}
            activeOpacity={0.8}
          >
            <Send size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Send Signature Invite</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  introBox: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  introText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 22,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  textArea: {
    height: 120,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '500',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
  },
  selectText: {
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 32,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#4F46E5', 
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
