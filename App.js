import './shim';
import crypto from 'crypto';
import eccrypto from 'eccrypto';

import 'react-native-get-random-values';
import '@ethersproject/shims';

import ZKAPI from '@teamnumio/numio-zksync-api';

console.log(ZKAPI);
// const hdkey = require('ethereumjs-wallet-react-native/hdkey');
// console.log('hdkey:', hdkey);
// const privateKey = hdkey.fromMasterSeed('random')._hdkey._privateKey;
// console.log(privateKey);
// console.log(crypto.randomBytes);
window.randomBytes = crypto.randomBytes;

// console.log(global.window);
import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';

const App = () => {
  const [content, setContent] = useState(null);
  const [length, setLength] = useState(0);

  useEffect(() => {
    (async () => {
      let zkSyncApi = new ZKAPI(
        'rinkebyHttps',
        '0x221e32d54236843f8504a52b4289dec3695800d27f25b497e22193ab2165efcd',
      );
      await zkSyncApi.init();

      // let addressData = Wallet.generate();
      // console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
      // console.log('wallet:', Wallet);
      // console.log('wallet:', w);

      const start = new Date().getTime();
      console.log('Create new .....!!@@');
      let wallet = await zkSyncApi.createNew();
      console.log('PK from eccrypto:', wallet.privateKey);
      // let tData = await Wallet.generate();
      // console.log('PKs:', tData.getPrivateKeyString());
      const end = new Date().getTime();
      // console.log('Wallet:', Wallet);
      // console.log('PK:', tData.getPrivateKeyString());
      // let addressData = tData.getPrivateKeyString();
      let addressData = wallet.privateKey;

      setContent(addressData);
      setLength((end - start) / 1000);
      console.log('PK generation: ', end - start);
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: 'black',
          fontSize: 20,
          paddingHorizontal: 20,
        }}>{`Length: ${length}\n${JSON.stringify(content)}`}</Text>
    </View>
  );
};

export default App;
