import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { modalOverlay, modalContainer } from '../styles/common';

export default function ModalWrapper({ 
  visible, 
  onClose, 
  children, 
  animationType = 'fade',
  transparent = true,
  style = {}
}) {
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={[modalContainer, style]} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}