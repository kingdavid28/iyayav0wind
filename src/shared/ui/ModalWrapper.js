import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';

const ModalWrapper = ({ visible, onClose, children, animationType = 'slide', style }) => (
  <Modal
    visible={visible}
    animationType={animationType}
    transparent
    onRequestClose={onClose}
  >
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={[styles.content, style]} activeOpacity={1}>
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
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