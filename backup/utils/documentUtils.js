import * as DocumentPicker from 'expo-document-picker';
import { logger } from './logger';
import { security } from './security';

export const pickDocument = async (allowedTypes = ['application/pdf', 'image/*']) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: allowedTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Validate file security
      const validation = security.validateFileUpload(asset, allowedTypes);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Document picker error:', error);
    throw error;
  }
};

// Upload document to server
export const uploadDocument = async (document, category = 'general') => {
  try {
    const formData = new FormData();
    formData.append('document', {
      uri: document.uri,
      type: document.mimeType,
      name: document.name,
    });
    formData.append('category', category);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  } catch (error) {
    logger.error('Document upload error:', error);
    throw error;
  }
};

// Get user documents
export const getUserDocuments = async () => {
  try {
    const response = await fetch('/api/documents/user');
    if (!response.ok) throw new Error('Failed to fetch documents');
    return await response.json();
  } catch (error) {
    logger.error('Get documents error:', error);
    throw error;
  }
};

// Delete document
export const deleteDocument = async (documentId) => {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete document');
    return true;
  } catch (error) {
    logger.error('Delete document error:', error);
    throw error;
  }
};
