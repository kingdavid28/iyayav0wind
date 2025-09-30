import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';

const ModalWrapper = ({ visible, onClose, children, animationType = 'slide', style, overlayStyle }) => (
  <Modal
    visible={visible}
    animationType={animationType}
    transparent
    onRequestClose={onClose}
  >
    <View style={[styles.overlay, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.content, style]}>
        {children}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
});

export default ModalWrapper;