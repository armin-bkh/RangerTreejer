import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {Check, Times} from 'components/Icons';
import Map from './Map';
import Button from 'components/Button';
import {AlertMode, showAlert} from 'utilities/helpers/alert';
import {colors} from 'constants/values';
import {GeoCoordinates, GeoPosition} from 'react-native-geolocation-service';
import {useTranslation} from 'react-i18next';
import useNetInfoConnected from 'utilities/hooks/useNetInfo';
import {TreeJourney} from 'screens/TreeSubmission/types';
import {Routes} from 'navigation';
import {useCurrentJourney} from 'services/currentJourney';

export type locationType = {
  lng: number;
  lat: number;
};
interface MapMarkingProps {
  onSubmit?: (location: Partial<GeoPosition>) => void;
  verifyProfile?: boolean;
}
export default function MapMarking(props: MapMarkingProps) {
  const {onSubmit, verifyProfile} = props;

  const {journey, setNewJourney} = useCurrentJourney();
  const [accuracyInMeters, setAccuracyInMeters] = useState(0);
  const [location, setLocation] = useState<locationType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {t} = useTranslation();
  // const [isCameraRefVisible, setIsCameraRefVisible] = useState(!!camera?.current);
  const navigation = useNavigation<any>();
  // const [persistedPlantedTrees] = usePersistedPlantedTrees();
  // const {dispatchAddOfflineUpdateTree} = useOfflineTrees();
  const isConnected = useNetInfoConnected();

  const handleDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = useCallback(() => {
    if (verifyProfile && location) {
      onSubmit?.({
        coords: {
          latitude: location.lat,
          longitude: location.lng,
        } as GeoCoordinates,
      });
    } else if (journey && location) {
      const newJourney = {
        ...journey,
        location: {
          latitude: location?.lat,
          longitude: location?.lng,
        },
      };
      if (isConnected) {
        navigation.navigate(Routes.SubmitTree);
        setNewJourney(newJourney);
      } else {
        showAlert({message: `${t('offlineMap.notSupported')}`, mode: AlertMode.Error});
      }
    } else {
      if (location) {
        const coords = {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: accuracyInMeters,
          heading: 0,
          altitude: 0,
          speed: 0,
          altitudeAccuracy: 0,
        };
        onSubmit?.({
          coords,
          timestamp: Date.now(),
        });
      }
    }
  }, [isConnected, journey, location, navigation]);

  return (
    <View style={styles.container}>
      <Map setLocation={setLocation} setAccuracyInMeters={setAccuracyInMeters} />

      <View style={[styles.bottom, {width: '100%'}]}>
        {location && (
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Button caption="" icon={Times} variant="primary" round onPress={handleDismiss} />

            <View
              style={{
                backgroundColor: colors.khaki,
                flex: 0.9,
                height: 80,
                padding: 8,
                borderRadius: 4,
                justifyContent: 'space-between',
              }}
            >
              <Text style={{fontSize: 10}}>lat: {location?.lat || 'N/A'}</Text>
              <Text style={{fontSize: 10}}>long: {location?.lng || 'N/A'}</Text>
              <Text style={{fontSize: 10}}>
                accuracy: {accuracyInMeters ? Number(accuracyInMeters).toFixed(2) : 'N/A'}
              </Text>
            </View>
            <Button caption="" icon={Check} variant="success" round onPress={handleSubmit} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.khaki,
  },
  bottom: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingBottom: 40,
    left: 0,
    bottom: 0,
    right: 0,
  },
  myLocationIcon: {
    width: 45,
    height: 45,
    backgroundColor: colors.khaki,
    position: 'absolute',
    borderRadius: 100,
    right: 0,
    marginHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.gray,
    bottom: 120,
  },
});
