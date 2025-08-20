import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Modal, TextInput, Button, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/ParentDashboard.styles';

const ChildModal = ({
  visible,
  onDismiss,
  childName,
  setChildName,
  childAge,
  setChildAge,
  childNotes,
  setChildNotes,
  handleAddChild,
  children,
  handleDeleteChild,
}) => {
  const renderChildItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={`Age: ${item.age}${item.notes ? ` • ${item.notes}` : ''}`}
      right={props => (
        <Button 
          mode="text" 
          onPress={() => handleDeleteChild(item.id)}
          icon="delete"
          color="#EF4444"
        >
          
        </Button>
      )}
      style={styles.childItem}
    />
  );

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalOverlay}
      theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Manage Children</Text>
          <Button onPress={onDismiss}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </Button>
        </View>
        
        <TextInput
          label="Child's Name"
          value={childName}
          onChangeText={setChildName}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Age"
          value={childAge}
          onChangeText={setChildAge}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Notes (Allergies, Special Needs, etc.)"
          value={childNotes}
          onChangeText={setChildNotes}
          style={[styles.input, { marginBottom: 16 }]}
          mode="outlined"
          multiline
          numberOfLines={3}
        />
        
        <Button 
          mode="contained" 
          onPress={handleAddChild}
          style={{ marginBottom: 16 }}
          disabled={!childName || !childAge}
        >
          Add Child
        </Button>
        
        <FlatList
          data={children}
          renderItem={renderChildItem}
          keyExtractor={(item) => item.id}
          style={styles.childrenList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No children added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your children to find the perfect nanny for their needs
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

export default ChildModal;
