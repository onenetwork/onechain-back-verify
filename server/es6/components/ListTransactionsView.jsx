import React from 'react';
import {Row, Col, Button, Panel} from 'react-bootstrap';
import { observer } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import TrackAndVerifyView from "./TrackAndVerifyView";
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";

@observer export default class ListTransactionsView extends React.Component {
	constructor(props) {
        super(props);
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
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
                                <span style={{float:'left'}} > Verifications </span>
                                <span style={{paddingLeft:'680px'}}><Link to="/index"> <Button className="btn btn-primary" bsSize="large" style={fieldProps.button}>Verify Another Transaction</Button> </Link> </span>
                            </Row><br/>
						</div>);
        return (
			<div className={"panel panel-default"} onClick={this.props.action}>
				<HeaderView store={this.props.store}/>
				<div className={"panel-body"} style={fieldProps.panelBody}>
					{panelBody}
					<TrackAndVerifyView store = {this.props.store} />
				</div>
			</div>
		);
    }
}