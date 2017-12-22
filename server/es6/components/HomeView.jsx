import React from 'react';
import { observer } from 'mobx-react';
import {Row,  Col, Button, Panel} from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import '../../public/css/homePage.css';

@observer export default class HomeView extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		BackChainActions.isInitialSyncDone();
		BackChainActions.processApplicationSettings();
	}

	render() {
		if(this.props.store.isInitialSetupDone === null) {
			return null;
		} else if(this.props.store.isInitialSetupDone === false) {
			return <Redirect push to="/setup" />;
		}
		let fieldProps = {
			panelPadding : {
				backgroundColor : 'rgba(208, 233, 240, 1)',
				width: '103%',
				height: '100%',
				borderRadius: '10px'
			},
			panelBodyTitle : {
				paddingLeft: '20px',	
				fontSize: '24px',
				color: '#515151'
			},
			panelBody : {
				padding: '70px 0px 20px 80px',
				backgroundColor: 'white'
			},
			button : {
				height: '100px'
			},
			panelDefault : {
				borderStyle : 'none'
			},
			dbNsyncIcon : {
				backgroundColor: 'white',
				marginTop: '28px',
				width: '70px',
				height: '70px',
				borderRadius: '5px',
				cursor: 'pointer'
			}
		};

		const businessTransImage = this.props.store.isInitialSyncDone == true ? "/images/business-transaction-id.png" :  "/images/business-transaction-id-grey.png";
		let className =  "span ";
		let activeOrInactiveClassName = this.props.store.isInitialSyncDone == true ? 'activeSpan' : 'inActiveSpan';
		let descriptiveClassName = this.props.store.isInitialSyncDone == true ? 'activeDescriptive' : 'inActiveDescriptive';
		let innerDiv = this.props.store.isInitialSyncDone == true ? 'innerDiv' : 'innerDivinActive';
		let linkUrl  =  this.props.store.isInitialSyncDone == true ? "/businessId":"#";
		let linkUrlStyle = {cursor: "pointer"};
		if(linkUrl=="#") {
			linkUrlStyle =  {cursor: "default"};
		}
		let businessTxnId = (<div  className = "mainDiv"  style={{paddingTop: '27px'}}>
						<Link style={linkUrlStyle}  to={linkUrl}>
						 	<div className={innerDiv}> 
								<img  style={{paddingLeft: '52px',paddingTop: '5px'}} src ={businessTransImage}/><br/><br/>
								<span className = {className+activeOrInactiveClassName} >Business Transaction ID</span> <br/>
								<p className = {descriptiveClassName}>
									This search returns all the transactions associated with the given Business transaction Id and the transactions shall be verified with Block Chain. Business transaction id can be found in a Payload file. This search will require the transactions to be existing in the local repository.
								</p>
							</div>
						</Link>
					</div>);

		const transIdImage = this.props.store.isInitialSyncDone == true ? "/images/transaction-id.png" :  "/images/transaction-id-grey.png";
		linkUrl  =  this.props.store.isInitialSyncDone == true ? "/transactionId":"#"
		className =  "span transSearch ";
		let txnId = (<div className = "mainDiv" style={{paddingTop: '27px'}}>
						<Link style={linkUrlStyle}   to={linkUrl}>
							<div className={innerDiv}> 
								<img  style={{paddingLeft: '52px',paddingTop: '5px'}} src= {transIdImage}/><br/><br/>
								<span className = {className+activeOrInactiveClassName}>Transaction ID</span> <br/>
								<p className = {descriptiveClassName}>
									This search returns the transaction associated with the given transaction Id and the transaction shall be verified with Block Chain. Transaction id can be found in a Payload file. This search will require the transaction to be existing in the local repository.
								</p>
							</div>
						</Link>
					</div>);
		
		className =  "span payload ";
		let payload = (<div className = "mainDiv" style={{padding: '25px 0px 25px 0px'}}>  
						<span className = "dbActiveSpan"></span>
						<Link to="/payload">
							<div  className="innerDiv" > 
								<img  style={{paddingLeft: '57px',paddingTop: '5px'}} src="/images/payload-file.png" /><br/><br/>
								<span className={className}>Payload File</span> <br/>
								<p className = "activeDescriptive">
									This feature verifies the payload with Block Chain by hashing the payloads and comparing the values in Block Chain. If the payload information exists in the local repository, then the remaining information regarding the transaction shall be retrieved and verified as well.
								</p>
							</div>
						</Link>
					</div>);

		let dbIcon = (<div className="dbNsyncIcon" style={Object.assign({}, {padding: '20px 10px'}, fieldProps.dbNsyncIcon)}>
								<span>
									<i style ={{color: '#3d82c9', fontSize: '2em', paddingRight: '5px'}} className="fa fa-database" aria-hidden="true"></i>
									<i style ={{color: '#249a79', fontSize: '1.2em'}} className="fa fa-check-circle" aria-hidden="true"></i>
								</span>
							</div>);

		let syncIcon = (<div className="dbNsyncIcon" style={Object.assign({}, {padding: '15px 8px'}, fieldProps.dbNsyncIcon)}>
							<span style = {{paddingLeft: '13px', color: '#3d82c9'}}>
								<i style ={{fontSize: '2em'}} className="fa fa-refresh" aria-hidden="true"></i>
								<br/>
								<span style = {{fontSize: '11px',fontWeight: '600'}}>Sync Info</span>
							</span>
						</div>);					
		/*Note: For now we are not removing text based search related code & SearchByTextView.jsx.*/
		let panelBody = (<div style={{height: '100%', width: '92%'}}>
								<Row style={fieldProps.panelBodyTitle}>Verify my transaction with:</Row><br/>
								<Row style={fieldProps.panelPadding}>
									<Col style={{float:'Left',paddingLeft:'20px',backgroundColor:'rgba(217, 216, 208, 1)',width:'310px',borderTopLeftRadius:'10px',borderBottomLeftRadius:'10px'}}>{payload}</Col>
									<Col style={{float:'Left',paddingLeft:'20px'}}>{businessTxnId}</Col>
									<Col style={{float:'Left',paddingLeft:'20px'}}>{txnId}</Col>
									<Col style={{float:'Left',paddingLeft:'20px'}}>{dbIcon}</Col>
									<Col style={{float:'Left',paddingLeft:'20px'}}>{syncIcon}</Col>
								</Row>
						</div>);
        return (
			<div className={"panel panel-default"} style={fieldProps.panelDefault} onClick={this.props.action}>
				<HeaderView store={this.props.store} size="big"/>
				<div className={"panel-body"} style={fieldProps.panelBody}>{panelBody}</div>
		  	</div>
		);
    }
}