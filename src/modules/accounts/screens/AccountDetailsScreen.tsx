import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Address, Transaction} from '@signumjs/core';
import React, {useEffect, useRef} from 'react';
import {Alert, Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {connect, useDispatch, useSelector} from 'react-redux';
import {actionIcons} from '../../../assets/icons';
import {HeaderTitle} from '../../../core/components/header/HeaderTitle';
import {i18n} from '../../../core/i18n';
import {FullHeightView} from '../../../core/layout/FullHeightView';
import {Screen} from '../../../core/layout/Screen';
import {ApplicationState} from '../../../core/store/initialState';
import {PriceInfoReduxState} from '../../price-api/store/reducer';
import {AccountDetailsList} from '../components/details/AccountDetailsList';
import {RootStackParamList} from '../navigation/mainStack';
import {updateAccountTransactions} from '../store/actions';
import {selectAccount} from '../store/selectors';
import {auth} from '../translations';
import {defaultSettings} from '../../../core/environment';
import useSWRNative from 'swr-react-native';

type AccountDetailsRouteProps = RouteProp<RootStackParamList, 'AccountDetails'>;
type AccountDetailsNavProp = StackNavigationProp<
  RootStackParamList,
  'AccountDetails'
>;

interface Props {
  priceApi: PriceInfoReduxState;
  route: AccountDetailsRouteProps;
  navigation: AccountDetailsNavProp;
}

const styles = StyleSheet.create({
  copyIcon: {
    margin: 5,
    width: 25,
    height: 25,
  },
});

const AccountDetails = (props: Props) => {
  const timeoutHandle = useRef<number>();
  const dispatch = useDispatch();
  const route = useRoute<AccountDetailsRouteProps>();
  const account = useSelector(selectAccount(route.params.account || ''));
  const {priceApi, navigation} = props;

  useSWRNative(
    account ? `fetchTransactions/${account.account}` : null,
    () => {
      if (account) {
        return dispatch(
          updateAccountTransactions({account, pendingOnly: false}),
        );
      }
      return Promise.resolve(null);
    },
    {
      refreshInterval: defaultSettings.pollingTime,
    },
  );

  useSWRNative(
    account ? `fetchPendingTransactions/${account.account}` : null,
    () => {
      if (account) {
        return dispatch(
          updateAccountTransactions({account, pendingOnly: true}),
        );
      }
      return Promise.resolve(null);
    },
    {
      refreshInterval: 10 * 1000,
    },
  );

  const handleTransactionPress = (transaction: Transaction) => {
    // @ts-ignore
    navigation.navigate('TransactionDetails', {transaction});
  };

  const handleCopy = () => {
    if (!route.params.account) {
      return;
    }

    const address = Address.fromNumericId(route.params.account);
    const value = address.getReedSolomonAddress();
    Clipboard.setString(value);
    Alert.alert(i18n.t(auth.accountDetails.copiedSuccessfully, {value}));
  };

  if (!account) {
    return null;
  }

  return (
    <Screen>
      <FullHeightView withoutPaddings>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              position: 'absolute',
              zIndex: 3,
              left: 10,
              top: 10,
            }}
            onPress={navigation.goBack}>
            <Image
              source={actionIcons.chevronLeft}
              style={{width: 30, height: 30}}
            />
          </TouchableOpacity>
          <View style={{flex: 1, alignItems: 'center', margin: 10}}>
            <HeaderTitle>{account.accountRS || 'Account Details'}</HeaderTitle>
          </View>
          <TouchableOpacity onPress={handleCopy}>
            <Image style={styles.copyIcon} source={actionIcons.copy} />
          </TouchableOpacity>
        </View>
        <View>
          <AccountDetailsList
            account={account}
            onTransactionPress={handleTransactionPress}
            priceApi={priceApi}
          />
        </View>
      </FullHeightView>
    </Screen>
  );
};

function mapStateToProps(state: ApplicationState) {
  return {
    priceApi: state.priceApi,
  };
}

export const AccountDetailsScreen = connect(mapStateToProps)(AccountDetails);