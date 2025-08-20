import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  Platform, 
  ScrollView 
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { auth } from '../config/firebase';

/**
 * WelcomeScreen displays the landing page for the Iyaya app.
 * Users can select their role (Parent or Caregiver) and view app features.
 * Accessibility labels and roles are provided for improved usability.
 */
export default function WelcomeScreen() {
  const navigation = useNavigation();
  const isWeb = Platform.OS === 'web';

  // Gradient colors reused throughout the component
  const backgroundGradient = ["#fce8f4", "#e0f2fe", "#f3e8ff"];
  const parentGradient = ["#fce7f3", "#fbcfe8"];
  const caregiverGradient = ["#e0f2fe", "#bae6fd"];
  const logoGradient = ["#fbcfe8", "#f9a8d4"];

  return (
    <LinearGradient 
      colors={backgroundGradient} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header} accessibilityRole="header">
            <View style={styles.logoContainer} accessibilityLabel="Iyaya logo" accessibilityRole="image">
              <LinearGradient 
                colors={logoGradient}
                style={styles.logoBackground}
              >
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="Iyaya app logo"
                />
              </LinearGradient>
            </View>

            <Text style={styles.tagline} accessibilityRole="text">Connecting families with trusted caregivers</Text>
            <Text style={styles.subtitle} accessibilityRole="text">
              Find the perfect caregiver for your child or discover amazing families to work with.{"\n"}
              Safe, secure, and built with love.
            </Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.cardsContainer} accessibilityRole="list">
            {/* Parent Card */}
            <Pressable
              style={({ pressed }) => [
                styles.card, 
                styles.parentCard,
                pressed && styles.cardPressed
              ]}
              onPress={() => navigation.navigate('ParentAuth')}
              android_ripple={{ color: "#fce7f3" }}
              accessibilityRole="button"
              accessibilityLabel="I'm a Parent. Find trusted caregivers for your little ones. Get Started."
            >
              <View style={styles.cardContent} accessibilityRole="listitem">
                <LinearGradient 
                  colors={parentGradient}
                  style={[styles.iconContainer, styles.parentIconContainer]}
                >
                  <Ionicons name="happy-outline" size={40} color="#db2777" accessibilityLabel="Parent icon" />
                </LinearGradient>

                <Text style={styles.cardTitle} accessibilityRole="text">I'm a Parent</Text>
                <Text style={styles.cardDescription} accessibilityRole="text">
                  Find trusted caregivers for your little ones.{"\n"}
                  Browse profiles, read reviews, and book{"\n"}
                  services with confidence.
                </Text>

                <View style={[styles.getStartedButton, styles.parentButton]}>
                  <Text style={[styles.buttonText, styles.parentButtonText]}>Get Started</Text>
                  <View style={styles.buttonDot} />
                </View>
              </View>
            </Pressable>

            {/* Caregiver Card */}
            <Pressable
              style={({ pressed }) => [
                styles.card, 
                styles.caregiverCard,
                pressed && styles.cardPressed
              ]}
              onPress={() => navigation.navigate('CaregiverAuth')}
              android_ripple={{ color: "#e0f2fe" }}
              accessibilityRole="button"
              accessibilityLabel="I'm a Caregiver. Join our community of trusted caregivers. Get Started."
            >
              <View style={styles.cardContent} accessibilityRole="listitem">
                <LinearGradient 
                  colors={caregiverGradient}
                  style={[styles.iconContainer, styles.caregiverIconContainer]}
                >
                  <Ionicons name="person-outline" size={40} color="#2563eb" accessibilityLabel="Caregiver icon" />
                </LinearGradient>

                <Text style={styles.cardTitle} accessibilityRole="text">I'm a Caregiver</Text>
                <Text style={styles.cardDescription} accessibilityRole="text">
                  Join our community of trusted caregivers.{"\n"}
                  Create your profile, showcase your skills,{"\n"}
                  and connect with families.
                </Text>

                <View style={[styles.getStartedButton, styles.caregiverButton]}>
                  <Text style={[styles.buttonText, styles.caregiverButtonText]}>Get Started</Text>
                  <View style={[styles.buttonDot, styles.caregiverButtonDot]} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer} accessibilityRole="list">
            {[
              {
                icon: "checkmark-circle-outline",
                color: "#16a34a",
                bgColor: "#dcfce7",
                title: "Verified Profiles",
                description: "All caregivers undergo background checks\nand verification"
              },
              {
                icon: "people-outline",
                color: "#d97706",
                bgColor: "#fef3c7",
                title: "Trusted Community",
                description: "Join thousands of happy families and\ncaregivers"
              },
              {
                icon: "heart-outline",
                color: "#9333ea",
                bgColor: "#f3e8ff",
                title: "Made with Love",
                description: "Built by parents, for parents and caregivers"
              }
            ].map((feature, index) => (
              <View key={index} style={styles.feature} accessibilityRole="listitem">
                <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]} accessibilityRole="image"> 
                  <Ionicons name={feature.icon} size={24} color={feature.color} accessibilityLabel={feature.title + ' icon'} />
                </View>
                <Text style={styles.featureTitle} accessibilityRole="text">{feature.title}</Text>
                <Text style={styles.featureDescription} accessibilityRole="text">{feature.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Platform.select({
      web: 20,
      default: 16
    }),
    paddingTop: Platform.select({
      web: 60,
      default: 40
    }),
    paddingBottom: Platform.select({
      web: 40,
      default: 20
    }),
    maxWidth: Platform.select({
      web: 1200,
      default: undefined,
    }),
    alignSelf: Platform.select({
      web: 'center',
      default: undefined,
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: Platform.select({
      web: 40,
      default: 30
    }),
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: Platform.select({
      web: 180,
      default: 150
    }),
    height: Platform.select({
      web: 180,
      default: 150
    }),
    borderRadius: Platform.select({
      web: 40,
      default: 30
    }),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: Platform.select({
      web: 150,
      default: 120
    }),
    height: Platform.select({
      web: 150,
      default: 120
    }),
  },
  tagline: {
    fontSize: Platform.select({
      web: 20,
      default: 18
    }),
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: Platform.select({
      web: 16,
      default: 14
    }),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Platform.select({
      web: 20,
      default: 10
    }),
  },
  cardsContainer: {
    flexDirection: Platform.select({
      web: 'row',
      default: 'column'
    }),
    justifyContent: 'space-between',
    marginBottom: Platform.select({
      web: 50,
      default: 30
    }),
    gap: 16,
    maxWidth: Platform.select({
      web: 1200,
      default: undefined,
    }),
    alignSelf: Platform.select({
      web: 'center',
      default: undefined,
    }),
  },
  card: {
  flex: Platform.select({
    web: 1,
    default: undefined
  }),
  width: Platform.select({
    web: undefined,
    default: '100%'
  }),
  backgroundColor: "rgba(255, 255, 255, 0.99)", // Changed from 0.7 to 0.99
  borderRadius: 24,
  padding: Platform.select({
    web: 54,
    default: 24 // Reduced padding for mobile
  }),
  shadowColor: "#000",
  shadowOffset: { 
    width: 0, 
    height: Platform.select({
      web: 4,
      default: 2 // Smaller shadow on mobile
    }) 
  },
  shadowOpacity: Platform.select({
    web: 0.1,
    default: 0.05 // Lighter shadow on mobile
  }),
  shadowRadius: Platform.select({
    web: 12,
    default: 8 // Tighter shadow on mobile
  }),
  elevation: Platform.select({
    web: 8,
    default: 0 // Remove elevation on Android
  }),
  minHeight: Platform.select({
    web: 320,
    default: 280 // Adjusted for better mobile display
  }),
  borderWidth: 2,
  overflow: 'hidden',
},
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  parentCard: {
    borderColor: "#fbcfe8",
  },
  caregiverCard: {
    borderColor: "#bfdbfe",
  },
  cardContent: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  parentIconContainer: {
    backgroundColor: "#fce7f3",
  },
  caregiverIconContainer: {
    backgroundColor: "#e0f2fe",
  },
  cardTitle: {
    fontSize: Platform.select({
      web: 22,
      default: 20
    }),
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: Platform.select({
      web: 14,
      default: 13
    }),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    flex: 1,
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: "auto",
  },
  parentButton: {
    backgroundColor: "transparent",
  },
  caregiverButton: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  parentButtonText: {
    color: "#db2777",
  },
  caregiverButtonText: {
    color: "#2563eb",
  },
  buttonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#db2777",
  },
  caregiverButtonDot: {
    backgroundColor: "#2563eb",
  },
  featuresContainer: {
  flexDirection: Platform.select({
    web: 'row',
    default: 'column'
  }),
  justifyContent: 'space-between',
  gap: 16,
  marginTop: Platform.select({
    web: 'auto',
    default: 20
  }),
  width: '100%', // Ensure full width
  paddingHorizontal: Platform.select({
    web: 0,
    default: 16
  }),
  maxWidth: Platform.select({
    web: 1200,
    default: undefined,
  }),
  alignSelf: Platform.select({
    web: 'center',
    default: undefined,
  }),
},
feature: {
  alignItems: 'center',
  paddingHorizontal: 8,
  flex: Platform.select({
    web: 1,
    default: undefined
  }),
  width: Platform.select({
    web: undefined,
    default: '100%'
  }),
  marginBottom: Platform.select({
    web: 0,
    default: 16
  }),
},
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: Platform.select({
      web: 16,
      default: 15
    }),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: Platform.select({
      web: 12,
      default: 11
    }),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
});