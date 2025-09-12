import React from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import colors from '../../constants/colors';

const Screen = ({ 
  children, 
  style = {}, 
  backgroundColor = colors.background,
  statusBarStyle = 'dark-content',
  safeArea = true 
}) => {
  const Container = safeArea ? SafeAreaView : View;
  
  return (
    <Container style={[{ flex: 1, backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </Container>
  );
};

export default Screen;