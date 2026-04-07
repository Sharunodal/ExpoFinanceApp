import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type SecurityPhase = "checking" | "ready" | "locked" | "setup";

type WebSecurityGateProps = {
  securityPhase: SecurityPhase;
  passphraseInput: string;
  securityError: string;
  isUnlocking: boolean;
  onChangePassphrase: (value: string) => void;
  onUnlock: () => void;
  onForgotPassphrase: () => void;
};

export default function WebSecurityGate({
  securityPhase,
  passphraseInput,
  securityError,
  isUnlocking,
  onChangePassphrase,
  onUnlock,
  onForgotPassphrase,
}: WebSecurityGateProps) {
  const isWebSecure =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (!isWebSecure) {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>HTTPS Required</Text>
          <Text style={styles.body}>
            The web app only runs on HTTPS so local expense data can be protected
            with the browser&apos;s secure crypto APIs.
          </Text>
        </View>
      </View>
    );
  }

  if (securityPhase === "checking") {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Preparing Local Storage</Text>
          <Text style={styles.body}>
            Checking your local-only encrypted storage.
          </Text>
        </View>
      </View>
    );
  }

  const isSetup = securityPhase === "setup";

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSetup ? "Secure Local Storage" : "Unlock Local Data"}
        </Text>
        <Text style={styles.body}>
          {isSetup
            ? "Set a passphrase to encrypt your expense data in this browser. The passphrase never leaves your device."
            : "Enter your passphrase to decrypt your locally stored expense data in this browser."}
        </Text>
        <TextInput
          value={passphraseInput}
          onChangeText={onChangePassphrase}
          secureTextEntry
          placeholder={isSetup ? "Create passphrase" : "Enter passphrase"}
          placeholderTextColor="#888"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {securityError ? <Text style={styles.error}>{securityError}</Text> : null}
        <Pressable
          style={[styles.button, isUnlocking && styles.buttonDisabled]}
          onPress={onUnlock}
          disabled={isUnlocking}
        >
          <Text style={styles.buttonText}>
            {isUnlocking
              ? "Working..."
              : isSetup
              ? "Create Passphrase"
              : "Unlock"}
          </Text>
        </Pressable>
        {!isSetup ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={onForgotPassphrase}
            disabled={isUnlocking}
          >
            <Text style={styles.secondaryButtonText}>
              Forgot Passphrase? Reset Local Data
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f6f7f9",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  error: {
    color: "#b42318",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  secondaryButtonText: {
    color: "#222",
    fontWeight: "700",
    fontSize: 15,
  },
});
