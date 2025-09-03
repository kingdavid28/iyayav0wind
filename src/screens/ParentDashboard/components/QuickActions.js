import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Calendar, MessageCircle, Search } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const QuickActions = ({ actions }) => {
  const styleFor = (id) => {
    switch (id) {
      case 'find':
        return { bg: '#FFF1F7', border: '#FBCFE8', icon: '#EC4899' };
      case 'book':
        return { bg: '#EFF6FF', border: '#BFDBFE', icon: '#3B82F6' };
      case 'messages':
        return { bg: '#F5F3FF', border: '#DDD6FE', icon: '#8B5CF6' };
      case 'add-child':
        return { bg: '#ECFDF5', border: '#BBF7D0', icon: '#10B981' };
      default:
        return { bg: colors.surface, border: colors.border, icon: colors.primary };
    }
  };

  const rows = [];
  for (let i = 0; i < actions.length; i += 2) {
    rows.push(actions.slice(i, i + 2));
  }

  const renderIcon = (iconName, color) => {
    switch (iconName) {
      case 'plus':
        return <Plus size={28} color={color} />;
      case 'calendar':
        return <Calendar size={28} color={color} />;
      case 'message-circle':
        return <MessageCircle size={28} color={color} />;
      case 'search':
        return <Search size={28} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ paddingTop: 4 }}>
      {rows.map((row, idx) => (
        <View key={`qa-row-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {row.map((action) => {
            const s = styleFor(action.id);
            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickAction,
                  { borderColor: s.border, backgroundColor: s.bg, borderWidth: 1, borderRadius: 16, paddingVertical: 20 },
                ]}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                {renderIcon(action.icon, s.icon)}
                <Text style={[styles.quickActionText, { color: '#111827' }]}>{action.title}</Text>
              </TouchableOpacity>
            );
          })}
          {row.length === 1 && (
            <View style={[styles.quickAction, { opacity: 0 }]} />
          )}
        </View>
      ))}
    </View>
  );
};

export default QuickActions;