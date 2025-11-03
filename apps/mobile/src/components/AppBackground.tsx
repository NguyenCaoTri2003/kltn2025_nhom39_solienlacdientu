import React, { PropsWithChildren } from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { API_URL } from '../constants/config';

import { LinearGradient } from 'expo-linear-gradient';

type AppBackgroundProps = PropsWithChildren<{
    containerStyle?: StyleProp<ViewStyle>;
    imageSource?: ImageSourcePropType;
    imageOpacity?: number;
    imageHeightRatio?: number; 
}>;

export default function AppBackground({
    children,
    containerStyle,
    imageSource,
    imageOpacity = 0.45,
    imageHeightRatio = 0.5,
}: AppBackgroundProps) {
    const { width, height } = useWindowDimensions();
    const imageHeight = Math.max(0, Math.min(1, imageHeightRatio)) * height;

    return (
        <View style={[styles.container, containerStyle]}
        >
            <LinearGradient
                colors={[
                    'rgba(158, 219, 252, 0.8)',
                    'rgba(185, 230, 255, 0.4)',
                    'rgba(255, 255, 255, 0.9)',
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.topGradient, { height: height / 6 }]}
                pointerEvents="none"
            />

            <Image
                source={
                    imageSource ?? require('../../assets/backgroud.png')
                }
                resizeMode="cover"
                style={[
                    styles.bottomImage,
                    {
                        width: width * 1.2,
                        height: imageHeight,
                        opacity: imageOpacity,
                    },
                ]}
            />

            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 0,
        overflow: 'hidden',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    bottomImage: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    content: {
        flex: 1,
    },
});


