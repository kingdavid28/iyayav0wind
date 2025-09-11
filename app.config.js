export default {
  expo: {
    name: "iYaya",
    slug: "iyaya-caregiver-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.iyaya.nannyapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.iyaya.nannyapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "iyaya",
    linking: {
      prefixes: ["iyaya://", "exp://192.168.1.10:8081/--/"],
      config: {
        screens: {
          EmailVerification: {
            path: "verify-email",
            parse: {
              token: (token) => token
            }
          },
          VerificationSuccess: {
            path: "verify-success",
            parse: {
              role: (role) => role
            }
          }
        }
      }
    },
    extra: {
      eas: {
        projectId: "583f6598-db53-4667-af75-fdd1f8104fab"
      }
    },
    plugins: []
  }
};