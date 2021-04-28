/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import DataWedgeIntents from 'react-native-datawedge-intents';
import {
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  StyleProp,
  TextStyle,
  NativeEventEmitter,
} from 'react-native';
import {CheckBox, Button} from 'react-native-elements';

type ScanType = {
  data: string;
  decoder: string;
  timeAtDecode: string;
};

const App = () => {
  const [eventEmitter] = useState(new NativeEventEmitter());
  const [scans, setScans] = useState<ScanType[]>([]);
  const [dwVersionText, setDwVersionText] = useState<string>(
    'Pre 6.3.  Please create and configure profile manually.  See the ReadMe for more details',
  );
  const [activeProfileText, setActiveProfileText] = useState<string>(
    'Requires DataWedge 6.3+',
  );

  const [lastApiText, setLastApiText] = useState<string>(
    'Messages from DataWedge will go here',
  );

  const [enumeratedScannersText, setEnumeratedScannersText] = useState<string>(
    'Requires DataWedge 6.3+',
  );
  const [lastApiVisible, setLastApiVisible] = useState<boolean>(false);

  const [sendCommandResult, setSendCommandResult] = useState<string>('false');

  // checkboxes
  const [checkBoxesDisabled, setCheckBoxesDisabled] = useState<boolean>(true);
  const [ean8checked, setEan8checked] = useState<boolean>(true);
  const [ean13checked, setEan13checked] = useState<boolean>(true);
  const [code39checked, setCode39checked] = useState<boolean>(true);
  const [code128checked, setCode128checked] = useState<boolean>(true);

  const [scanButtonVisible, setScanButtonVisible] = useState<boolean>(false);

  const [dwVersionTextStyle, setDwVersionTextStyle] = useState<
    StyleProp<TextStyle>
  >(styles.itemTextAttention);

  const sendCommand = (extraName: any, extraValue: any) => {
    console.log(
      'Sending Command: ' + extraName + ', ' + JSON.stringify(extraValue),
    );
    const broadcastExtras: any = {};
    broadcastExtras[extraName] = extraValue;
    broadcastExtras.SEND_RESULT = sendCommandResult;
    DataWedgeIntents.sendBroadcastWithExtras({
      action: 'com.symbol.datawedge.api.ACTION',
      extras: broadcastExtras,
    });
  };

  const datawedge63 = () => {
    console.log('Datawedge 6.3 APIs are available');
    //  Create a profile for our application
    sendCommand(
      'com.symbol.datawedge.api.CREATE_PROFILE',
      'ZebraReactNativeDemo',
    );

    setDwVersionText(
      '6.3.  Please configure profile manually.  See ReadMe for more details.',
    );

    //  Although we created the profile we can only configure it with DW 6.4.
    sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');

    //  Enumerate the available scanners on the device
    sendCommand('com.symbol.datawedge.api.ENUMERATE_SCANNERS', '');

    //  Functionality of the scan button is available
    setScanButtonVisible(true);
  };

  const datawedge64 = () => {
    console.log('Datawedge 6.4 APIs are available');

    //  Documentation states the ability to set a profile config is only available from DW 6.4.
    //  For our purposes, this includes setting the decoders and configuring the associated app / output params of the profile.
    setDwVersionText('6.4.');
    setDwVersionTextStyle(styles.itemText);
    //document.getElementById('info_datawedgeVersion').classList.remove("attention");

    //  Decoders are now available
    setCheckBoxesDisabled(false);

    //  Configure the created profile (associated app and keyboard plugin)
    const profileConfig = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {},
      },
      APP_LIST: [
        {
          PACKAGE_NAME: 'com.datawedgereactnative.demo',
          ACTIVITY_LIST: ['*'],
        },
      ],
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig);

    //  Configure the created profile (intent plugin)
    const profileConfig2 = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'INTENT',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
          intent_output_enabled: 'true',
          intent_action: 'com.zebra.reactnativedemo.ACTION',
          intent_delivery: '2',
        },
      },
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig2);

    //  Give some time for the profile to settle then query its value
    setTimeout(() => {
      sendCommand('com.symbol.datawedge.api.GET_ACTIVE_PROFILE', '');
    }, 1000);
  };

  const datawedge65 = () => {
    console.log('Datawedge 6.5 APIs are available');

    setDwVersionText('6.5 or higher.');

    //  Instruct the API to send
    setSendCommandResult('true');
    setLastApiVisible(true);
  };

  const enumerateScanners = (enumeratedScanners: any) => {
    let humanReadableScannerList = '';
    for (let i = 0; i < enumeratedScanners.length; i++) {
      console.log(
        'Scanner found: name= ' +
          enumeratedScanners[i].SCANNER_NAME +
          ', id=' +
          enumeratedScanners[i].SCANNER_INDEX +
          ', connected=' +
          enumeratedScanners[i].SCANNER_CONNECTION_STATE,
      );
      humanReadableScannerList += enumeratedScanners[i].SCANNER_NAME;
      if (i < enumeratedScanners.length - 1) humanReadableScannerList += ', ';
    }
    setEnumeratedScannersText(humanReadableScannerList);
  };

  const activeProfile = (theActiveProfile: string) => {
    setActiveProfileText(theActiveProfile);
    // this.setState(this.state);
  };

  const barcodeScanned = (scanData: any, timeOfScan: any) => {
    const scannedData = scanData['com.symbol.datawedge.data_string'];
    const scannedType = scanData['com.symbol.datawedge.label_type'];
    console.log('Scan: ' + scannedData);
    const newScans = [...scans];
    newScans.unshift({
      data: scannedData,
      decoder: scannedType,
      timeAtDecode: timeOfScan,
    });
    setScans(newScans);
  };

  const broadcastReceiver = (intent: any) => {
    //  Broadcast received
    console.log('Received Intent: ' + JSON.stringify(intent));
    if (intent.hasOwnProperty('RESULT_INFO')) {
      const commandResult =
        intent.RESULT +
        ' (' +
        intent.COMMAND.substring(
          intent.COMMAND.lastIndexOf('.') + 1,
          intent.COMMAND.length,
        ) +
        ')'; // + JSON.stringify(intent.RESULT_INFO);
      setLastApiText(commandResult.toLowerCase());
    }

    if (
      intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_VERSION_INFO')
    ) {
      //  The version has been returned (DW 6.3 or higher).  Includes the DW version along with other subsystem versions e.g MX
      const versionInfo =
        intent['com.symbol.datawedge.api.RESULT_GET_VERSION_INFO'];
      console.log('Version Info: ' + JSON.stringify(versionInfo));
      const datawedgeVersion = versionInfo['DATAWEDGE'];
      console.log('Datawedge version: ' + datawedgeVersion);

      //  Fire events sequentially so the application can gracefully degrade the functionality available on earlier DW versions
      if (datawedgeVersion >= '6.3') datawedge63();
      if (datawedgeVersion >= '6.4') datawedge64();
      if (datawedgeVersion >= '6.5') datawedge65();

      //this.setState(this.state);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS',
      )
    ) {
      //  Return from our request to enumerate the available scanners
      const enumeratedScannersObj =
        intent['com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS'];
      enumerateScanners(enumeratedScannersObj);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE',
      )
    ) {
      //  Return from our request to obtain the active profile
      const activeProfileObj =
        intent['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
      activeProfile(activeProfileObj);
    } else if (!intent.hasOwnProperty('RESULT_INFO')) {
      //  A barcode has been scanned
      barcodeScanned(intent, new Date().toLocaleString());
    }
  };

  //   useEffect(() => {
  //     DeviceEventEmitter.addListener('datawedge_broadcast_intent', broadcastReceiver})
  //   }, []);

  const registerBroadcastReceiver = () => {
    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: [
        'com.zebra.reactnativedemo.ACTION',
        'com.symbol.datawedge.api.RESULT_ACTION',
      ],
      filterCategories: ['android.intent.category.DEFAULT'],
    });
  };

  const determineVersion = () => {
    sendCommand('com.symbol.datawedge.api.GET_VERSION_INFO', '');
  };

  useEffect(() => {
    eventEmitter.addListener('datawedge_broadcast_intent', broadcastReceiver);
    registerBroadcastReceiver();
    determineVersion();
    return () =>
      eventEmitter.removeListener(
        'datawedge_broadcast_intent',
        broadcastReceiver,
      );
  }, [broadcastReceiver, determineVersion, registerBroadcastReceiver]);

  const setDecoders = () => {
    //  Set the new configuration
    const profileConfig = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        PARAM_LIST: {
          scanner_selection: 'auto',
          decoder_ean8: '' + ean8checked,
          decoder_ean13: '' + ean13checked,
          decoder_code128: '' + code128checked,
          decoder_code39: '' + code39checked,
        },
      },
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig);
  };

  const _onPressScanButton = () => {
    sendCommand(
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER',
      'TOGGLE_SCANNING',
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: 'red', flexGrow: 1}}>
      <View style={styles.container}>
        <Text style={styles.h1}>Zebra ReactNative DataWedge Demo</Text>
        <Text style={styles.h3}>Information / Configuration</Text>
        <Text style={styles.itemHeading}>DataWedge version:</Text>
        <Text style={dwVersionTextStyle}>{dwVersionText}</Text>
        <Text style={styles.itemHeading}>Active Profile</Text>
        <Text style={styles.itemText}>{activeProfileText}</Text>
        {lastApiVisible && (
          <Text style={styles.itemHeading}>Last API message</Text>
        )}
        {lastApiVisible && <Text style={styles.itemText}>{lastApiText}</Text>}
        <Text style={styles.itemHeading}>Available scanners:</Text>
        <Text style={styles.itemText}>{enumeratedScannersText}</Text>
        <View style={{flexDirection: 'row', flex: 1}}>
          <CheckBox
            title="EAN 8"
            checked={ean8checked}
            disabled={checkBoxesDisabled}
            onPress={() => {
              setEan8checked(currentValue => !currentValue);
              setDecoders();
              //this.setState(this.state);
            }}
          />
          <CheckBox
            title="EAN 13"
            checked={ean13checked}
            disabled={checkBoxesDisabled}
            onPress={() => {
              setEan13checked(currentValue => !currentValue);
              setDecoders();
              //this.setState(this.state);
            }}
          />
        </View>
        <View style={{flexDirection: 'row', flex: 1}}>
          <CheckBox
            title="Code 39"
            checked={code39checked}
            disabled={checkBoxesDisabled}
            onPress={() => {
              setCode39checked(currentValue => !currentValue);
              setDecoders();
              //this.setState(this.state);
            }}
          />
          <CheckBox
            title="Code 128"
            checked={code128checked}
            disabled={checkBoxesDisabled}
            onPress={() => {
              setCode128checked(currentValue => !currentValue);
              setDecoders();
              //this.setState(this.state);
            }}
          />
        </View>
        {scanButtonVisible && (
          <Button
            title="Scan"
            buttonStyle={{
              backgroundColor: '#ffd200',
              height: 45,
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 5,
            }}
            onPress={_onPressScanButton}
          />
        )}

        <Text style={styles.itemHeading}>
          Scanned barcodes will be displayed here:
        </Text>

        <FlatList
          data={scans}
          keyExtractor={item => item.timeAtDecode}
          renderItem={({item, separators}) => (
            <TouchableHighlight
              onShowUnderlay={separators.highlight}
              onHideUnderlay={separators.unhighlight}>
              <View
                style={{
                  backgroundColor: '#0077A0',
                  margin: 10,
                  borderRadius: 5,
                }}>
                <View style={{flexDirection: 'row', flex: 1}}>
                  <Text style={styles.scanDataHead}>{item.decoder}</Text>
                  <View style={{flex: 1}}>
                    <Text style={styles.scanDataHeadRight}>
                      {item.timeAtDecode}
                    </Text>
                  </View>
                </View>
                <Text style={styles.scanData}>{item.data}</Text>
              </View>
            </TouchableHighlight>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //    justifyContent: 'center',
    //    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  h1: {
    fontSize: 20,
    textAlign: 'center',
    margin: 5,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 14,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
  },
  itemHeading: {
    fontSize: 12,
    textAlign: 'left',
    left: 10,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 12,
    textAlign: 'left',
    margin: 10,
  },
  itemTextAttention: {
    fontSize: 12,
    textAlign: 'left',
    margin: 10,
    backgroundColor: '#ffd200',
  },
  scanDataHead: {
    fontSize: 10,
    margin: 2,
    fontWeight: 'bold',
    color: 'white',
  },
  scanDataHeadRight: {
    fontSize: 10,
    margin: 2,
    textAlign: 'right',
    fontWeight: 'bold',
    color: 'white',
  },
  scanData: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 2,
    color: 'white',
  },
});
export default App;
