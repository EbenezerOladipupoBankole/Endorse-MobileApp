import React, { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { router } from 'expo-router';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function SignatureModal() {
  const ref = useRef<SignatureViewRef>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleOK = (signature: string) => {
    console.log('Signature saved:', signature);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    setHasSignature(false);
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  const handleEnd = () => {
  };

  const style = `
    .m-signature-pad--footer {display: none; margin: 0px;}
    body,html {height: 100%;}
  `;

  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
          style={styles.closeButton}
        >
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Digital Signature</Text>
        <TouchableOpacity 
          onPress={() => ref.current?.readSignature()} 
          style={[styles.saveButton, { opacity: hasSignature ? 1 : 0.5 }]}
          disabled={!hasSignature}
        >
          <Check size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={ref}
          onOK={handleOK}
          onClear={handleClear}
          onBegin={handleBegin}
          onEnd={handleEnd}
          descriptionText="Sign here"
          webStyle={style}
          autoClear={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <RotateCcw size={20} color="#EF4444" />
          <Text style={styles.clearText}>Clear Signature</Text>
        </TouchableOpacity>
        <Text style={styles.instruction}>Rotate your phone for more space</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  saveButton: {
    padding: 8,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    marginBottom: 16,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  instruction: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
