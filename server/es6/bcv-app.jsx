import HomeView from './components/HomeView';
import PayloadView from './components/PayloadView';
import ListTransactionsView from './components/ListTransactionsView';
import SearchByBusinessIdView from './components/SearchByBusinessIdView';
import SearchByTransactionIdView from './components/SearchByTransactionIdView';
import SetupView from './components/SetupView';
import SyncStatisticsView from './components/SyncStatisticsView';
import StartSyncView from './components/StartSyncView';
import TrackAndVerifyView from './components/TrackAndVerifyView';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, Redirect} from 'react-router-dom';
import {backChainStore} from './store/BackChainStore';
import Images from './Images';
import BackChainActions from './BackChainActions';

const RoutedApp = () => (
  <BrowserRouter>
    <Switch>
      {/* exact will match /home but not /home/2 etc */}
      <Route exact path="/"><Redirect from='/' to='/home'/></Route>
      <Route path="/home"             render={props => <HomeView                  store={backChainStore} {...props}/> } />
      <Route path="/payload"          render={props => <PayloadView               store={backChainStore} {...props}/> } />
      <Route path="/listTransactions" render={props => <ListTransactionsView      store={backChainStore} {...props}/> } />
      <Route path="/businessId"       render={props => <SearchByBusinessIdView    store={backChainStore} {...props}/> } />
      <Route path="/transactionId"    render={props => <SearchByTransactionIdView store={backChainStore} {...props}/> } />
      <Route path="/setup"            render={props => <SetupView                 store={backChainStore} {...props}/> } />
      <Route path="/syncStatistics"   render={props => <SyncStatisticsView        store={backChainStore} {...props}/> } />
      <Route path="/startSync"        render={props => <StartSyncView             store={backChainStore} {...props}/> } />
      {/*<Route component={404 Not Found}/> we can create a component for all non existing pages, this is like the else condition if not matching any of the above*/}
    </Switch>
  </BrowserRouter>
);


// Available options:
// 
//  - showOnlyVerifyView: Boolean
//    True to display only the verification table
//    
//  - userEntName: String
//    The current user's enterprise name
//    
//  - fetchTransactionSliceByHash: Function
//    A callback function which is used to fetch slice data. It is called with these parameters:
//      - transaction
//      - transactionSlice
//    
//    It should return a Promise which provides the serialized slice as the only argument.
window.BackchainVerifyAPI = {
    setup: (renderTo, options) => {
        options = options || {};
        
        BackChainActions.init(backChainStore, options);

        const componentToRender = options.showOnlyVerifyView
            ? <TrackAndVerifyView store={backChainStore} hideProgressBar />
            : <RoutedApp/>;

        if (typeof renderTo == 'string') {
            renderTo = $(renderTo)[0];
        }

        if (options.userEntName) {
          backChainStore.entNameOfLoggedUser = options.userEntName;
        }

        if (options.baseImageURL) {
          Images.baseURL = options.baseImageURL;
        }

        ReactDOM.render(componentToRender, renderTo);
    },

    loadTransactions: (transactions) => {
        BackChainActions.loadTransactions(transactions);
    }
};
