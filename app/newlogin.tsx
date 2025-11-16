import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = "http://127.0.0.1:5500";
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
    const [loading, setLoading] = useState(false);
    const [otpErrMsg, setOtpErrMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState();

    const navigation = useNavigation();

    const handleLogin = async () => {
        setLoading(true);
        if (name && mobile && society && agree) {
            try {
                // Make API call to backend for OTP generation
                const response = await fetch(`${API_URL}/register-user/`, {
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
                    setLoading(false);
                    // OTP sent successfully
                    Alert.alert("OTP sent successfully!");
                    alert("OTP sent successfully!");
                    setShowOTP(true);
                } else {
                    setLoading(false);
                    // Server responded with an error
                    Alert.alert("Error", data.message || "Something went wrong.");
                    //alert("Something went wrong.");
                    setErrorMsg(data.message || "Something went wrong.");
                }
            } catch (error) {
                setLoading(false);
                console.error("Error sending OTP:", error);
                Alert.alert("Network Error", "Please check your connection and try again.");
                alert("Network Error, Please check your connection and try again.");
            }
        } else {
            setLoading(false);
            Alert.alert("Please fill all fields and accept terms.");
            alert("Please fill all fields and accept terms.");
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        if (otp) {
            try {
                const response = await fetch(`${API_URL}/validate-otp/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ otp }),
                });

                const data = await response.json();

                if (response.ok) {
                    setLoading(false);
                    setOtpErrMsg(false);
                    Alert.alert(data.message || "OTP Verified!");
                    setShowOTP(false);
                    await AsyncStorage.setItem("loginStatus", "success");
                    navigation.navigate("index" as never);
                } else {
                    setLoading(false);
                    setOtpErrMsg(true);
                    Alert.alert("Error", data.message || "Incorrect OTP");
                }

            } catch (error) {
                setLoading(false);
                console.error("Error verifying OTP:", error);
                Alert.alert("Network Error", "Please check your connection and try again.");
                alert("Network Error Please check your connection and try again.");
            }
        } else {
            setLoading(false);
            Alert.alert("Please enter your OTP");
            alert("Please enter your OTP");
        }
    };


    return (
        <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>🤖</Text>
                </View>
                <Text style={styles.title}>QueryMe{"\n"}AI Assistant</Text>
            </View>
            {
                errorMsg && (
                    <View style={styles.errorMsgBox}>
                        <Text style={styles.errorMsgText}>{errorMsg}</Text>
                    </View>
                )
            }
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
                        {loading === false ? <Text style={styles.buttonText}>Login</Text>:
                        <ActivityIndicator size="small" color="#007AFF" />}
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
                    {otpErrMsg && (<Text style={styles.otpErrText}>*Incorrect OTP</Text>)}
                    {/* <TouchableOpacity style={styles.button} onPress={() => router.push("/")}> */}
                    <TouchableOpacity style={styles.button2} onPress={handleVerify}>
                        {loading === false ?<Text style={styles.buttonText}>Verify</Text>:
                        <ActivityIndicator size="small" color="#007AFF" />}
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
    errorMsgBox: {
        backgroundColor: '#ffeaea',
        borderColor: '#ff4d4f',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 14,
        alignSelf: 'stretch',
    },
    errorMsgText: {
        color: '#d32f2f',
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '600',
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
    button2: {
        backgroundColor: "#000",
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
        marginTop: 10,
        width: 280
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
    otpErrText: {
        color: "red",
        textAlign: "center",
    }
});