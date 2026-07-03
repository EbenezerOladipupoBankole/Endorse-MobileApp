import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';

const SquiggleIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <Path d="M3 20c4-9 6-11 7.5-6.5S12 21 13.5 18 15 8 17 9.5s2 6 5 4" stroke="#C79320" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <Path d="M2 4h12M12.5 4l-.6 9a1.5 1.5 0 0 1-1.5 1.4H5.6A1.5 1.5 0 0 1 4 13L3.5 4M6 4V2.5A1 1 0 0 1 7 1.5h2a1 1 0 0 1 1 1V4" stroke={T.colors.blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function SignatureSetupScreen() {
  const router = useRouter();
  const signatureRef = useRef<SignatureViewRef>(null);
  
  const [hasSig, setHasSig] = useState(false);
  const [sigTouched, setSigTouched] = useState(false);

  const handleEmpty = () => {
    setHasSig(false);
  };

  const handleOK = (signature: string) => {
    // If it triggers OK, there is a signature
    finish('signup');
  };

  const handleBegin = () => {
    setHasSig(true);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSig(false);
  };

  const submitSig = () => {
    setSigTouched(true);
    if (hasSig) {
      signatureRef.current?.readSignature();
    }
  };

  const finish = (from: string) => {
    router.push({
      pathname: '/(auth)/success',
      params: { from }
    });
  };

  // Custom CSS for Signature Canvas to make it transparent and fit the design
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; margin: 0px; }
    body,html { height: 188px; background-color: transparent; }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconChip}>
          <SquiggleIcon />
        </View>

        <Text style={styles.title}>Create your signature</Text>
        <Text style={styles.subtitle}>
          Draw it once with your finger — we'll use it to sign your documents.
        </Text>

        <View 
          style={[
            styles.canvasContainer, 
            { borderColor: sigTouched && !hasSig ? T.colors.errBorder : '#C9D6E6' }
          ]}
        >
          <View style={styles.baseline} />
          <Text style={styles.baselineText}>✕ Sign above the line</Text>
          
          <SignatureScreen
            ref={signatureRef}
            onEnd={handleBegin}
            onOK={handleOK}
            onEmpty={handleEmpty}
            webStyle={webStyle}
            backgroundColor="transparent"
            penColor={T.colors.navyInk}
          />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.errorContainer}>
            {sigTouched && !hasSig && (
              <Text style={styles.errorText}>Please draw your signature</Text>
            )}
          </View>
          <Pressable style={styles.clearBtn} onPress={handleClear} hitSlop={10}>
            <TrashIcon />
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryBtn} onPress={submitSig}>
          <Text style={styles.primaryBtnText}>Save signature</Text>
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={() => finish('signup')}>
          <Text style={styles.skipBtnText}>I'll do this later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.cloud,
  },
  content: {
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 30,
    flex: 1,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: T.fonts.sora.semiBold,
    fontSize: 28,
    color: T.colors.ink,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: T.fonts.jakarta.regular,
    fontSize: 15,
    color: T.colors.inkSoft,
    marginBottom: 20,
    lineHeight: 22.5,
  },
  canvasContainer: {
    height: 188,
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: T.colors.white,
    overflow: 'hidden',
  },
  baseline: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    height: 1.5,
    backgroundColor: T.colors.border,
    zIndex: 0,
  },
  baselineText: {
    position: 'absolute',
    left: 20,
    bottom: 14,
    fontSize: 11,
    color: '#B4C0D2',
    fontFamily: T.fonts.jakarta.semiBold,
    letterSpacing: 0.5,
    zIndex: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  errorContainer: {
    minHeight: 16,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: T.fonts.jakarta.medium,
    fontSize: 12.5,
    color: T.colors.error,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  clearBtnText: {
    fontFamily: T.fonts.jakarta.semiBold,
    fontSize: 14,
    color: T.colors.blue,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    marginTop: 14,
    borderRadius: 15,
    backgroundColor: T.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC72C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 5,
  },
  primaryBtnText: {
    fontFamily: T.fonts.jakarta.bold,
    fontSize: 16,
    color: T.colors.navyInk,
  },
  skipBtn: {
    width: '100%',
    height: 46,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: T.fonts.jakarta.semiBold,
    fontSize: 14.5,
    color: T.colors.inkSoft,
  },
});
