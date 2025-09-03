import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Baby } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const ChildrenSection = ({ children, onAddChild, onEditChild }) => {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Baby size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Your Children</Text>
        </View>
      </View>
      
      <View style={styles.childrenList}>
        {children.map((child) => (
          <View key={child.id} style={[styles.childCard, { backgroundColor: colors.backgroundLight }]}>
            <View style={[styles.childIcon, { backgroundColor: colors.secondaryLight }]}>
              <Baby size={24} color={colors.secondary} />
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childDetails}>
                Age {child.age}{child.preferences ? ` • ${child.preferences}` : ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => onEditChild(child)}
            >
              <Text style={[styles.editButtonText, { color: colors.secondary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {children.length === 0 && (
          <View style={styles.emptyState}>
            <Baby size={32} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No children added yet</Text>
            <TouchableOpacity onPress={onAddChild}>
              <Text style={[styles.emptyStateAction, { color: colors.secondary }]}>
                Add your first child
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default ChildrenSection;