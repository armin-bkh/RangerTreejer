import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import RefreshControl from 'components/RefreshControl/RefreshControl';
import globalStyles from 'constants/styles';
import {colors} from 'constants/values';
import ShimmerPlaceholder from 'components/ShimmerPlaceholder';
import Button from 'components/Button';
import Spacer from 'components/Spacer';
import Avatar from 'components/Avatar';
import {useConfig, usePlanterFund, useWalletAccount, useWalletWeb3} from 'services/web3';
import {useCurrentUser, UserStatus} from 'services/currentUser';
import usePlanterStatusQuery from 'utilities/hooks/usePlanterStatusQuery';
import {useTranslation} from 'react-i18next';
import Invite from 'screens/Profile/screens/MyProfile/Invite';
import {useAnalytics} from 'utilities/hooks/useAnalytics';
import Clipboard from '@react-native-clipboard/clipboard';
import AppVersion from 'components/AppVersion';
import useNetInfoConnected from 'utilities/hooks/useNetInfo';
import {useSettings} from 'services/settings';
import {sendTransactionWithGSN} from 'utilities/helpers/sendTransaction';
import {ContractType} from 'services/config';
import {Routes, UnVerifiedUserNavigationProp, VerifiedUserNavigationProp} from 'navigation';
import {AlertMode, showAlert} from 'utilities/helpers/alert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {isWeb} from 'utilities/helpers/web';
import PullToRefresh from 'components/PullToRefresh/PullToRefresh';
import {useTreeUpdateInterval} from 'utilities/hooks/treeUpdateInterval';
import useRefer from 'utilities/hooks/useDeepLinking';

export type MyProfileProps =
  | VerifiedUserNavigationProp<Routes.MyProfile>
  | UnVerifiedUserNavigationProp<Routes.MyProfile>;

function MyProfile(props: MyProfileProps) {
  const {navigation, route} = props;
  const {t} = useTranslation();

  const requiredBalance = useMemo(() => 500000000000000000, []);
  const [minBalance, setMinBalance] = useState<number>(requiredBalance);
  const planterFundContract = usePlanterFund();
  const config = useConfig();
  useTreeUpdateInterval();

  const {referrer, organization, hasRefer} = useRefer();

  const getMinBalance = useCallback(() => {
    // @here
    planterFundContract.methods
      .minWithdrawable()
      .call()
      .then(balance => {
        setMinBalance(balance);
      })
      .catch(e => {
        console.log(e, 'e inside get minWithdrawable');
        setMinBalance(requiredBalance);
      });
  }, []);

  // @here This useEffect should be a hook or fix minBalanceQuery method
  useEffect(() => {
    getMinBalance();
  }, []);

  const web3 = useWalletWeb3();
  const wallet = useWalletAccount();
  const {useGSN} = useSettings();

  const {sendEvent} = useAnalytics();

  const {data, loading, status, refetchUser, handleLogout} = useCurrentUser({didMount: true});
  const isVerified = data?.user?.isVerified;

  const isConnected = useNetInfoConnected();

  // const minBalanceQuery = useQuery<PlanterMinWithdrawableBalanceQueryQueryData>(planterMinWithdrawQuery, {
  //   variables: {},
  //   fetchPolicy: 'cache-first',
  // });

  const skipStats = !wallet || !isVerified;

  const {
    data: planterData,
    refetchPlanterStatus: planterRefetch,
    refetching,
  } = usePlanterStatusQuery(wallet, skipStats);

  // const planterTreesCountResult = useQuery<PlanterTreesCountQueryData>(planterTreesCountQuery, {
  //   variables: {
  //     address,
  //   },
  //   skip: skipStats,
  // });

  // const planterWithdrawableBalanceResult = useQuery(planterWithdrawableBalanceQuery, {
  //   variables: {
  //     address,
  //   },
  //   fetchPolicy: 'cache-first',
  //   skip: skipStats,
  // });

  const getPlanter = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    try {
      await planterRefetch();
      await getMinBalance();
    } catch (e) {
      console.log(e, 'e is hereeeeee getPlanter');
    }
  }, [getMinBalance, isConnected, planterRefetch]);

  const parseBalance = useCallback(
    (balance: string, fixed = 5) => parseFloat(web3?.utils?.fromWei(balance))?.toFixed(fixed),
    [web3?.utils],
  );

  useEffect(() => {
    // if (wallet && isConnected) {
    getPlanter().then(() => {});
    // }
  }, []);

  const [submiting, setSubmitting] = useState(false);
  const handleWithdrawPlanterBalance = useCallback(async () => {
    if (!isConnected) {
      showAlert({
        title: t('netInfo.error'),
        message: t('netInfo.details'),
        mode: AlertMode.Error,
      });
      return;
    }
    setSubmitting(true);
    sendEvent('withdraw');
    try {
      // balance
      const balance = parseBalance(planterData?.balance?.toString() || '0');
      const bnMinBalance = parseBalance((minBalance || requiredBalance).toString());
      if (balance > bnMinBalance) {
        try {
          const transaction = await sendTransactionWithGSN(
            config,
            ContractType.PlanterFund,
            web3,
            wallet,
            'withdrawBalance',
            [planterData?.balance.toString()],
            useGSN,
          );

          console.log('transaction', transaction);
          showAlert({
            title: t('success'),
            message: t('myProfile.withdraw.success'),
            mode: AlertMode.Success,
          });
        } catch (e: any) {
          showAlert({
            title: t('failure'),
            message: e?.message || t('sthWrong'),
            mode: AlertMode.Error,
          });
        }
      } else {
        showAlert({
          title: t('myProfile.attention'),
          message: t('myProfile.lessBalance', {amount: parseBalance(minBalance?.toString())}),
          mode: AlertMode.Info,
        });
      }
    } catch (error: any) {
      showAlert({
        title: t('error'),
        message: error?.message,
        mode: AlertMode.Error,
      });
      console.warn('Error', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    isConnected,
    sendEvent,
    t,
    parseBalance,
    planterData?.balance,
    minBalance,
    requiredBalance,
    config,
    web3,
    wallet,
    useGSN,
  ]);

  const onRefetch = () =>
    new Promise((resolve: any, reject: any) => {
      setTimeout(() => {
        (async function () {
          await getPlanter();
          await refetchUser();
        })();
        resolve();
      }, 700);
    });

  const planterWithdrawableBalance =
    Number(planterData?.balance) > 0 ? parseBalance(planterData?.balance.toString() || '0') : 0;

  const avatarStatus = isVerified ? 'active' : 'inactive';
  const profileLoading = loading || !data?.user;
  const avatarMarkup = profileLoading ? (
    <ShimmerPlaceholder
      style={{
        width: 74,
        height: 74,
        borderRadius: 37,
      }}
    />
  ) : (
    <>
      <Avatar type={avatarStatus} size={74} />
      <Text style={{color: avatarStatus === 'active' ? colors.green : colors.red}}>
        {t(avatarStatus === 'active' ? 'verified' : 'notVerified')}
      </Text>
    </>
  );

  const handleOpenHelp = () => {
    sendEvent('help');
    return Linking.openURL('https://discuss.treejer.com/group/planters');
  };

  const handleNavigateOfflineMap = () => {
    sendEvent('offlinemap');
    // @ts-ignore
    navigation.navigate(Routes.OfflineMap);
  };

  const handleNavigateSettings = () => {
    // @ts-ignore
    navigation.navigate(Routes.Settings);
  };

  const handleCopyWalletAddress = useCallback(() => {
    if (wallet) {
      Clipboard.setString(wallet);
      showAlert({
        message: t('myProfile.copied'),
        mode: AlertMode.Success,
      });
    }
  }, [t, wallet]);

  return (
    <SafeAreaView style={[{flex: 1}, globalStyles.screenView]}>
      <PullToRefresh onRefresh={onRefetch}>
        <ScrollView
          style={[globalStyles.screenView, globalStyles.fill]}
          refreshControl={
            isWeb() ? undefined : <RefreshControl refreshing={profileLoading || refetching} onRefresh={onRefetch} />
          }
        >
          <View style={[globalStyles.screenView, globalStyles.alignItemsCenter]}>
            <Spacer times={8} />
            {avatarMarkup}
            <Spacer times={4} />

            {profileLoading ? (
              <View style={globalStyles.horizontalStack}>
                <ShimmerPlaceholder style={{width: 90, height: 30, borderRadius: 20}} />
                <Spacer times={4} />
                <ShimmerPlaceholder style={{width: 70, height: 30, borderRadius: 20}} />
              </View>
            ) : null}
            {!profileLoading && (
              <>
                {data?.user?.firstName ? <Text style={globalStyles.h4}>{data.user.firstName}</Text> : null}

                {data?.user?.firstName ? <Spacer times={4} /> : null}
                {wallet ? (
                  <TouchableOpacity onPress={handleCopyWalletAddress}>
                    <Text numberOfLines={1} style={styles.addressBox}>
                      {wallet.slice(0, 15)}...
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <Spacer times={4} />

                {planterData && (
                  <View style={[globalStyles.horizontalStack, styles.statsContainer]}>
                    <View style={styles.statContainer}>
                      <Text style={styles.statValue}>{planterWithdrawableBalance}</Text>
                      <Text style={styles.statLabel}>{t('balance')}</Text>
                    </View>

                    <Spacer times={6} />

                    <View style={styles.statContainer}>
                      <Text style={styles.statValue}>{planterData?.plantedCount}</Text>
                      <Text style={styles.statLabel}>{t('plantedTrees')}</Text>
                    </View>

                    {/*<Spacer times={6} />*/}

                    {/*<View style={styles.statContainer}>*/}
                    {/*  <Text style={styles.statValue}>{planterWithdrawableBalance.toFixed(5)}</Text>*/}
                    {/*  <Text style={styles.statLabel}>ETH Earning</Text>*/}
                    {/*</View>*/}
                  </View>
                )}

                <View style={[globalStyles.alignItemsCenter, {padding: 16}]}>
                  {planterWithdrawableBalance > 0 && Boolean(minBalance) && Boolean(planterData?.balance) && (
                    <>
                      <Button
                        style={styles.button}
                        caption={t('withdraw')}
                        variant="tertiary"
                        loading={submiting}
                        onPress={handleWithdrawPlanterBalance}
                      />
                      <Spacer times={4} />
                    </>
                  )}
                  {(status === UserStatus.Pending || Boolean(route.params?.hideVerification)) && (
                    <>
                      <Text style={globalStyles.textCenter}>{t('pendingVerification')}</Text>
                      <Spacer times={6} />
                    </>
                  )}

                  {!route.params?.hideVerification && status === UserStatus.Unverified && !hasRefer && (
                    <>
                      <Button
                        style={styles.button}
                        caption={t('getVerified')}
                        variant="tertiary"
                        onPress={() => {
                          sendEvent('get_verified');
                          if (data?.user) {
                            // @ts-ignore
                            navigation.navigate(Routes.VerifyProfile);
                          }
                        }}
                      />
                      <Spacer times={4} />
                    </>
                  )}

                  {!route.params?.hideVerification && status === UserStatus.Unverified && hasRefer && (
                    <>
                      <TouchableOpacity
                        style={styles.getVerifiedRefer}
                        onPress={() => {
                          sendEvent('get_verified');
                          if (data?.user) {
                            // @ts-ignore
                            navigation.navigate(Routes.VerifyProfile);
                          }
                        }}
                      >
                        <Spacer times={2} />
                        <Text>{t(referrer ? 'joiningReferrer' : 'joiningOrganization')}</Text>
                        <Text style={globalStyles.tiny}>{referrer || organization}</Text>
                        <Spacer times={4} />
                        <Text style={[globalStyles.h5, {color: colors.green, fontWeight: 'bold'}]}>
                          {t(referrer ? 'getVerified' : 'joinAndGetVerified')}
                        </Text>
                        <Spacer times={2} />
                      </TouchableOpacity>
                      <Spacer times={10} />
                    </>
                  )}

                  {!route.params?.unVerified && !isWeb() ? (
                    <>
                      <Button
                        style={styles.button}
                        caption={t('offlineMap.title')}
                        variant="tertiary"
                        onPress={handleNavigateOfflineMap}
                      />
                      <Spacer times={4} />
                    </>
                  ) : null}

                  {planterData?.planterType && !!wallet ? (
                    <Invite style={styles.button} address={wallet} planterType={Number(planterData?.planterType)} />
                  ) : null}

                  {/* {!wallet && (
                <>
                  <Button
                    style={styles.button}
                    caption={t('createWallet.title')}
                    variant="tertiary"
                    onPress={() => {
                      navigation.navigate('CreateWallet');
                    }}
                    disabled
                  />
                  <Spacer times={4} />
                </>
              )} */}

                  <Button
                    style={styles.button}
                    caption={t('settings.title')}
                    variant="tertiary"
                    onPress={handleNavigateSettings}
                  />
                  <Spacer times={4} />
                  <Button style={styles.button} caption={t('help')} variant="tertiary" onPress={handleOpenHelp} />
                  <Spacer times={4} />
                  <Button
                    style={styles.button}
                    caption={t('logout')}
                    variant="tertiary"
                    onPress={() => {
                      sendEvent('logout');
                      handleLogout(true);
                    }}
                  />
                  <Spacer times={4} />
                  <AppVersion />
                </View>
              </>
            )}
          </View>
          <Spacer times={4} />
        </ScrollView>
      </PullToRefresh>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addressBox: {
    backgroundColor: colors.khakiDark,
    textAlign: 'center',
    borderColor: 'white',
    overflow: 'hidden',
    width: 180,
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 10,
  },
  button: {
    width: 180,
  },
  helpWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    fontSize: 20,
    color: colors.grayDarker,
    marginBottom: 5,
  },
  statLabel: {
    color: colors.grayLight,
  },
  statsContainer: {
    paddingBottom: 20,
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLighter,
  },
  getVerifiedRefer: {
    width: 280,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowOffset: {
      width: 2,
      height: 6,
    },
    shadowRadius: 20,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    elevation: 6,
    alignItems: 'center',
  },
});

export default MyProfile;
