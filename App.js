import React, { useState } from "react";
import { View, Text, Button, TextInput, Modal } from "react-native";
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

NfcManager.start();

export default function App() {
  const [text, setText] = useState("")
  const [modalVisibility, setModalVisibility] = useState(false)

  async function writeNdef() {
    try {
      Platform.OS === 'ios' ? null : setModalVisibility(true);
      let tech = Platform.OS === 'ios' ? NfcTech.MifareIOS : NfcTech.NfcA;
      let resp = await NfcManager.requestTechnology(tech);

      let fullLength = text.length + 7;
      let payloadLength = text.length + 3;

      let cmd = Platform.OS === 'ios' ? NfcManager.sendMifareCommandIOS : NfcManager.transceive;

      resp = await cmd([0xA2, 0x04, 0x03, fullLength, 0xD1, 0x01]); // 0x0C is the length of the entry with all the fluff (bytes + 7)
      resp = await cmd([0xA2, 0x05, payloadLength, 0x54, 0x02, 0x65]); // 0x54 = T = Text block, 0x08 = length of string in bytes + 3

      let currentPage = 6;
      let currentPayload = [0xA2, currentPage, 0x6E];

      for (let i = 0; i < text.length; i++) {
        currentPayload.push(text.charCodeAt(i));
        if (currentPayload.length == 6) {
          resp = await cmd(currentPayload);
          currentPage += 1;
          currentPayload = [0xA2, currentPage];
        }
      }

      currentPayload.push(254);
      while (currentPayload.length < 6) {
        currentPayload.push(0);
      }

      resp = await cmd(currentPayload);
      console.log(resp)

    } catch (error) {
      console.warn("Oops!", error)
    } finally {
      Platform.OS === 'ios' ? null : setModalVisibility(false);
    }
  }
  async function readNdef() {
    try {
      Platform.OS === 'ios' ? null : setModalVisibility(true);
      let tech = Platform.OS === 'ios' ? NfcTech.MifareIOS : NfcTech.NfcA;
      let resp = await NfcManager.requestTechnology(tech);

      let cmd = Platform.OS === 'ios' ? NfcManager.sendMifareCommandIOS : NfcManager.transceive;

      resp = await cmd([0x3A, 4, 4]);
      let payloadLength = parseInt(resp.toString().split(",")[1]);
      let payloadPages = Math.ceil(payloadLength / 4);
      let startPage = 5;
      let endPage = startPage + payloadPages - 1;

      resp = await cmd([0x3A, startPage, endPage]);
      bytes = resp.toString().split(",");
      let text = "";

      for (let i = 0; i < bytes.length; i++) {
        if (i < 5) {
          continue;
        }
        if (parseInt(bytes[i]) === 254) {
          break;
        }
        text = text + String.fromCharCode(parseInt(bytes[i]));
      }
      console.warn(text)
    } catch (error) {
      console.warn("Oops!", error)
    } finally {
      Platform.OS === 'ios' ? null : setModalVisibility(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Modal visible={modalVisibility} transparent={true}>
        <View style={{
          flex:1,
          justifyContent:'center',
          alignItems:'center',
        }}>
          <View style={{
            flex:1,
            justifyContent:'center',
            alignItems:'center',
            backgroundColor:'white',
            width:200,
            margin:320,
            borderRadius:5
            }}>
            <Text>Aguardando a leitura</Text>
            <Text>da TAG NFC</Text>
          </View>
        </View>
      </Modal>
      <View>
        <Text style={{ padding: 20, fontSize: 22 }}>Write on an NFC TAG</Text>
        <TextInput
          style={{ borderColor: 'black', borderWidth: 1, borderRadius: 5 }}
          maxLength={20}
          onChangeText={(string) => {
            setText(string)
          }}
          value={text}
        />
        <View style={{ paddingTop: 20, display: 'flex', alignItems: 'center' }}>
          <View style={{ width: 225 }}>
            <Button title="Write" onPress={writeNdef} />
          </View>
        </View>
      </View>
      <View>
        <Text style={{ padding: 20, fontSize: 22 }}>Scan an NFC TAG</Text>
        <Button title="Read" onPress={readNdef} />
      </View>
    </View>

  );
};


