import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

//const API_URL = "http://192.168.29.169:5500";
const API_URL = "https://queryme.in/smondoville/app";
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

// ✅ Custom Dropdown component
const CustomDropdown: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
}> = ({ value, onChange, options, placeholder = "Select an option" }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.dropdownContainer}>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={[styles.dropdownButtonText, !value && { color: '#999' }]}>
                    {value || placeholder}
                </Text>
                <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.dropdownMenu}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dropdownItem,
                                value === option && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={[
                                styles.dropdownItemText,
                                value === option && styles.dropdownItemTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const LoginScreen: React.FC = () => {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [society, setSociety] = useState("");
    const [agree, setAgree] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [otpErrMsg, setOtpErrMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    
    // Create refs for OTP inputs
    const otpRefs = useRef<Array<TextInput | null>>([]);

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
                        otp: otp.join(''),
                        tnc: agree
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    setLoading(false);
                    // OTP sent successfully
                    Alert.alert("OTP sent successfully!");
                    // alert("OTP sent successfully!");
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
                // alert("Network Error, Please check your connection and try again.");
            }
        } else {
            setLoading(false);
            Alert.alert("Please fill all fields and accept terms.");
            // alert("Please fill all fields and accept terms.");
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        const otpString = otp.join('');
        if (otpString && otpString.length === 6) {
            try {
                const response = await fetch(`${API_URL}/validate-otp/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ otp: otpString }),
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
        <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
            <View style={styles.container}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>🤖</Text>
                </View>
                <Text style={styles.title}>QueryMe{"\n"}AI Assistant</Text>
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
                    <CustomDropdown
                        value={society}
                        onChange={setSociety}
                        options={['Smondoville']}
                        placeholder="Select Your Society"
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

                    <View style={styles.otpInputContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(input) => {
                                    otpRefs.current[index] = input;
                                }}
                                style={[
                                    styles.otpBox,
                                    otpErrMsg && styles.otpBoxError
                                ]}
                                placeholder="0"
                                placeholderTextColor="#ccc"
                                keyboardType="numeric"
                                maxLength={1}
                                value={digit}
                                onChangeText={(value) => {
                                    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
                                        const newOtp = [...otp];
                                        newOtp[index] = value;
                                        setOtp(newOtp);
                                        
                                        // Move to next input if value is entered and not last input
                                        if (value && index < 5) {
                                            otpRefs.current[index + 1]?.focus();
                                        }
                                    }
                                }}
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                                        const newOtp = [...otp];
                                        newOtp[index - 1] = '';
                                        setOtp(newOtp);
                                        otpRefs.current[index - 1]?.focus();
                                    }
                                }}
                            />
                        ))}
                    </View>
                    {otpErrMsg && (<Text style={styles.otpErrText}>*Incorrect OTP</Text>)}
                    <TouchableOpacity style={styles.button2} onPress={handleVerify}>
                        {loading === false ?<Text style={styles.buttonText}>Verify</Text>:
                        <ActivityIndicator size="small" color="#007AFF" />}
                    </TouchableOpacity>
                </View>
            )}
            </View>
        </SafeAreaView>
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
    dropdownContainer: {
        marginVertical: 8,
        zIndex: 10,
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    dropdownButtonText: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
    },
    dropdownArrow: {
        fontSize: 12,
        color: "#666",
    },
    dropdownMenu: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: "#fff",
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    dropdownItemSelected: {
        backgroundColor: "#f0f0f0",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#000",
    },
    dropdownItemTextSelected: {
        fontWeight: "700",
        color: "#0084ff",
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
    otpInputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginVertical: 20,
        gap: 8,
    },
    otpBox: {
        flex: 1,
        height: 50,
        borderWidth: 2,
        borderColor: "#0084ff",
        borderRadius: 10,
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        color: "#000",
        backgroundColor: "#f9f9f9",
    },
    otpBoxError: {
        borderColor: "#ff4d4f",
        backgroundColor: "#fff1f0",
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