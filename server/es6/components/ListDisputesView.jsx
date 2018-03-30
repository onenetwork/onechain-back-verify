import React from 'react';
import {Row, Button} from 'react-bootstrap';
import { observer } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import DisputesView from "./DisputesView";
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import DisputesViewModal from './DisputesViewModal';

@observer export default class ListDisputesView extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
		BackChainActions.loadDisputes(); //Make sure to pass default filters for the initial fetch. 
	}

	openDisputesPopup() {
		BackChainActions.toggleDisputesModalView();
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
                                <span style={{paddingLeft:'680px'}}><Button onClick={this.openDisputesPopup} className="btn btn-primary" bsSize="large" style={fieldProps.button}>New Dispute</Button> </span>
                            </Row><br/>
						</div>);
        return (
			<div className={"panel panel-default"} onClick={this.props.action}>
				<HeaderView store={this.props.store}/>
				<div className={"panel-body"} style={fieldProps.panelBody}>
					{panelBody}
					<DisputesView store = {this.props.store} />
					{this.props.store.disputesViewModalActive ? <DisputesViewModal store={this.props.store} /> : null }
				</div>
			</div>
		);
    }
}