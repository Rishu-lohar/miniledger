
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

export default function App() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  function sendOtp() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert("Invalid number", "Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setOtpSent(true);
    Alert.alert("Demo OTP", "Backend integration pending. UI demo only.");
  }

  function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert("Invalid OTP", "Enter a 6-digit OTP.");
      return;
    }

    Alert.alert("Backend pending", "OTP verification will be connected to the API next.");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FC" />

      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <Text style={styles.brand}>MINILEDGER</Text>
        <Text style={styles.heading}>Your money, in control.</Text>
        <Text style={styles.subtitle}>
          Track money lent to friends, stay on top of repayments,
          and keep every record in one place.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>

          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {otpSent && (
            <>
              <Text style={styles.label}>One-time password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </>
          )}

          <Pressable
            style={styles.button}
            onPress={otpSent ? verifyOtp : sendOtp}
          >
            <Text style={styles.buttonText}>
              {otpSent ? "Verify OTP" : "Continue with phone"}
            </Text>
          </Pressable>

          {otpSent && (
            <Pressable onPress={() => {
              setOtpSent(false);
              setOtp("");
            }}>
              <Text style={styles.changeNumber}>Change phone number</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.footer}>
          Simple, secure and transparent money tracking.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FC" },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 26,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: "#3D60E8",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  logoText: { color: "#FFFFFF", fontSize: 32, fontWeight: "900" },
  brand: {
    textAlign: "center",
    color: "#15234D",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
  },
  heading: {
    color: "#17213D",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 32,
  },
  subtitle: {
    color: "#7C8499",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E8F0",
    padding: 20,
  },
  label: {
    color: "#454E65",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DFE3EF",
    borderRadius: 10,
    marginBottom: 20,
  },
  prefix: {
    paddingLeft: 14,
    color: "#27334F",
    fontWeight: "700",
  },
  phoneInput: {
    flex: 1,
    padding: 14,
    color: "#17213D",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DFE3EF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    color: "#17213D",
  },
  button: {
    backgroundColor: "#3D60E8",
    borderRadius: 11,
    padding: 16,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  changeNumber: {
    color: "#3D60E8",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "700",
  },
  footer: {
    color: "#969CAF",
    textAlign: "center",
    fontSize: 12,
    marginTop: 26,
  },
});
