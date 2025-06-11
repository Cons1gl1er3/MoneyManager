import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import ErrorModal from './ErrorModal';

interface FloatingActionButtonProps {
  currentRoute?: string; // To potentially customize menu items per page
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ currentRoute }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [showOCRError, setShowOCRError] = useState(false);

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleScanPress = () => {
    if (Platform.OS === 'web') {
      setIsMenuOpen(false);
      setShowOCRError(true);
    } else {
      setIsMenuOpen(false);
      router.push('/scan');
    }
  };

  // Define all menu items
  const allMenuItems = [
    {
      title: 'Add Transaction',
      icon: 'add-circle' as const,
      route: '/add-transaction' as const,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/add-transaction');
      }
    },
    {
      title: 'OCR Scan Receipt',
      icon: 'scan' as const,
      route: '/scan' as const,
      onPress: handleScanPress
    },
    {
      title: 'AI-based Assistant',
      icon: 'chatbubble-ellipses' as const,
      route: '/chatbot' as const,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/chatbot');
      }
    },
  ];

  // Filter out menu items based on current route to avoid redundancy
  const menuItems = allMenuItems.filter(item => {
    // Don't show scan option if already on scan page
    if (pathname === '/scan' && item.route === '/scan') return false;
    // Don't show assistant option if already on chatbot page
    if (pathname === '/chatbot' && item.route === '/chatbot') return false;
    // Don't show add transaction if already on add-transaction page
    if (pathname === '/add-transaction' && item.route === '/add-transaction') return false;
    return true;
  });

  const renderMenuItems = () => {
    return menuItems.map((item, index) => {
      const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -50 * (index + 1)], // Reduced spacing
      });

      const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
      });

      return (
        <Animated.View
          key={item.title}
          style={[
            styles.menuItem,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuButton}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={24} color="white" />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  // Don't render FAB on certain pages where it's not needed
  const shouldHideFAB = ['/add-transaction', '/edit-transaction', '/add-account'].includes(pathname);
  
  if (shouldHideFAB) {
    return null;
  }

  return (
    <>
      {/* FAB Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <BlurView intensity={20} style={styles.blurView}>
            {renderMenuItems()}
            <TouchableOpacity
              style={styles.fab}
              onPress={toggleMenu}
            >
              <Ionicons
                name={isMenuOpen ? 'close' : 'add'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* FAB Button */}
      {!isMenuOpen && (
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* OCR Error Modal */}
      <ErrorModal
        visible={showOCRError}
        message="OCR feature is not supported on web platform.

Please use the mobile app to scan receipts and add expense transactions automatically."
        onClose={() => setShowOCRError(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 24,
  },
  menuItem: {
    position: 'absolute',
    bottom: 64,
    right: 24,
    marginBottom: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  menuText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FloatingActionButton; 