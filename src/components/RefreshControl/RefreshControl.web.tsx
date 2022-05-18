import globalStyles from 'constants/styles';
import React from 'react';
import {ScrollView, View} from 'react-native';
import {RefreshControl} from 'react-native-web-refresh-control';
import PullToRefresh from 'react-simple-pull-to-refresh';

// export RefreshControl;

interface pullToRefreshControlProps {
  profileLoading: boolean;
  refetching: boolean;
  onRefresh: () => Promise<any>;
  children: React.ReactChild;
}

export default function PullToRefreshControl(props: pullToRefreshControlProps) {
  const {onRefresh, children} = props;

  return (
    <ScrollView style={[globalStyles.screenView, globalStyles.fill]}>
      <PullToRefresh maxPullDownDistance={150} onRefresh={onRefresh}>
        <>{children}</>
      </PullToRefresh>
    </ScrollView>
  );
}
