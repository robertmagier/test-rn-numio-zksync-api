import "react-native-get-random-values"
import "@ethersproject/shims"
import { ethers } from "ethers";

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

const App = () => {
    const [content, setContent] = useState(null);
    const [length, setLength] = useState(0);

    useEffect(() => {
        (async () => {
            const start = new Date().getTime();
            const wallet = await ethers.Wallet.createRandom();
            setContent(wallet);
            const end = new Date().getTime();
            setLength((end - start) / 1000);
        })();
    }, [])

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Text
                style={{
                    color: 'black',
                    fontSize: 20,
                    paddingHorizontal: 20
                }}
            >{`Length: ${length}\n${JSON.stringify(content)}`}</Text>
        </View>
    )
}

export default App;