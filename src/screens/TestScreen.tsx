import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';

import globalStyles from 'constants/styles';
import {DaiCoinBalance} from 'components/Transfer/DaiCoinBalance';
import Spacer from 'components/Spacer';
import {TransferInput} from 'components/Transfer/TransferInput';
import {TransferConfirmationModal} from 'components/Transfer/TransferConfirmationModal';
import {SubmitTransfer} from 'components/Transfer/SubmitTransfer';
import {TWithdrawHistory, WithdrawHistory} from 'components/Transfer/WithdrawHistory';
import {QrReader} from 'components/QrReader/QrReader';

const history: TWithdrawHistory[] = [
  {
    id: '1',
    amount: '20.00000000000',
    date: new Date().toDateString(),
    txHash: '001213213213',
  },
  {
    id: '2',
    amount: '20.00',
    date: new Date().toDateString(),
    txHash: '001213213213',
  },
  {
    id: '3',
    amount: '20.00',
    date: new Date().toDateString(),
    txHash: '001213213213',
  },
  {
    id: '4',
    amount: '20.00',
    date: new Date().toDateString(),
    txHash: '00121321321adfsdfdsafsadfsdfads3',
  },
];

export function TestScreen() {
  const [confirming, setConfirming] = useState(true);
  const {t} = useTranslation();
  const [myWallet, setMyWallet] = useState('asdfdsfdsfdsafsdafdasfadsfsdassfsdfsdArmin');
  const [goalWallet, setGoalWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [showQrReader, setShowQrReader] = useState(false);

  useEffect(() => {
    console.log({showQrReader});
  }, [showQrReader]);

  const handlePasteClipboard = async () => {
    const text = await Clipboard.getString();
    setGoalWallet(text);
  };

  const handleShowQrReader = () => setShowQrReader(true);

  const handleSubmit = () => {
    console.log(
      {
        myWallet,
        goalWallet,
        amount,
      },
      'form data is here',
    );
  };

  const handleScanQrCode = data => {
    console.log(data, 'qrCode data is here');
    setGoalWallet(data.data);
    setShowQrReader(false);
  };

  const handleCloseQrCode = () => setShowQrReader(false);

  if (showQrReader) {
    return <QrReader handleScan={handleScanQrCode} handleDismiss={handleCloseQrCode} />;
  }

  return (
    <SafeAreaView style={globalStyles.fill}>
      <ScrollView>
        {confirming && (
          <TransferConfirmationModal
            onCancel={() => setConfirming(false)}
            onConfirm={() => setConfirming(false)}
            address="sfdfdsafsdafsadfadsfasdfsdffsdfdasfadsfasdffasf"
            amount="5.34 DAI"
          />
        )}
        <View style={[globalStyles.fill, globalStyles.screenView, globalStyles.pt3, globalStyles.alignItemsCenter]}>
          <DaiCoinBalance name="treejer" balance="30" basePrice="1.00" description />
          <Spacer />
          <DaiCoinBalance name="stablecoin" balance="10" basePrice="1.00" description />
          <Spacer />
          <DaiCoinBalance name="treejer" balance="30" basePrice="1.00" description open={false} />
          <Spacer />
          <DaiCoinBalance name="stablecoin" balance="10" basePrice="1.00" open={false} />
          <Spacer />
          <WithdrawHistory withdrawHistory={history} />
          <TransferInput
            label="from"
            value={`${myWallet.slice(0, 10)}...${myWallet.slice(myWallet.length - 3)}`}
            onChangeText={setMyWallet}
            disabled
          />
          <Spacer />
          <TransferInput
            label="to"
            value={goalWallet}
            onChangeText={setGoalWallet}
            onPaste={handlePasteClipboard}
            placeholder={t('transfer.form.toHolder')}
            openQRReader={handleShowQrReader}
          />
          <Spacer />
          <TransferInput
            label="amount"
            value={amount}
            onChangeText={setAmount}
            placeholder={t('transfer.form.amountHolder')}
            preview="0.00"
          />
          <TransferInput
            label="amount"
            value=""
            placeholder={t('transfer.form.amountHolder')}
            preview="0.00"
            disabled
          />
          <Spacer times={10} />
          <SubmitTransfer
            disabled={true}
            hasHistory={false}
            onHistory={() => console.log('history pressed')}
            onSubmit={() => console.log('submit pressed')}
            onCancel={() => console.log('cancel pressed')}
          />
          <Spacer />
          <SubmitTransfer
            disabled={true}
            hasHistory={true}
            onHistory={() => console.log('history pressed')}
            onSubmit={() => console.log('submit pressed')}
            onCancel={() => console.log('cancel pressed')}
          />
          <Spacer />
          <SubmitTransfer
            disabled={false}
            hasHistory={true}
            onHistory={() => console.log('history pressed')}
            onSubmit={handleSubmit}
            onCancel={() => console.log('cancel pressed')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
