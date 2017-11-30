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
				backgroundImage : this.props.store.isInitialSyncDone == true ? "url('/images/blue-shadow.png')" :  "url('/images/grey-blue-shadow.png')",
				width: '103%',
				height: '100%'
			},
			panelBodyTitle : {
				paddingLeft: '20px',	
				fontSize: '24px',
				color: '#515151'
			},
			panelBody : {
				paddingTop: 60,
				backgroundColor: 'white',
				height: '460px'
			},
			button : {
				height: '100px'
			},
			panelDefault : {
				borderStyle : 'none'
			},
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
		let col1 = (<div  className = "mainDiv"  style={{paddingTop: '27px'}}>  
						<span  className = "dbActiveSpan"> <img src="/images/db-active.png" /></span>
						<Link style={linkUrlStyle}  to={linkUrl}>
						 	<div className={innerDiv}> 
								<img  style={{paddingLeft: '52px',paddingTop: '5px'}} src ={businessTransImage}/><br/><br/>
								<span className = {className+activeOrInactiveClassName} >Business Transaction ID</span> <br/>
								<p className = {descriptiveClassName}>Some descriptive text to be added here.Some descriptive text to be added here. </p>
							</div>
						</Link>
					</div>);

		const transIdImage = this.props.store.isInitialSyncDone == true ? "/images/transaction-id.png" :  "/images/transaction-id-grey.png";
		linkUrl  =  this.props.store.isInitialSyncDone == true ? "/transactionId":"#"
		className =  "span transSearch ";
		let col2 = (<div className = "mainDiv" style={{paddingTop: '27px'}}>  
						<span className = "dbActiveSpan"> <img src="/images/db-active.png" /></span>
						<Link style={linkUrlStyle}   to={linkUrl}>
							<div className={innerDiv}> 
								<img  style={{paddingLeft: '52px',paddingTop: '5px'}} src= {transIdImage}/><br/><br/>
								<span className = {className+activeOrInactiveClassName}>Transaction ID</span> <br/>
								<p className = {descriptiveClassName}>Some descriptive text to be added here.Some descriptive text to be added here. </p>
							</div>
						</Link>
					</div>);
		
		className =  "span payload ";
		let col3 = (<div className = "mainDiv" style={{paddingTop: '27px'}}>  
						<span className = "dbActiveSpan"> <img src="/images/payload-active.png" /></span>
						<Link to="/payload">
							<div  className="innerDiv" > 
								<img  style={{paddingLeft: '57px',paddingTop: '5px'}} src="/images/payload-file.png" /><br/><br/>
								<span className={className}>Payload File</span> <br/>
								<p className = "activeDescriptive">Some descriptive text to be added here.Some descriptive text to be added here. </p>
							</div>
						</Link>
					</div>);
		
		const busineesTransIdImage = this.props.store.isInitialSyncDone == true ? "/images/business-transaction-search.png" :  "/images/business-transaction-search-grey.png";
		linkUrl  =  this.props.store.isInitialSyncDone == true ? "/search":"#"
		className =  "span textSearch ";
		let col4 = (<div  className = "mainDiv" style={{paddingTop: '27px'}}>  
						<span  className = "dbActiveSpan"> <img src="/images/db-active.png" /></span>
						<Link style={linkUrlStyle}   to={linkUrl}>
							<div className={innerDiv}> 
								<img  style={{paddingLeft: '75px',paddingTop: '22px'}} src= {busineesTransIdImage}/><br/><br/>
								<span className = {className+activeOrInactiveClassName}>Business Transaction Search</span> <br/>
								<p className ={descriptiveClassName}>Some descriptive text to be added here.Some descriptive text to be added here. </p>
							</div>
						</Link>
					</div>);
		
		let panelBody = (<div style={{height: '100%'}}>
								<Row style={fieldProps.panelBodyTitle}>Verify my transaction with:</Row><br/>
								<Row style={fieldProps.panelPadding}>
									<Col style={{float:'Left',paddingLeft:'46px',paddingTop: '21px'}}>{col1}</Col>
									<Col style={{float:'Left',paddingLeft:'20px',paddingTop: '21px'}}>{col2}</Col>
									<Col style={{float:'Left',paddingLeft:'20px',paddingTop: '21px'}}>{col3}</Col>
									<Col style={{float:'Left',paddingLeft:'20px',paddingTop: '21px'}}>{col4}</Col>
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