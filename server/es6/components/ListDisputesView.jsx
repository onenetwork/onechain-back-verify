import React from 'react';
import {Row, Button} from 'react-bootstrap';
import { observer } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import DisputesView from "./DisputesView";
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import DisputeFiltersView from './DisputeFiltersView';
import NewDisputeView from './NewDisputeView';

@observer export default class ListDisputesView extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
		BackChainActions.loadDisputes(); //Make sure to pass default filters for the initial fetch. 
		
        /*If txnId, means we need to open dispute form pop up, with prepopulated values for the txnId which is passed*/
		if(this.props.history.location.state && this.props.history.location.state.txnId && this.props.history.location.state.txnId !== null) {
			BackChainActions.toggleNewDisputeModalView();
		}

	}

	openDisputesPopup() {
		if(this.props.history.location) {
			this.props.history.replace({ pathname: '/listDisputes', state: { txnId: null}});
		}
		BackChainActions.toggleNewDisputeModalView();
	}

    render() {
		if(this.props.store.isInitialSetupDone == null) {
			return null;
		} else if(this.props.store.isInitialSetupDone === false) {
			return <Redirect push to="/setup" />;
		}

		let fieldProps = {
			panelHeader : {
			   fontWeight: 'bold',
			   display: 'inline-block'
			},
			panelBodyTitle : {
				paddingLeft: '15px',
				fontSize: '26px',
				paddingBottom: '30px',
				paddingTop: '14px'
			},
			button : {
				height: '45px',
				width: '282px'
			}
        };
		
		let panelBody = (<div>
                            <Row style={fieldProps.panelBodyTitle}>
                                <span style={{float:'left'}} > Disputes </span>
                                <span style={{paddingLeft:'680px'}}><Button onClick={this.openDisputesPopup.bind(this)} className="btn btn-primary" bsSize="large" style={fieldProps.button}>New Dispute</Button> </span>
                            </Row><br/>
						</div>);
        return (
			<div className={"panel panel-default"} onClick={this.props.action}>
				<HeaderView store={this.props.store}/>
				<div className={"panel-body"} style={fieldProps.panelBody}>
					{panelBody}
					<DisputeFiltersView store = {this.props.store} />
					<DisputesView store = {this.props.store} />
					{this.props.store.newDisputeModalActive ? <NewDisputeView txnId = {typeof this.props.history.location.state == "undefined" ? null : this.props.history.location.state.txnId} store={this.props.store} /> : null }
				</div>
			</div>
		);
    }
}