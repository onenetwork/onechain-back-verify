import {Row,  Col, Button, FormControl} from 'react-bootstrap';
import React, {Component} from 'react';
import BackChainActions from '../BackChainActions';
import { Link,Redirect } from 'react-router-dom';
import { observer } from 'mobx-react';
import HeaderView from "./HeaderView";

@observer export default class SearchByTransactionIdView extends React.Component {
    constructor(props) {
        super(props);
		this.state = {redirect:false,verifyDisabled:true};
		this.transactionIdInputVal = null;
	}

	listenKeyPress(event){
		this.transactionIdInputVal	= event.target.value.trim();
		if(this.transactionIdInputVal.length >0) {
			this.setState({verifyDisabled: false});
		}
		else {
			this.setState({verifyDisabled: true});
		}
		if (this.transactionIdInputVal.length >0 && event.charCode  == 13) {
			this.loadTransactionIntoStore();
			this.setState({redirect: true});
		}
	}

	loadTransactionIntoStore() {
		BackChainActions.loadTransactions(this.transactionIdInputVal, "tnxId");
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}

    render () {
		if (this.props.store.isInitialSetupDone == null) {
			return null;
		} else if (this.props.store.isInitialSetupDone === false) {
			return <Redirect push to="/setup" />;
		}		
		if (this.state.redirect) {
            return <Redirect push to="/listTransactions" />;
		} else {
			let fieldProps = {
				panelPadding : {
					paddingLeft: '35px',
					width: '34%'
				},
				panelBodyTitle : {
					paddingLeft: '36px',
					fontSize: '13px'
				},
				panelBody : {
					paddingTop: 20,
					backgroundColor: 'white',
					height: '460px'
				},
				button : {
					padding: '7px 23px',
					fontSize: '16px',
					boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
					borderColor: 'rgb(0, 120, 215)',
					width: '104px'
				},
				cancelButton: {
					padding: '7px 23px',
					color: 'rgb(0, 120, 215)',
					borderColor: 'rgb(0, 120, 215)',
					fontSize: '16px',
					boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
				},
				logo: {
					position: 'relative',
					left: '8%',
					marginLeft: -55
				},
				nameSpan : {
					marginLeft: '136px',
					fontSize: '25px'
				},
				nameColor : {
					color: '#5e5d5d'
				},
				subNameSpan : {
					position: 'relative',
					verticalAlign: '-22px',
					left: '-15%',
					fontFamily:'Open Sans'
				},
				blankLine : {
					marginLeft: '20px',
				},
				browse : {
					fontSize: '20px',
					color: 'rgb(94, 93, 93)',
					fontFamily: 'Open Sans'
				},
				inputBox : {
					width: '79%',
					height: '45px',
					fontSize: '18px',
					fontFamily: "Open Sans",
					color:'rgb(153, 153, 153)',
					borderColor: 'rgba(153,153,153,1)'
				}
			};
			
			return (
				<div className={"panel panel-default"} onClick={this.props.action}>
					<HeaderView store={this.props.store}/>
					<div className={"panel-body"} style={fieldProps.panelBody}>
					<Row>   
						<img src="/images/transaction-id.png" style={fieldProps.logo}/> 
						<span style={fieldProps.nameSpan}>
							<strong style={fieldProps.nameColor}> 
								Transaction ID
							</strong> 
						</span> 
						<span style={fieldProps.subNameSpan}>Some descriptive text to be added here. Some descriptive text to be added here. Some descriptive text here.</span>
					</Row> 

					<hr style={fieldProps.blankLine}/>
								
					<br/>

					<Row style={fieldProps.panelBodyTitle}>
						<div> <span style={fieldProps.browse}> Enter a Transaction ID to verify  </span>  </div>
						<br/>
						<FormControl type="text"   style={fieldProps.inputBox} onKeyPress={this.listenKeyPress.bind(this)} onChange={this.listenKeyPress.bind(this)}  placeholder="Transaction ID" />
						<br/> <br/>
						<Link to="/listTransactions"><Button disabled={this.state.verifyDisabled} className="btn btn-primary" style={fieldProps.button} onClick={this.loadTransactionIntoStore.bind(this)}>Verfiy</Button></Link>
						&nbsp; &nbsp; <Link  to="/index"><Button style = {fieldProps.cancelButton} >Cancel</Button></Link>
					</Row>
								
					</div>
				</div>
			);

		}
    }
}