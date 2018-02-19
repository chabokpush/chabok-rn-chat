import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TextInput,
    Image,
    KeyboardAvoidingView,
    StatusBar,
    TouchableOpacity,
} from 'react-native';

export default class Register extends React.Component {

    state = {
        phone: ''
    }

    closeModal() {
    }

    render() {
        const {visible, onRegister} = this.props;
        const {phone} = this.state;
        return <Modal
            onRequestClose={() => this.closeModal()}
            animationType={'slide'}
            visible={visible}>
            <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
                <View style={styles.loginContainer}>
                    <StatusBar barStyle="light-content"/>
                    <Image
                        source={{uri: 'https://sandbox.push.adpdigital.com/assets/images/chabok-logo-big.png'}}
                        style={{
                            width: 200,
                            height: 200,
                        }}/>
                </View>
                <View style={styles.formContainer}>
                    <TextInput style={styles.input}
                               autoCapitalize="none"
                               onChangeText={phone => this.setState({phone})}
                               autoCorrect={false}
                               keyboardType='numeric'
                               returnKeyType="done"
                               placeholder='Mobile Number'
                               placeholderTextColor='rgba(225,225,225,0.7)'/>
                    <TouchableOpacity style={styles.buttonContainer} onPress={_ => onRegister(phone)}>
                        <Text style={styles.buttonText}>LOGIN</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    }
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#214559',
    },
    formContainer: {
        padding: 40
    },
    loginContainer: {
        alignItems: 'center',
        flexGrow: 0,
        justifyContent: 'center'
    },
    input: {
        height: 40,
        backgroundColor: '#578098',
        color: 'white',
        width: 300,
        borderRadius: 50,
        textAlign: 'center',
        marginBottom: 10
    },
    buttonContainer: {
        height: 40,
        backgroundColor: 'rgba(5, 122, 255, 1)',
        paddingTop: 12,
        width: 300,
        borderRadius: 50,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '700',
        justifyContent: 'center',
        alignItems: 'center',
    },

})
