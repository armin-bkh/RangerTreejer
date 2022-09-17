import {Platform} from 'react-native';

export const getDeepLink = (path = '') => {
  const scheme = 'rangerTreejer';
  const prefix = Platform.OS == 'android' ? `${scheme}://ranger.treejer.com/` : `${scheme}://`;
  return prefix + path;
};
