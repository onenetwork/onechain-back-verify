import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl} from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import moment from 'moment';
import Datetime from 'react-datetime';

import 'react-datetime/css/react-datetime.css';

@observer export default class StartSyncView extends React.Component {
	constructor(props) {
		super(props);
		this.tokenInputVal = null;
		this.startFromInputVal = null;
		this.state = {startSync: false}
	}

	listenTokenChanges(event){
		this.tokenInputVal  = event.target.value.trim();		
		if (this.tokenInputVal.length > 0 && event.charCode  == 13) {
			this.startSync();
		}
	}

	listenStartFromChanges(date){
		this.startFromInputVal  = date;
	}

	startSync() {
		this.state.startSync = true;
		if(this.props.store.authenticationToken === null && !this.props.store.isInitialSyncDone) {
			BackChainActions.startInitialSync(this.tokenInputVal);
		} else {
			BackChainActions.startSyncFromCertainDate(this.tokenInputVal, this.startFromInputVal);
		}
	}

	closeModal() {
		this.props.store.startSyncModalViewModalActive = false;
	}

	render() {
		let fieldProps = {
			panel : {
				backgroundColor: 'rgba(250, 250, 250, 1)',
				border:'none',
				marginBottom: 'unset',
				borderRadius: '8px'
			},
			panelHeading : {
				borderTopLeftRadius: '7px',
				borderTopRightRadius: '7px',
				backgroundColor: 'white',
			},
			panelTitle : {
				fontWeight: 'bold',
				display: 'inline-block',
				color: '#646464'
			},
			panelBody: {
				paddingTop: 40,
				paddingBottom: 40,
				backgroundColor: 'white',
				borderRadius: '8px'
			},
			valueLabel: {
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				fontSize: '15px'
			},
			valueInput: {
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				borderStyle: 'solid',
				borderWidth: '1px',
				borderColor: 'rgba(153, 153, 153, 1)',
				borderRadius: '3px',
			},
			button : {
				height: '35px',
				boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
				fontStyle: 'normal',
    			fontSize: '16px'
			}
		};
		if(!this.props.store.authenticationToken) {
			this.startFromInputVal = moment().startOf('year');
		} else {
			this.tokenInputVal = this.props.store.authenticationToken;
			this.startFromInputVal = this.props.store.lastSyncTimeInMillis;
		}

		let synchRefresh = '';
		if(this.props.store.syncGoingOn) {
			synchRefresh = (<div>
				<Row style={{paddingLeft:'90px'}}>
					<Col style={{color:'#0085C8'}} md={1}><i className="fa fa-refresh fa-spin fa-4x fa-fw"></i></Col>
					<Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
						Refreshing your database.<br/> This may take a few minutes.
					</Col>
				</Row><br/>
				<Row>
					<Col md={5}></Col>
					<Col md={2}>
						<Button bsStyle="primary" style={Object.assign({}, fieldProps.button, {width: '80px'})} onClick={this.closeModal.bind(this)}>OK</Button>
					</Col>
				</Row>
				</div>);
		} else if(this.props.store.syncGoingOn == false) {
			synchRefresh = (<Row style={{paddingLeft:'90px'}}>
								<Col style={{color:'#3c763d'}} md={1}><i className="fa fa-check-circle fa-4x fa-fw"></i></Col>
								<Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
									Your database has been successfully refreshed!
								</Col>
							</Row>);
		}

		let panelBody = '';
		if(!this.state.startSync) {
			panelBody = (<div>
							<Row>
								<Col md={2}><div style={fieldProps.valueLabel}>Authentication Token: </div></Col>
								<Col md={8}>
									<FormControl type="text" defaultValue = {this.tokenInputVal} onKeyPress={this.listenTokenChanges.bind(this)} onChange={this.listenTokenChanges.bind(this)} placeholder="Authentication Token" /><br/>
								</Col>
							</Row>
							<Row>
								<Col md={2}><div style={fieldProps.valueLabel}>Start From: </div></Col>
								<Col md={8}>
									<Datetime defaultValue={this.startFromInputVal} inputProps={{placeholder: "Start From Date"}} closeOnSelect={true} dateFormat="MM/DD/YYYY" onChange={this.listenStartFromChanges.bind(this)} timeFormat={false}/>
									<br/>
								</Col>
							</Row>
							<Row>
								<Col md={2}></Col>
								<Col md={8}>
									<Button bsStyle="primary" style={fieldProps.button} onClick={this.startSync.bind(this)}>Start Sync</Button>
									<Button style={Object.assign({}, {marginLeft:'10px',color:'#0078D7',borderColor:'#0078D7'}, fieldProps.button)} onClick={this.closeModal.bind(this)}>Cancel</Button>
								</Col>
							</Row>
						</div>);
		} else {
			panelBody = <div>{synchRefresh}</div>
		}

		return (
			<div className={"panel panel-default"} style={fieldProps.panel}>
				<div className={"panel-heading"} style={fieldProps.panelHeading}>
				<div className="panel-title" style={fieldProps.panelTitle}>
					<i className="fa fa-database" aria-hidden="true"></i>&nbsp;&nbsp;
					Sync My Database with One Network's Chain of Custody
				</div>
					<i onClick={BackChainActions.toggleStartSyncModalView} className="fa fa-times" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
				</div>
				<div className={"panel-body"} style={fieldProps.panelBody}>
					{panelBody}
				</div>
			</div>
		);
	}
}