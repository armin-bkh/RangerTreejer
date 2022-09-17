import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Modal} from 'react-native';
import WebView, {WebViewNavigation} from 'react-native-webview';
import {SocialLoginButtonProps} from 'screens/Profile/screens/NoWallet/SocialLoginButton';
import {useConfig} from 'utilities/hooks/useWeb3';
import {createCryptoChallenge} from '../../@magic-ext/react-native-oauth/crypto';
import {TOAuthConfig} from 'screens/Profile/screens/NoWallet/NoWallet';

export type TOAuthWebView = TOAuthConfig & {
  onClose: () => void;
};

export function OAuthWebView(props: TOAuthWebView) {
  const {provider, state, challenge, onClose} = props;

  const config = useConfig();

  const query = useMemo(
    () =>
      [
        `magic_api_key=${encodeURIComponent(config.magicApiKey)}`,
        `magic_challenge=${encodeURIComponent(challenge)}`,
        `state=${encodeURIComponent(state)}`,
        `platform=${encodeURIComponent('rn')}`,
        `redirect_uri=${encodeURIComponent('com.ranger.treejer/login')}`,
      ].reduce((prev, next) => (next ? `${prev}&${next}` : prev)),
    [state, challenge],
  );

  const uri = useMemo(
    () => `https://auth.magic.link/v1/oauth2/${provider.toLowerCase()}/start?${query}`,
    [provider, query],
  );

  console.log(uri, 'uri is here asdfadsfsd');

  const handleNavigationStateChange = useCallback(
    (navigationState: WebViewNavigation) => {
      const urlResult = navigationState.url;

      // parseURLParams is a pseudo function.
      // Make sure to write your own function or install a package
      // const params = parseURLParams(urlResult);

      console.log(urlResult, 'result is hereeeeeee');

      // if (params.token) {
      //   // Save token for native requests & move to the next screen
      // }
    },
    [provider],
  );

  return query && provider ? (
    <Modal onRequestClose={onClose}>
      <WebView source={{uri}} androidLayerType="software" onNavigationStateChange={handleNavigationStateChange} />
    </Modal>
  ) : null;
}
