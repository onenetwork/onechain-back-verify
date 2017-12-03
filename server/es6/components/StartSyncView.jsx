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
		this.closeModal = this.closeModal.bind(this);
		this.startSync = this.startSync.bind(this);
		this.state = {startSync: false}
	}

	closeModal() {
		this.props.store.startSyncModalViewModalActive = false;
	}

	startSync() {
		this.state.startSync = true;
	}

	render() {
		let syncPopupBody = null;
		if(!this.state.startSync) {
			syncPopupBody = <SyncForm closeModal = {this.closeModal} startSync = {this.startSync} store = {this.props.store}/>;
		} 
		
		if(this.props.store.syncGoingOn == true && this.state.startSync) {
			syncPopupBody = <SyncRefresh msgs = {["Refreshing your database.", "This may take a few minutes."]} btnName= "OK" closeModal = {this.closeModal}/>
		} else if(this.props.store.syncGoingOn == false && this.state.startSync) {
			syncPopupBody = <SyncDone msg = {"Your database has been successfully refreshed!"}/>
		}

		return (
			<div>
				<SyncPopup title = "Sync My Database with One Network's Chain of Custody" body = {syncPopupBody} />
			</div>
		)
	}
}

class SyncForm extends React.Component {
	constructor(props) {
		super(props);
		this.tokenInputVal = null;
		this.startFromInputVal = null;
		this.closeModal = this.closeModal.bind(this);
	}

	closeModal() {
		this.props.closeModal();
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
		this.props.startSync();
		if(this.props.store.authenticationToken === null && !this.props.store.isInitialSyncDone) {
			BackChainActions.startInitialSync(this.tokenInputVal);
		} else {
			BackChainActions.startSyncFromCertainDate(this.tokenInputVal, this.startFromInputVal);
		}
	}

	render() {
		let fieldProps = {
			valueLabel: {
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				fontSize: '15px'
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

		return (
			<div>
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
						<Button style={Object.assign({}, {marginLeft:'10px',color:'#0078D7',borderColor:'#0078D7'}, fieldProps.button)} onClick={this.closeModal}>Cancel</Button>
					</Col>
				</Row>
			</div>
		)
	}
}

const SyncPopup = (props) => {
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
		}
	};

	return (
		<div className={"panel panel-default"} style={fieldProps.panel}>
			<div className={"panel-heading"} style={fieldProps.panelHeading}>
			<div className="panel-title" style={fieldProps.panelTitle}>
				<i className="fa fa-database" aria-hidden="true"></i>&nbsp;&nbsp;
				{props.title}
			</div>
				<i onClick={BackChainActions.toggleStartSyncModalView} className="fa fa-times" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
			</div>
			<div className={"panel-body"} style={fieldProps.panelBody}>
				{props.body}
			</div>
		</div>
	);
}

const SyncRefresh = (props) => {
	let fieldProps = {
		button : {
			height: '35px',
			boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
			fontStyle: 'normal',
			fontSize: '16px'
		}
	}
	
	function closeModal() {
		props.closeModal();
	}

	return (
		<div>
			<Row style={{paddingLeft:'90px'}}>
				<Col style={{color:'#0085C8'}} md={1}><i className="fa fa-refresh fa-spin fa-4x fa-fw"></i></Col>
				<Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
					{props.msgs.map(i => {
						return <div key={i}>{i}</div>;
					})}
				</Col>
			</Row><br/>
			<Row>
				<Col md={5}></Col>
				<Col md={2}>
					<Button bsStyle="primary" style={Object.assign({}, fieldProps.button, {width: '80px'})} onClick={closeModal.bind(this)}> {props.btnName} </Button>
				</Col>
			</Row>
		</div>
	)
}

const SyncDone = (props) => {
	return (
		<Row style={{paddingLeft:'90px'}}>
			<Col style={{color:'#3c763d'}} md={1}><i className="fa fa-check-circle fa-4x fa-fw"></i></Col>
			<Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
				{props.msg}
			</Col>
		</Row>
	)
}