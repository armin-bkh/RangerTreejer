import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {TFunction, useTranslation} from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import {useNavigation} from '@react-navigation/native';
import {useForm} from 'react-hook-form';
import * as Yup from 'yup';
import {yupResolver} from '@hookform/resolvers/yup';
import BN from 'bn.js';
import Web3 from 'web3';

import {TransferInput} from 'components/Withdraw/TransferInput';
import {QrReader} from 'components/QrReader/QrReader';
import Spacer from 'components/Spacer';
import {SubmitTransfer} from 'components/Withdraw/SubmitTransfer';
import {TransferConfirmationModal} from 'components/Withdraw/TransferConfirmationModal';
import globalStyles from 'constants/styles';
import {Routes} from 'navigation';

export type TTransferFormData = {
  from: string;
  to: string;
  amount: string;
};

export type TTransferFormError = {
  to?: string;
  amount?: string;
};

export type TTransferFormTouched = {
  to?: boolean;
  amount?: boolean;
};

export type TTransferFormProps = {
  fee: string | number | null;
  daiBalance: string | BN;
  userWallet: string;
  submitting: boolean;
  hasHistory: boolean;
  handleSubmitTransaction: (data: TTransferFormData) => void;
  handleEstimateGasPrice: (data: TTransferFormData) => void;
  handleCancelTransaction: () => void;
};

const schema = (maxAmount: string | BN | number, t: TFunction<'translation', undefined>) =>
  Yup.object().shape({
    to: Yup.string()
      .required(t('transfer.formError.required', {field: t('transfer.form.toHolder')}))
      .min(42, t('transfer.formError.length42'))
      .max(60, t('transfer.formError.length60')),
    amount: Yup.string()
      .required(t('transfer.formError.required', {field: t('transfer.form.amountHolder')}))
      .test('bigger-than-dai', t('transfer.formError.lowerThanZero'), (value?: string | number) => {
        if (!value) {
          return false;
        }
        value = Number(Web3.utils.toWei(value as string));
        return value > 0;
      })
      .test('lower-than-dai', t('transfer.formError.biggerThanDai'), (value?: string | number) => {
        if (value && value !== '0') {
          value = Number(Web3.utils.toWei(value as string));
          maxAmount = Number(maxAmount);
          return value <= maxAmount;
        } else {
          return false;
        }
      }),
  });

export function TransferForm(props: TTransferFormProps) {
  const {
    fee,
    userWallet,
    daiBalance,
    submitting,
    hasHistory,
    handleSubmitTransaction,
    handleEstimateGasPrice,
    handleCancelTransaction,
  } = props;

  const [showQrReader, setShowQrReader] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const {t} = useTranslation();
  const navigation = useNavigation();

  const defaultValues = useMemo(() => ({from: userWallet, to: '', amount: ''}), []);

  const {control, handleSubmit, formState, getValues, setValue, reset} = useForm<TTransferFormData>({
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema(daiBalance.toString(), t)),
    defaultValues,
  });

  const handleSubmitTransfer = useCallback(data => {
    console.log(data, 'transfer form data is here');
    setShowConfirmModal(false);
    handleSubmitTransaction(data);
  }, []);

  const handleResetForm = useCallback(() => {
    reset(defaultValues);
  }, []);

  const handlePasteClipboard = useCallback(async () => {
    const text = await Clipboard.getString();
    console.log(text);
    setValue('to', text, {shouldTouch: true, shouldValidate: true});
  }, []);

  const handleScanQrCode = useCallback((data: string) => {
    setValue('to', data, {shouldTouch: true, shouldValidate: true});
    setShowQrReader(false);
  }, []);

  const handleOpenQrReader = useCallback(() => {
    setShowQrReader(true);
  }, []);

  const handleCloseQrReader = useCallback(() => {
    setShowQrReader(false);
  }, []);

  const handleCalcMacAmount = useCallback(() => {
    setValue('amount', Web3.utils.fromWei(daiBalance), {shouldTouch: true, shouldValidate: true});
  }, []);

  const handleEstimate = useCallback(() => {
    setShowConfirmModal(true);
    handleEstimateGasPrice(getValues());
  }, [handleEstimateGasPrice]);

  const handleCloseConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
    handleCancelTransaction();
  }, []);

  const handleNavigateHistory = useCallback(() => {
    // @ts-ignore
    navigation.navigate(Routes.WithdrawHistory);
  }, [navigation]);

  useEffect(() => {
    if (!submitting && formState.isValid) {
      handleResetForm();
    }
  }, [submitting]);

  if (showQrReader) {
    return <QrReader handleScan={handleScanQrCode} handleDismiss={handleCloseQrReader} />;
  }

  return (
    <View style={globalStyles.alignItemsCenter}>
      {showConfirmModal ? (
        <TransferConfirmationModal
          onConfirm={handleSubmit(handleSubmitTransfer)}
          onCancel={handleCloseConfirmModal}
          amount={getValues().amount}
          address={getValues().to}
          fee={fee}
        />
      ) : null}
      <Spacer times={4} />
      <TransferInput control={control} name="from" label="from" disabled />
      <Spacer />
      <TransferInput
        control={control}
        name="to"
        label="to"
        disabled={submitting}
        placeholder={t('transfer.form.toHolder')}
        onPaste={handlePasteClipboard}
        openQRReader={handleOpenQrReader}
        error={formState.touchedFields.to && formState.errors.to ? formState.errors.to.message : undefined}
      />
      <Spacer />
      <TransferInput
        control={control}
        name="amount"
        label="amount"
        disabled={submitting}
        placeholder={t('transfer.form.amountHolder')}
        preview={getValues('amount')}
        calcMax={handleCalcMacAmount}
        error={formState.touchedFields.amount && formState.errors.amount ? formState.errors.amount.message : undefined}
      />
      <Spacer times={8} />
      <SubmitTransfer
        hasHistory={hasHistory}
        disabled={!formState.isValid}
        loading={submitting}
        onCancel={handleResetForm}
        onSubmit={handleEstimate}
        onHistory={handleNavigateHistory}
      />
    </View>
  );
}
