import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    AsyncStorage,
    Image,
    AppState
} from 'react-native';
import NavBar, {NavButton, NavButtonText, NavTitle} from 'react-native-nav'
import chabokpush from 'chabokpush-rn';
import {GiftedChat} from 'react-native-gifted-chat'
import Prompt from './components/prompt';
import Register from './components/register';
import Users, {userOnChange} from './components/users';

var PushNotification = require('react-native-push-notification');

export default class App extends React.Component {
    state = {
        chabokStatus: 'offline',
        messages: [],
        phone: '',
        currentUser: '',
        newUser: '',
        archive: {},
        users: [],
        modalVisible: false,
        userPromptVisible: false,
        appState: AppState.currentState
    }

    componentWillMount() {
        AsyncStorage.getItem('app-state').then(state => {
            this.setState(Object.assign({}, this.state, JSON.parse(state)))
        });
    }

    initChabok() {
        const authConfig = {
            appId: 'chabok-starter',
            apiKey: 'ae98537a4fb4957277374083a356d2ceb63372c4',
            username: 'chabok-starter',
            password: 'chabok-starter',
            devMode: true
        };
        const options = {
            webpush: {
                enabled: false
            },
            silent: true,
        };
        this.chabok = new chabokpush(authConfig, options);
        this.setupChabokListener();
        this.chabok
            .getUserId()
            .then(res => {
                this.chabok.register(res);
            })
            .catch(_ => this.setState({modalVisible: true}))
    }


    initPushNotification() {
        PushNotification.configure({
            onRegister: function (token) {
                console.log('TOKEN:', token);
            },
            permissions: {
                alert: true,
                badge: true,
                sound: true
            },
            popInitialNotification: true,
            requestPermissions: true,
        });
    }

    componentDidMount() {
        const {users} = this.state;
        this.initPushNotification();
        this.initChabok();

        AppState.addEventListener('change', this._handleAppStateChange);

        if (!users.length) {
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, {
                    _id: 1,
                    text: 'Please add a new user to start chatting',
                    createdAt: new Date(Date.UTC(2016, 5, 11, 17, 20, 0)),
                    system: true,
                }),
            }))
        }

        userOnChange.addListener('changeUser', phone => {
            this.userChange(phone)
        });

        userOnChange.addListener('removeUser', phone => {
            const {users, archive} = this.state;
            const usersArray = [].concat(users);
            const archiveObj = Object.assign({}, archive);
            const index = usersArray.indexOf(phone);
            delete archiveObj[phone];
            usersArray.splice(index, 1);

            if (index !== -1) {
                this.setState({
                    users: usersArray,
                    archive: archiveObj
                })
            }
        });
    }

    _handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!')
        }
        this.setState({appState: nextAppState});
    }

    componentWillUpdate(nextProps, nextState) {
        const state = Object.assign({}, this.state, nextState);
        AsyncStorage.setItem('app-state', JSON.stringify(state))
    }


    userChange(phone) {
        const {currentUser, messages, archive} = this.state;
        const archiveObj = Object.assign({}, archive, {[currentUser]: messages});
        this.setState({
            archive: archiveObj,
            messages: archiveObj[phone] || [],
            currentUser: phone
        })
    }


    onRegister(phone) {
        if (!phone) return;
        this.chabok.register(phone);
        this.setState({modalVisible: false, phone})
    };

    unRegister() {
        this.chabok.unregister();
        this.setState({
            chabokStatus: 'offline',
            messages: [],
            phone: '',
            currentUser: '',
            newUser: '',
            archive: {},
            users: [],
            modalVisible: true,
            userPromptVisible: false
        })
    }


    sendLocalPushNotification(msg, user) {
        PushNotification.localNotification({
            /* Android Only Properties */
            ticker: "My Notification Ticker", // (optional)
            autoCancel: true, // (optional) default: true
            largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
            smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
            bigText: msg.content, // (optional) default: "message" prop
            color: "red", // (optional) default: system default
            vibrate: true, // (optional) default: true
            vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
            group: "group", // (optional) add group to message
            ongoing: false, // (optional) set whether this is an "ongoing" notification
            title: `New message from ${user}`, // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
            message: msg.content, // (required)
            playSound: true, // (optional) default: true
            soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
        })
    }


    setupChabokListener() {

        this.chabok.on('connecting', _ => {
            this.setState({
                chabokStatus: 'Connecting ...'
            })
        });

        this.chabok.on('disconnected', _ => {
            this.setState({
                chabokStatus: 'Offline'
            })
        })
        this.chabok.on('message', msg => {
            const {users, currentUser} = this.state;
            const phone = msg && msg.publishId && msg.publishId.split('/')[0];

            if (phone && users.indexOf(phone) === -1) {
                this.setState({
                    users: [...users, phone]
                });
            }
            phone && this.userChange(phone);

            if (this.state.appState.match(/inactive|background/)) {
                this.sendLocalPushNotification(msg, currentUser);
            }
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, [
                    {
                        _id: msg.id,
                        text: msg.content,
                        createdAt: msg.createdAt,
                        user: {
                            _id: currentUser,
                            name: phone,
                            avatar: 'https://sandbox.push.adpdigital.com/assets/images/chabok-logo-big.png',
                        }
                    }
                ]),
            }))
        })
        this.chabok.on('connected', _ => {
            this.setState({
                chabokStatus: 'Connected'
            })
        });
    }

    bulbColorHandler() {
        const {chabokStatus} = this.state;

        return <Text
            style={{
                fontSize: 10,
                color: chabokStatus === 'Connected' ? 'green' : chabokStatus === 'Connecting . . .' ? 'orange' : 'red'
            }}>&#9679;</Text>
    }

    onSend(messages = []) {
        const {currentUser} = this.state;
        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, messages),
        }));
        this.chabok.publish({
            content: messages[0].text,
            channel: "default",
            user: currentUser
        })
    }

    addUser() {
        this.setState({
            userPromptVisible: true
        })
    }

    render() {
        const {chabokStatus, users, currentUser, modalVisible, userPromptVisible, newUser, phone, messages} = this.state;

        return (
            <View style={styles.container}>
                <NavBar
                    style={navBarStyles}
                    statusBar={{barStyle: 'light-content'}}>
                    <NavButton onPress={() => this.addUser()}>
                        <Image style={{width: 25}}
                               resizeMode={"contain"}
                               source={require('./static/add.png')}
                        />
                    </NavButton>
                    <NavTitle style={navBarStyles.title}>
                        {this.bulbColorHandler()}
                        <Text> {chabokStatus} </Text>
                    </NavTitle>
                    <NavButton onPress={() => this.unRegister()}>
                        <Image style={{width: 25}}
                               resizeMode={"contain"}
                               source={require('./static/logout.png')}
                        />
                    </NavButton>
                </NavBar>
                <Users list={users} current={currentUser}/>
                <Register visible={modalVisible} onRegister={phone => this.onRegister(phone)}/>
                <Prompt
                    title="New user"
                    placeholder="Please enter user phone number"
                    visible={userPromptVisible}
                    submitText="Add"
                    cancelText="Cancel"
                    onCancel={() => this.setState({
                        userPromptVisible: false,
                        newUser: ''
                    })}
                    onSubmit={() => {
                        this.setState({
                            userPromptVisible: false,
                            users: [...users, newUser],
                            currentUser: newUser
                        });
                        this.userChange(newUser);
                    }}
                    onChangeText={newUser => this.setState({
                        newUser
                    })}
                />
                <GiftedChat
                    isAnimated={true}
                    user={{
                        _id: phone,
                        name: phone,
                    }}
                    messages={messages}
                    renderLoading={() => <ActivityIndicator size="large" color="#0000ff"/>}
                    onSend={messages => this.onSend(messages)}
                />

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    innerContainer: {
        alignItems: 'center',
    },

});

const navBarStyles = StyleSheet.create({
    statusBar: {
        backgroundColor: '#214559',
    },
    navBar: {
        backgroundColor: '#214559',
    },
    title: {
        color: '#fff',
    },
    buttonText: {
        color: '#b5b5b5',
    },
})
