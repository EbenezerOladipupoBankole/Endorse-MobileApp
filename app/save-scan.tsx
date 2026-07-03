import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Dimensions, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Share2, FileText, CheckCircle2, PenTool } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

export default function SaveScanScreen() {
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const filter = params.filter as string; // color or bw

  const { user } = useAuth();
  const [documentName, setDocumentName] = useState('Scanned_Document_' + Date.now().toString().slice(-6));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedPdfUri, setSavedPdfUri] = useState<string | null>(null);

  const generatePDF = async () => {
    let base64Image = '';
    try {
      base64Image = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
    } catch (e) {
      console.error("Failed to read image as base64", e);
      Alert.alert('Error', 'Failed to load image for PDF.');
      return null;
    }

    // Basic HTML to wrap the image full-page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
            img { width: 100%; height: 100%; object-fit: contain; ${filter === 'bw' ? 'filter: grayscale(100%) contrast(1.2);' : ''} }
          </style>
        </head>
        <body>
          <img src="data:image/jpeg;base64,${base64Image}" />
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      return uri;
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate PDF.');
      return null;
    }
  };

  const handleSave = async () => {
    if (!imageUri) return;
    setIsProcessing(true);
    
    try {
      const pdfUri = await generatePDF();
      if (!pdfUri) {
        setIsProcessing(false);
        return;
      }

      // Copy PDF to a permanent local directory so it doesn't get wiped from cache
      const permanentFilename = `${documentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
      const permanentLocalUri = `${FileSystem.documentDirectory}${permanentFilename}`;
      await FileSystem.copyAsync({
        from: pdfUri,
        to: permanentLocalUri
      });

      let finalUrl = permanentLocalUri;
      
      // Attempt Firebase Storage Upload if user is logged in
      if (user) {
        try {
          const response = await fetch(pdfUri);
          const blob = await response.blob();
          const storageRef = ref(storage, `documents/${user.uid}/${permanentFilename}`);
          await uploadBytes(storageRef, blob);
          finalUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.warn("Firebase Storage upload failed, falling back to local URI", uploadError);
        }
      }

      // Save record to Firestore
      if (user) {
        await addDoc(collection(db, 'endorsements'), {
          signerId: user.uid,
          documentName: documentName,
          status: 'Pending',
          createdAt: Date.now(),
          fileUri: finalUrl,
          localUri: permanentLocalUri,
          size: '1.2 MB', // estimate
        });
      } else {
        console.log("No user logged in, saved locally at", permanentLocalUri);
      }

      setSavedPdfUri(permanentLocalUri);
      setIsSaved(true);
      Alert.alert('Saved!', `Your document has been saved as ${documentName}.pdf`);
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert('Error', 'Failed to save document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    setIsProcessing(true);
    const pdfUri = await generatePDF();
    if (pdfUri) {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(pdfUri, {
          dialogTitle: `Share ${documentName}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    }
    setIsProcessing(false);
  };

  if (isSaved) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successState}>
          <CheckCircle2 color="#10B981" size={64} style={{ marginBottom: 20 }} />
          <Text style={styles.successTitle}>Scan Saved Successfully</Text>
          <Text style={styles.successSubtitle}>You can find {documentName}.pdf in your documents.</Text>
          
          <View style={styles.successActions}>
            <TouchableOpacity 
              style={styles.shareBtn} 
              onPress={() => router.push({
                pathname: '/sign/[id]',
                params: {
                  id: 'new',
                  name: `${documentName}.pdf`,
                  uri: savedPdfUri || imageUri
                }
              })}
            >
              <PenTool color="#FFF" size={20} />
              <Text style={styles.shareBtnText}>Sign Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
              <Share2 color="#4F46E5" size={20} />
              <Text style={styles.secondaryBtnText}>Share Document</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#1E1B4B" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save Scan</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Document Preview Thumbnail */}
        <View style={styles.previewCard}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.previewThumb} 
            resizeMode="cover"
          />
          {filter === 'bw' && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />}
          <View style={styles.previewInfo}>
            <Text style={styles.previewFormat}>PDF Document</Text>
            <Text style={styles.previewSize}>1 Page • ~1.2 MB</Text>
          </View>
        </View>

        {/* Naming Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Document Name</Text>
          <View style={styles.inputContainer}>
            <FileText color="#94A3B8" size={20} />
            <TextInput 
              style={styles.input}
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="Enter document name"
              autoFocus
            />
            <Text style={styles.extension}>.pdf</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handleSave}
          disabled={isProcessing}
        >
          {isProcessing ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Save color="#FFF" size={20} />
              <Text style={styles.primaryBtnText}>Save to Documents</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={handleShare}
          disabled={isProcessing}
        >
          <Share2 color="#4F46E5" size={20} />
          <Text style={styles.secondaryBtnText}>Share via App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  previewThumb: {
    width: 64,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  previewInfo: {
    flex: 1,
  },
  previewFormat: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1B4B',
  },
  extension: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1B4B',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  doneBtnText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },
});
