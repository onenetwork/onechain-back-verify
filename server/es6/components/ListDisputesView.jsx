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

	componentDidMount() {

		BackChainActions.processApplicationSettings(); 
		
        /*If disputeTransaction, means we need to open dispute form pop up, with prepopulated values of the disputeTransaction*/
		if(this.props.store.disputeTransaction) {
			BackChainActions.toggleNewDisputeModalView();
		}
	}


	openDisputesPopup() {
		BackChainActions.clearDisputeTransaction();
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
				paddingBottom: '5px',
				paddingTop: '14px'
			},
			button : {
				height: '42px',
				width: '169px',
				boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
			}
        };
		
		let panelBody = (<div>
                            <Row style={fieldProps.panelBodyTitle}>
                                <span style={{float:'left'}} > Disputes </span>
								<span style={{ paddingLeft: '758px' }}><Button onClick={this.openDisputesPopup.bind(this)} className="btn btn-primary" bsSize="large" style={fieldProps.button}>New Dispute</Button> </span>
								&nbsp;&nbsp;<span><Link to="/home"><Button bsStyle="primary"  className="home-button"><i className="fa fa-home" aria-hidden="true" style={{ color: '#0085C8', fontSize: '28px'}}></i></Button></Link></span>
                            </Row><br/>
						</div>);
		return (
			<div>
				<div className={"panel panel-default"} onClick={this.props.action}>
					<HeaderView store={this.props.store}/>
					<div className={"panel-body"} style={fieldProps.panelBody}>
						{panelBody}
						<DisputeFiltersView store={this.props.store} />
						<DisputesView store={this.props.store} />
						{this.props.store.newDisputeModalActive ? <NewDisputeView store={this.props.store} /> : null }
					</div>
				</div>
			</div>
		);
    }
}