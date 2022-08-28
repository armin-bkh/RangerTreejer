// @ts-ignore
import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {isWeb} from './src/utilities/helpers/web';
import {i18next} from './src/localization';
import {I18nextProvider} from 'react-i18next';
import Orientation from 'react-native-orientation';
import {useInitialDeepLinking} from './src/utilities/hooks/useDeepLinking';
import {persistor, store} from './src/redux/store';
import {PersistGate} from 'redux-persist/integration/react';
import {InitNavigation} from './src/navigation/InitNavigation';

export default function App() {
  useInitialDeepLinking();

  useEffect(() => {
    if (!isWeb()) {
      Orientation.lockToPortrait();
      SplashScreen.hide();
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <I18nextProvider i18n={i18next}>
          <InitNavigation />
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}
