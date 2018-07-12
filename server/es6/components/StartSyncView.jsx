import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl} from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import moment from 'moment';
import Datetime from 'react-datetime';
import AlertPopupView from './AlertPopupView';
import 'react-datetime/css/react-datetime.css';

@observer export default class StartSyncView extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount = () => { 
		BackChainActions.toggleDBSyncModalViewActive();
	}

	render() {
		if (this.props.store.syncInitiated) {
			return <Redirect push to="/home" />;
		}
		let syncPopupBody = <SyncForm store={this.props.store} startSync={this.startSync}/>;

		return (
			<div>
				<HeaderView store={this.props.store} size="big"/>
				<SyncPopup title = "Sync database with One Network's Audit Repository App" body = {syncPopupBody} />
			</div>
		)
	}
}

class SyncForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {showOauthInfo :  false}
	}

	listenTokenChanges(event){
		this.props.store.authenticationToken  = event.target.value.trim();
		if ( this.props.store.authenticationToken.length > 0 && event.charCode  == 13) {
			this.startSync();
		}
	}

	listenStartFromChanges(date){
		this.props.store.lastSyncTimeInMillis  = date.valueOf();
	}

	listenURLChanges(event){
		this.props.store.chainOfCustodyUrl  = event.target.value.trim();
	}

	isEmpty(value) {
		return value == null || typeof value == 'undefined' || value == "";
	}

	startSync() {
		if (this.isEmpty(this.props.store.authenticationToken) || this.isEmpty(this.props.store.lastSyncTimeInMillis) || this.isEmpty(this.props.store.chainOfCustodyUrl)) {
			BackChainActions.displayAlertPopup("Missing Required Fields", "All of the fields are required. Please fill all the fields and try again.",'ERROR');
			return;
		}
		if (!this.props.store.chainOfCustodyUrl.toLowerCase().startsWith("http://") && !this.props.store.chainOfCustodyUrl.toLowerCase().startsWith("https://")) {
			BackChainActions.displayAlertPopup("Invalid One Network's Audit Repository Url", "Please enter a valid One Network's Audit Repository url and try again.",'ERROR');
			return;
		}
		BackChainActions.startSyncFromCertainDate(this.props.store.authenticationToken, this.props.store.lastSyncTimeInMillis, this.props.store.chainOfCustodyUrl);
	}

	onHover() {
		this.setState(function(prevState) {
			return {showOauthInfo: true};
		});
    }

    onHoverOut() {
		this.setState(function(prevState) {
			return {showOauthInfo: false};
		});
	}

	render() {
		let fieldProps = {
			button : {
				height: '35px',
				boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
				fontStyle: 'normal',
    			fontSize: '16px'
			},
			cancelButton: { 
				height: '35px',
				boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
				fontStyle: 'normal',
				fontSize: '16px',
				paddingTop: '0px',
				width: '53px',
				fontSize: '24px'
			}
		};

		let now = Datetime.moment();
		let valid = function (current) {
			return current.isBefore(now);
		};

		if(!this.props.store.authenticationToken) {
			this.props.store.lastSyncTimeInMillis = moment().startOf('year').valueOf();
		}

		return (
			<div>
				<AlertPopupView store={this.props.store} />
				<Row style={{paddingLeft: '15px'}}>
					<Col style={{backgroundColor : 'rgba(253, 244, 181, 1)', borderRadius: '5px', lineHeight: '40px', width: '64.66%',paddingLeft: '0px'}} md={8}>
						<Col md={1} style={{paddingTop: '2px', width: '7%'}}><i className="fa fa-exclamation-circle" aria-hidden="true" style={{fontSize: '1.5em', color : "#F19500"}}/></Col>
						<Col>Your database has {this.props.store.syncStatistics ? this.props.store.syncStatistics.gaps.length : 0} sequence gaps of missing data. <b><Link to={"/syncStatistics"}>Show Sequence Gaps</Link></b></Col>
					</Col>
				</Row><br/>
				<Row>
					<Col md={8}>
						<FormControl style={{height : '40px'}} type="text" defaultValue = {this.props.store.chainOfCustodyUrl} onKeyPress={this.listenURLChanges.bind(this)} onChange={this.listenURLChanges.bind(this)} placeholder={this.props.store.chainOfCustodyUrl == null ? 'One Network Chain of Custody URL' : this.props.store.chainOfCustodyUrl} />
					</Col>
				</Row><br/>
				<Row>
					<Col md={5}>
						<FormControl style={{height : '40px'}} type="text" defaultValue = {this.props.store.authenticationToken} onKeyPress={this.listenTokenChanges.bind(this)} onChange={this.listenTokenChanges.bind(this)} placeholder="Oauth Token" />
					</Col>
					<Col md={1} style={{paddingLeft: '0px', width: '3%'}} onMouseOver = {this.onHover.bind(this)} onMouseOut = {this.onHoverOut.bind(this)}>
						<i style = {{fontSize: '21px', color: 'rgb(0, 133, 200)'}} className="fa fa-info-circle"  aria-hidden="true"/>
					</Col>
					{this.state.showOauthInfo &&
						<Col md={6} style={{backgroundColor: 'rgb(215, 235, 242)', borderRadius: '5px',zIndex: 1}}>
							If you do not know your oauth token, you can learn about it at onenetwork. com by going to chain of Custody> What's my oauth token?
						</Col>
					}
				</Row><br/>
				<Row>
					<Col md={5}>
						<Datetime defaultValue={this.props.store.lastSyncTimeInMillis} inputProps={{ placeholder: "mm/dd/yyyy" }} closeOnSelect={true} dateFormat="MM/DD/YYYY" onChange={this.listenStartFromChanges.bind(this)} timeFormat={false} isValidDate={valid}/>
					</Col>
				</Row><br/>
				<Row>
					<Col md={5}>
						<Button bsStyle="primary" style={fieldProps.button} onClick={this.startSync.bind(this)}>Start Sync</Button>
						<Link to={"/home"}><Button style={Object.assign({}, { marginLeft: '10px', color: '#0078D7', borderColor: '#0078D7' }, fieldProps.cancelButton)}><i className="fa fa-home" aria-hidden="true"></i></Button></Link>
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
			marginBottom: 'unset'
		},
		panelBodyTitle : {
			fontSize: '22px',
			color: '#515151'
		},
		panelTitle : {
			fontWeight: 'bold',
			display: 'inline-block',
			color: '#646464'
		},
		panelBody: {
			padding: '70px 0px 20px 80px',
			backgroundColor: 'white'
		}
	};

	let panelBody = (<div style={{height: '100%', width: '92%'}}>
						<Row style={fieldProps.panelBodyTitle}>
							<Col md={1} style={{width: '5%', height: '30px'}}>
							<span>
								<i className="fa fa-database" aria-hidden="true"></i>&nbsp;&nbsp;
							</span>
							</Col>
							<Col> {props.title} </Col>
						</Row><hr/><br/>
						<Row style = {{paddingLeft: '15px'}}>
							{props.body}
						</Row>
					</div>);

	return (
		<div className={"panel panel-default"} style={fieldProps.panel}>
			<div className={"panel-body"} style={fieldProps.panelBody}>
				{panelBody}
			</div>
		</div>
	);
}
