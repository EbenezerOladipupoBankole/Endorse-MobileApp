import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, Animated, Image, Platform, Modal, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, PenTool, Download, Share2, ArrowLeft, RotateCcw, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import SignatureCanvas from 'react-native-signature-canvas';

const { width, height } = Dimensions.get('window');

export default function SignDocumentScreen() {
  const { id, name } = useLocalSearchParams();
  const [isSigned, setIsSigned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(true);

  // Animation for the "Signed" stamp
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleSignature = (signature: string) => {
    setSignatureUri(signature);
    setShowSignPad(false);
    
    setIsProcessing(true);
    // Simulate securing the document
    setTimeout(() => {
      setIsProcessing(false);
      setIsSigned(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  const clearSignPad = () => {
    setSignatureUri(null);
  };

  const openSignPad = () => {
    if (!isSigned) {
      setShowSignPad(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Premium Header */}
      <LinearGradient colors={['#1E1B4B', '#2D286A']} style={styles.header}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
            style={styles.iconButton}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.docName} numberOfLines={1}>{name || 'Service_Agreement.pdf'}</Text>
            <Text style={styles.statusSub}>{isSigned ? 'Digitally Verified' : 'Awaiting Finger Signature'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Document View Area */}
      <View style={styles.canvas}>
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.pageMock} 
          onPress={openSignPad}
        >
          {/* Mock Document Text */}
          <View style={styles.dummyTextRow} />
          <View style={[styles.dummyTextRow, { width: '80%' }]} />
          <View style={[styles.dummyTextRow, { width: '90%' }]} />
          <View style={[styles.dummyTextRow, { marginTop: 40 }]} />
          <View style={styles.dummyTextRow} />
          <View style={[styles.dummyTextRow, { width: '40%' }]} />
          <View style={[styles.dummyTextRow, { marginTop: 60 }]} />

          {/* Signature Placeholder/Result */}
          {!signatureUri && !isSigned && (
            <View style={styles.signaturePlaceholder}>
              <View style={styles.signPulse}>
                <PenTool size={32} color="#4F46E5" />
              </View>
              <Text style={styles.placeholderText}>Tap anywhere to sign with finger</Text>
            </View>
          )}

          {signatureUri && (
            <Animated.View 
              style={[
                styles.signatureResult, 
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
               <Image 
                 source={{ uri: signatureUri }} 
                 style={styles.signatureImage} 
                 resizeMode="contain" 
               />
               {isSigned && (
                 <View style={styles.verifiedStamp}>
                   <Check size={12} color="#FFF" strokeWidth={3} />
                   <Text style={styles.stampText}>VERIFIED</Text>
                 </View>
               )}
            </Animated.View>
          )}

          {isSigned && (
             <View style={styles.auditLog}>
                <Text style={styles.auditText}>SIGNER: Ebenezer Bankole</Text>
                <Text style={styles.auditText}>DATE: {new Date().toLocaleDateString()}</Text>
                <Text style={styles.auditText}>ID: END-{Math.floor(Math.random()*1000000)}</Text>
             </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Global Bottom Actions */}
      <View style={styles.footer}>
        {isProcessing ? (
          <View style={styles.processingState}>
            <Text style={styles.processingText}>Securing cryptographic seal...</Text>
          </View>
        ) : isSigned ? (
          <View style={styles.successActions}>
             <TouchableOpacity style={styles.actionBtn}>
               <Download size={20} color="#4F46E5" />
               <Text style={styles.actionBtnText}>Save PDF</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionBtn}>
               <Share2 size={20} color="#4F46E5" />
               <Text style={styles.actionBtnText}>Share</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={styles.doneBtn} 
               onPress={() => router.replace('/(tabs)')}
             >
               <Text style={styles.doneBtnText}>Finish</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hintText}>Tap the document to open the signature pad</Text>
        )}
      </View>

      {/* REAL Signature Pad Modal */}
      <Modal visible={showSignPad} animationType="slide">
        <SafeAreaView style={styles.signPadContainer}>
          <View style={styles.signPadHeader}>
            <TouchableOpacity onPress={() => setShowSignPad(false)} style={styles.signPadClose}>
              <X size={24} color="#1E1B4B" />
            </TouchableOpacity>
            <Text style={styles.signPadTitle}>Draw your Signature</Text>
            <TouchableOpacity onPress={clearSignPad} style={styles.signPadClose}>
              <RotateCcw size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.signPadWrapper}>
             <SignatureCanvas
                onOK={handleSignature}
                onEmpty={() => Alert.alert('Empty', 'Please provide a signature.')}
                descriptionText="Sign your name clearly using your finger"
                clearText="Clear"
                confirmText="Save"
                webStyle={`.m-signature-pad--footer {display: none; margin: 0;}`}
                autoClear={false}
                imageType="image/png"
             />
          </View>

          <View style={styles.signPadFooter}>
             <TouchableOpacity 
               style={styles.signCancelBtn} 
               onPress={() => setShowSignPad(false)}
             >
               <Text style={styles.signCancelText}>Discard</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={styles.signSaveBtn}
               onPress={() => {
                  // The canvas usually has its own ok button, 
                  // but we trigger it externally if needed via a ref
                  // Here we assume the internal 'Save' trigger
               }}
             >
               <LinearGradient 
                 colors={['#4F46E5', '#6366F1']} 
                 style={styles.signSaveGradient}
               >
                  <Save size={18} color="#FFF" />
                  <Text style={styles.signSaveText}>Apply to Document</Text>
               </LinearGradient>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  docName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statusSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  pageMock: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    height: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    position: 'relative',
  },
  dummyTextRow: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginBottom: 16,
    width: '100%',
  },
  signaturePlaceholder: {
    position: 'absolute',
    bottom: 80,
    left: 32,
    right: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EEF2FF',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  signPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  signatureResult: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    width: 180,
    height: 100,
    justifyContent: 'center',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  verifiedStamp: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stampText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  auditLog: {
    position: 'absolute',
    bottom: 20,
    left: 32,
  },
  auditText: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  hintText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  processingState: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  successActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  doneBtn: {
    flex: 1.2,
    backgroundColor: '#1E1B4B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  /* Sign Pad Modal Styles */
  signPadContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  signPadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  signPadClose: {
    padding: 8,
  },
  signPadTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  signPadWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  signPadFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  signCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  signCancelText: {
    fontWeight: '800',
    color: '#64748B',
  },
  signSaveBtn: {
    flex: 2,
  },
  signSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  signSaveText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
