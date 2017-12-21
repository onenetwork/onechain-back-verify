import HomeView from './components/HomeView';
import PayloadView from './components/PayloadView';
import ListTransactionsView from './components/ListTransactionsView';
import SearchByBusinessIdView from './components/SearchByBusinessIdView';
import SearchByTransactionIdView from './components/SearchByTransactionIdView';
import SetupView from './components/SetupView';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, Redirect} from 'react-router-dom';
import {backChainStore} from './store/BackChainStore';
import BackChainActions from './BackChainActions';

const RoutedApp = () => (
  <BrowserRouter>
    <Switch>
      {/* exact will match /home but not /home/2 etc */}
      <Route exact path="/"><Redirect from='/' to='/home'/></Route>
      <Route path="/home" render={(props) => (<HomeView store={backChainStore} {...props}/>)} />
      <Route path="/payload"  render={(props) => (<PayloadView store={backChainStore} {...props}/>)} />
      <Route path="/listTransactions" render={(props) => (<ListTransactionsView store={backChainStore} {...props}/>)} />
      <Route path="/businessId" render={(props) => (<SearchByBusinessIdView store={backChainStore} {...props}/>)} />
      <Route path="/transactionId" render={(props) => (<SearchByTransactionIdView store={backChainStore} {...props}/>)} />
      <Route path="/setup" render={(props) => (<SetupView store={backChainStore} {...props}/>)} />
      {/*<Route component={404 Not Found}/> we can create a component for all non existing pages, this is like the else condition if not matching any of the above*/}
    </Switch>
  </BrowserRouter>
);

(function(){
  BackChainActions.init(backChainStore);
  })()

ReactDOM.render(
    <RoutedApp/>,
    document.getElementById('root')
);