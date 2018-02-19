import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableWithoutFeedback,
} from 'react-native';

const {EventEmitter} = require('fbemitter');
const emitter = new EventEmitter();

/**
 * Generate color from string
 * @param str
 * @return {string}
 */
export const stringToColour = str => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
};

/**
 * Slice end of string
 * @param str
 * @param len
 */
export const sliceEndOfString = (str, len) => {
    const strLen = str.length;
    return str.slice(strLen - len, strLen)
}

/**
 * Detect overlay color base on background color
 * @param color
 * @return {string}
 */
const overlayColor = color => {
    //if only first half of color is defined, repeat it
    if (color.length < 5) {
        color += color.slice(1);
    }
    return (color.replace('#', '0x')) > (0xffffff / 2) ? '#16313e' : '#fff';
};


const Circle = ({children, isCurrentUser}) => (
    <View style={{
        width: 44,
        height: 44,
        borderRadius: 44 / 2,
        marginLeft: 10,
        backgroundColor: stringToColour(children),
        borderWidth: isCurrentUser ? 2 : 0,
        borderColor: '#fff'
    }}>
        <TouchableWithoutFeedback
            onPress={_ => emitter.emit('changeUser', children)}
            onLongPress={_ => emitter.emit('removeUser', children)}
        >
            <View>
                <Text style={{
                    lineHeight: 44,
                    textAlign: 'center',
                    color: overlayColor(stringToColour(children))
                }}>
                    {sliceEndOfString(children, 3)}
                </Text>
            </View>
        </TouchableWithoutFeedback>
    </View>
);

export const Users = ({list, current}) => (
    list.length ? <View style={styles.scrollView}>
        <ScrollView
            alwaysBounceHorizontal={true}
            horizontal={true}
            contentContainerStyle={styles.contentContainer}
        >
            {list.map((val, key) => <Circle key={key} isCurrentUser={current === val}>{val}</Circle>)}
        </ScrollView>
    </View> : null
);

export default Users;
export const userOnChange = emitter;


const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: '#17313e',
    },
    contentContainer: {
        paddingVertical: 10,
    },
    user: {
        width: 44,
        height: 44,
        borderRadius: 44 / 2,
        backgroundColor: 'red',
        marginLeft: 10
    }
})
