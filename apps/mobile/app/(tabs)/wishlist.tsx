import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "../../constants/design";

export default function WishlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.iconLarge}>🎭</Text>
      <Text style={styles.title}>Your Wishlist is Empty</Text>
      <Text style={styles.subtitle}>Save your favorite costumes to rent them later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[6],
  },
  iconLarge: {
    fontSize: 64,
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.text,
    marginBottom: Spacing[2],
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
