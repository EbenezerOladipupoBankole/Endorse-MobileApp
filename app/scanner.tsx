import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Dimensions, Image, ActivityIndicator, PanResponder, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { X, ArrowRight, Camera, Folder } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const [capturedImage, setCapturedImage] = useState<any>(null); // { uri, width, height }
  const [filterMode, setFilterMode] = useState<'color' | 'bw'>('color');
  const [isCapturing, setIsCapturing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Crop Box State (pixels from edges of the container)
  const [crop, setCrop] = useState({ top: 30, left: 30, right: 30, bottom: 30 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const cropRef = useRef(crop);
  const baseCropRef = useRef(crop);
  const containerSizeRef = useRef({ width: width, height: height * 0.7 });

  const capturedImageRef = useRef(capturedImage);
  useEffect(() => {
    capturedImageRef.current = capturedImage;
  }, [capturedImage]);

  useEffect(() => {
    openNativeCamera();
  }, []);

  // Dynamically set crop box boundaries to match the rendered image size with padding
  useEffect(() => {
    if (capturedImage && containerSize.width > 0) {
      const imgWidth = capturedImage.width;
      const imgHeight = capturedImage.height;
      const ratio = Math.min(containerSize.width / imgWidth, containerSize.height / imgHeight);
      
      const renderedWidth = imgWidth * ratio;
      const renderedHeight = imgHeight * ratio;
      const offsetX = (containerSize.width - renderedWidth) / 2;
      const offsetY = (containerSize.height - renderedHeight) / 2;
      
      const initialCrop = {
        top: Math.max(0, Math.floor(offsetY + 20)),
        bottom: Math.max(0, Math.floor(offsetY + 20)),
        left: Math.max(0, Math.floor(offsetX + 20)),
        right: Math.max(0, Math.floor(offsetX + 20))
      };
      setCrop(initialCrop);
      cropRef.current = initialCrop;
    }
  }, [capturedImage?.uri, containerSize.width, containerSize.height]);

  const openNativeCamera = async () => {
    setIsCapturing(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      router.back();
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false, // We'll do custom crop
      });

      if (!result.canceled) {
        setCapturedImage({
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height
        });
      } else {
        if (!capturedImage) router.back();
      }
    } catch (err) {
      console.error(err);
      if (!capturedImage) router.back();
    } finally {
      setIsCapturing(false);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to import photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled) {
        setCapturedImage({
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createPanResponder = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        baseCropRef.current = { ...cropRef.current };
      },
      onPanResponderMove: (e, gesture) => {
        let { top, left, right, bottom } = baseCropRef.current;
        const minSize = 60; // minimum crop box size
        
        const cWidth = containerSizeRef.current.width;
        const cHeight = containerSizeRef.current.height;

        // Calculate rendered image boundaries
        const imgWidth = capturedImageRef.current?.width || cWidth;
        const imgHeight = capturedImageRef.current?.height || cHeight;
        const ratio = Math.min(cWidth / imgWidth, cHeight / imgHeight);
        const renderedWidth = imgWidth * ratio;
        const renderedHeight = imgHeight * ratio;
        const offsetX = (cWidth - renderedWidth) / 2;
        const offsetY = (cHeight - renderedHeight) / 2;

        if (corner === 'tl') {
          top = Math.max(offsetY, Math.min(cHeight - bottom - minSize, top + gesture.dy));
          left = Math.max(offsetX, Math.min(cWidth - right - minSize, left + gesture.dx));
        }
        if (corner === 'tr') {
          top = Math.max(offsetY, Math.min(cHeight - bottom - minSize, top + gesture.dy));
          right = Math.max(offsetX, Math.min(cWidth - left - minSize, right - gesture.dx));
        }
        if (corner === 'bl') {
          bottom = Math.max(offsetY, Math.min(cHeight - top - minSize, bottom - gesture.dy));
          left = Math.max(offsetX, Math.min(cWidth - right - minSize, left + gesture.dx));
        }
        if (corner === 'br') {
          bottom = Math.max(offsetY, Math.min(cHeight - top - minSize, bottom - gesture.dy));
          right = Math.max(offsetX, Math.min(cWidth - left - minSize, right - gesture.dx));
        }
        
        const newCrop = { top, left, right, bottom };
        setCrop(newCrop);
        cropRef.current = newCrop;
      }
    });
  };

  const tlResponder = useRef(createPanResponder('tl')).current;
  const trResponder = useRef(createPanResponder('tr')).current;
  const blResponder = useRef(createPanResponder('bl')).current;
  const brResponder = useRef(createPanResponder('br')).current;

  const handleNext = async () => {
    if (!capturedImage || !containerSize.width) return;
    setIsProcessing(true);

    try {
      // Calculate real image dimensions as rendered by resizeMode="contain"
      const imgWidth = capturedImage.width;
      const imgHeight = capturedImage.height;
      const ratio = Math.min(containerSize.width / imgWidth, containerSize.height / imgHeight);
      
      const renderedWidth = imgWidth * ratio;
      const renderedHeight = imgHeight * ratio;
      const offsetX = (containerSize.width - renderedWidth) / 2;
      const offsetY = (containerSize.height - renderedHeight) / 2;

      // Image boundaries in container coordinates
      const imgLeft = offsetX;
      const imgRight = containerSize.width - offsetX;
      const imgTop = offsetY;
      const imgBottom = containerSize.height - offsetY;

      // Crop box boundaries in container coordinates
      const cropLeft = crop.left;
      const cropRight = containerSize.width - crop.right;
      const cropTop = crop.top;
      const cropBottom = containerSize.height - crop.bottom;

      // Intersection of crop box and rendered image
      const interLeft = Math.max(imgLeft, cropLeft);
      const interRight = Math.min(imgRight, cropRight);
      const interTop = Math.max(imgTop, cropTop);
      const interBottom = Math.min(imgBottom, cropBottom);

      // Verify intersection is valid
      if (interLeft >= interRight || interTop >= interBottom) {
        throw new Error("Invalid crop area selection");
      }

      // Crop area relative to the image
      const cropX_rendered = interLeft - imgLeft;
      const cropY_rendered = interTop - imgTop;
      const cropW_rendered = interRight - interLeft;
      const cropH_rendered = interBottom - interTop;

      // Map to original image coordinates
      const originX = cropX_rendered / ratio;
      const originY = cropY_rendered / ratio;
      const width = cropW_rendered / ratio;
      const height = cropH_rendered / ratio;

      // Crop the image using Expo Image Manipulator
      const manipResult = await ImageManipulator.manipulateAsync(
        capturedImage.uri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Navigate to save screen
      router.push({ 
        pathname: '/save-scan', 
        params: { 
          imageUri: manipResult.uri,
          filter: filterMode
        } 
      });
    } catch (err) {
      console.error("Crop error:", err);
      // Fallback: pass uncropped
      router.push({ 
        pathname: '/save-scan', 
        params: { 
          imageUri: capturedImage.uri,
          filter: filterMode
        } 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCapturing || !capturedImage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.editorContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Editor Header */}
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop & Filter</Text>
        <TouchableOpacity onPress={handleNext} style={styles.saveBtn} disabled={isProcessing}>
          {isProcessing ? <ActivityIndicator color="#FFF" size="small" /> : (
            <>
              <Text style={styles.saveBtnText}>Next</Text>
              <ArrowRight color="#FFF" size={16} style={{ marginLeft: 4 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Preview & Custom Cropper */}
      <View 
        style={styles.previewContainer} 
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setContainerSize({
            width: layout.width,
            height: layout.height
          });
          containerSizeRef.current = { width: layout.width, height: layout.height };
        }}
      >
        <Image 
          source={{ uri: capturedImage.uri }} 
          style={styles.previewImage} 
          resizeMode="contain" 
        />
        {filterMode === 'bw' && <View style={styles.bwOverlay} />}

        {/* Shaded backdrop outside the crop box */}
        {containerSize.width > 0 && (
          <>
            <View style={[styles.cropBackdrop, { top: 0, left: 0, right: 0, height: crop.top }]} />
            <View style={[styles.cropBackdrop, { bottom: 0, left: 0, right: 0, height: crop.bottom }]} />
            <View style={[styles.cropBackdrop, { top: crop.top, bottom: crop.bottom, left: 0, width: crop.left }]} />
            <View style={[styles.cropBackdrop, { top: crop.top, bottom: crop.bottom, right: 0, width: crop.right }]} />
          </>
        )}

        {/* The Green Crop Box Overlay */}
        {containerSize.width > 0 && (
          <View style={[
            styles.cropBox,
            { top: crop.top, bottom: crop.bottom, left: crop.left, right: crop.right }
          ]}>
            <View style={styles.cropGridHorizontal} />
            <View style={styles.cropGridVertical} />
            
            {/* Corner Handles */}
            <View {...tlResponder.panHandlers} style={[styles.cornerHandle, styles.tl]} />
            <View {...trResponder.panHandlers} style={[styles.cornerHandle, styles.tr]} />
            <View {...blResponder.panHandlers} style={[styles.cornerHandle, styles.bl]} />
            <View {...brResponder.panHandlers} style={[styles.cornerHandle, styles.br]} />
          </View>
        )}
      </View>

      {/* Bottom Toolbar for Filters */}
      <View style={styles.editorToolbar}>
        <View style={styles.filtersScroll}>
          <TouchableOpacity 
            style={[styles.filterOption, filterMode === 'color' && styles.filterActive]} 
            onPress={() => setFilterMode('color')}
          >
            <View style={[styles.filterThumbnail, { backgroundColor: '#4F46E5' }]} />
            <Text style={[styles.filterText, filterMode === 'color' && styles.filterTextActive]}>Color</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterOption, filterMode === 'bw' && styles.filterActive]} 
            onPress={() => setFilterMode('bw')}
          >
            <View style={[styles.filterThumbnail, { backgroundColor: '#1E1B4B' }]} />
            <Text style={[styles.filterText, filterMode === 'bw' && styles.filterTextActive]}>B&W</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.toolOption} onPress={openNativeCamera}>
            <View style={styles.toolIconWrapper}>
              <Camera color="#FFF" size={20} />
            </View>
            <Text style={styles.filterText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolOption} onPress={openGallery}>
            <View style={styles.toolIconWrapper}>
              <Folder color="#FFF" size={20} />
            </View>
            <Text style={styles.filterText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
  },
  saveBtn: {
    backgroundColor: '#10B981', // green accent
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  bwOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.2)', // Light simulated overlay instead of tintColor
  },
  /* Custom Cropper Styles */
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#10B981', // green color as requested
    zIndex: 10,
  },
  cropGridHorizontal: {
    position: 'absolute',
    top: '33%',
    bottom: '33%',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  cropGridVertical: {
    position: 'absolute',
    left: '33%',
    right: '33%',
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    borderColor: '#10B981',
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  
  cropBackdrop: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 5,
  },
  editorToolbar: {
    height: 120,
    backgroundColor: '#1E293B',
    paddingVertical: 20,
  },
  filtersScroll: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    alignItems: 'center',
  },
  filterOption: {
    alignItems: 'center',
    gap: 8,
  },
  filterThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterActive: {
    opacity: 1,
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  toolOption: {
    alignItems: 'center',
    gap: 8,
  },
  toolIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
