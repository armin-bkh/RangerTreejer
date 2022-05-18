import globalStyles from 'constants/styles';
import React from 'react';
import {RefreshControl, ScrollView} from 'react-native';

// export  RefreshControl;

interface pullToRefreshControlProps {
  profileLoading: boolean;
  refetching: boolean;
  onRefresh: () => Promise<any>;
  children: React.ReactChild;
}

export default function PullToRefreshControl(props: pullToRefreshControlProps) {
  const {profileLoading, refetching, onRefresh, children} = props;
  return (
    <ScrollView
      style={[globalStyles.screenView, globalStyles.fill]}
      refreshControl={<RefreshControl refreshing={profileLoading || refetching} onRefresh={onRefresh} />}
    >
      {children}
    </ScrollView>
  );
}
