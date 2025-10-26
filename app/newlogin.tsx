import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ✅ Custom Checkbox component (no dependency)
const CustomCheckbox: React.FC<{
    checked: boolean;
    onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => (
    <TouchableOpacity
        onPress={() => onChange(!checked)}
        style={styles.checkboxBox}
    >
        {checked && <View style={styles.checkboxTick} />}
    </TouchableOpacity>
);

const LoginScreen: React.FC = () => {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [society, setSociety] = useState("");
    const [agree, setAgree] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState("");

    const navigation = useNavigation();

    const handleLogin = async () => {
        if (name && mobile && society && agree) {
            try {
                // Make API call to backend for OTP generation
                const response = await fetch("http://127.0.0.1:5500/register-user/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        mobilenumber: mobile,
                        name,
                        society,
                        otp,
                        tnc: agree
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    // OTP sent successfully
                    Alert.alert("OTP sent successfully!");
                    setShowOTP(true);
                } else {
                    // Server responded with an error
                    Alert.alert("Error", data.message || "Something went wrong.");
                }
            } catch (error) {
                console.error("Error sending OTP:", error);
                Alert.alert("Network Error", "Please check your connection and try again.");
            }
        } else {
            Alert.alert("Please fill all fields and accept terms.");
        }
    };

    const handleVerify = async () => {
        if (otp) {
            try {
                const response = await fetch("http://127.0.0.1:5500/validate-otp/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ otp }),
                });

                const data = await response.json();

                if (response.ok) {
                    Alert.alert(data.message || "OTP Verified!");
                    setShowOTP(false);
                    await AsyncStorage.setItem("loginStatus", "success");
                    navigation.navigate("index" as never);
                } else {
                    Alert.alert("Error", data.message || "Incorrect OTP");
                }

            } catch (error) {
                console.error("Error verifying OTP:", error);
                Alert.alert("Network Error", "Please check your connection and try again.");
            }
        } else {
            Alert.alert("Please enter your OTP");
        }
    };


    return (
        <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>🤖</Text>
                </View>
                <Text style={styles.title}>Society App{"\n"}AI Assistant</Text>
            </View>

            {/* Form Section */}
            {!showOTP && (
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mobile Number"
                        keyboardType="numeric"
                        value={mobile}
                        onChangeText={setMobile}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Select Society"
                        value={society}
                        onChangeText={setSociety}
                    />

                    <View style={styles.checkboxContainer}>
                        <CustomCheckbox checked={agree} onChange={setAgree} />
                        <Text style={styles.checkboxLabel}>
                            I agree to the Terms and Conditions
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* OTP Section */}
            {showOTP && (
                <View style={styles.otpSection}>
                    <Text style={styles.otpTitle}>OTP Verification</Text>
                    <Text style={styles.otpText}>Enter the OTP sent to your mobile</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
                        keyboardType="numeric"
                        value={otp}
                        onChangeText={setOtp}
                    />

                    {/* <TouchableOpacity style={styles.button} onPress={() => router.push("/")}> */}
                    <TouchableOpacity style={styles.button} onPress={handleVerify}>
                        <Text style={styles.buttonText}>Verify</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 30,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    logoIcon: {
        fontSize: 40,
    },
    title: {
        textAlign: "center",
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 10,
    },
    form: {
        width: "100%",
    },
    input: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxTick: {
        width: 12,
        height: 12,
        backgroundColor: "#000",
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 14,
    },
    button: {
        backgroundColor: "#000",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    otpSection: {
        width: "100%",
        alignItems: "center",
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 20,
    },
    otpTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    otpText: {
        color: "#444",
        marginBottom: 15,
        textAlign: "center",
    },
});