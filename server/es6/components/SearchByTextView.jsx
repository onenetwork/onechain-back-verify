import {Row,  Col, Button, Panel,FormControl,Table,Radio} from 'react-bootstrap';
import React, {Component} from 'react';
import { Link,Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { TablePagination } from 'react-pagination-table';
import HeaderView from "./HeaderView";
const Header = ['',"Model Type", "Business Transaction ID" ];

 
@observer export default class SearchByTextView extends React.Component {
    constructor(props) {
		super(props);
		this.state = {redirect:false,transaction: {},verifyDisabled:true};
	}
	
	businessTransactionTextSearch(event){
		this.props.store.businessTransactionTextSearch = event.target.value.trim();
		if (this.props.store.businessTransactionTextSearch.length > 0 && event.charCode  == 13) {
			this.fetchTransaction();
		}
	}

	loadTransactionsIntoStore() {
		if (this.props.store.businessTransactionIdSearch && this.props.store.searchCriteria) {
			BackChainActions.loadTransactions(this.props.store.businessTransactionIdSearch, this.props.store.searchCriteria);
		}
	}

	fetchTransaction() {
        let me = this;
        let searchText =  me.props.store.businessTransactionTextSearch;
        let uri = '/getTransactionByText/'+searchText;
        
		fetch(uri, {method: 'GET'}).then(function(response) {
			return response.json();
		}, function(error) {
  			console.error('error getting transaction by text search');
		}).then(function(result) {
            me.setState({ transaction: result});
  		})
	}
	
	toggleCheckbox = evt => {
		this.props.store.businessTransactionIdSearch=evt.target.value;
		this.props.store.searchCriteria = 'btId';
		this.setState({verifyDisabled: false});
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}
	
	render() { 
           if (this.props.store.isInitialSetupDone == null) {
                return null;
			} else if (this.props.store.isInitialSetupDone === false) {
				return <Redirect push to="/setup" />;
			}
			let fieldProps = {
				panelHeader : {
				   fontWeight: 'bold',
				   display: 'inline-block'
				},
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
					minHeight: '460px'
				},
				button : {
					height: '35px',
					fontSize: '16px'
				},
				FormControl : {
					width : '30%'
				},
				nameSpan : {
					fontSize: '25px'
				},
				nameColor : {
					color: '#5e5d5d',
					fontFamily :'Open Sans Semibold,Open Sans Regular,Open Sans',
				},
				subNameSpan : {
					fontFamily:'Open Sans'
				},
				blankLine : {
					marginLeft: '20px',
				},
				browse : {
					fontSize: '20px',
					color: 'rgb(94, 93, 93)',
					fontFamily: 'Open Sans',
					fontWeight: '400',
					fontStyle: 'normal'
				},
				inputBox : {
					width: '79%',
					height: '40px',
					height: '45px',
					fontSize: '18px',
					fontFamily: "Open Sans",
					color:'rgb(153, 153, 153)',
					borderColor: 'rgba(153,153,153,1)'
				},
				radio : {
					paddingLeft: '10px',
					marginTop: '0px',
					marginBottom: '0px'
				}

			};

			
			let data=[];
			let transactionsToVerify = [];
			if (this.state.transaction.result) {
				for (let i = 0; i < this.state.transaction.result.length; i++) {
					let transaction = this.state.transaction.result[i];
					let transactionSlices = transaction.transactionSliceObjects;
					for (let j = 0; j < transactionSlices.length; j++) {
						let businessTransactions = transactionSlices[j].businessTransactions;
						for(let k= 0; k < businessTransactions.length; k++) {
							let dataJson= {}
							dataJson.radio=<Radio style={fieldProps.radio}   name="businessTransaction" onChange={this.toggleCheckbox} value={businessTransactions[k].btid} />;
							if(businessTransactions[k].ModelLevelType.indexOf(".")!== -1) {
								dataJson.modelLevelType = businessTransactions[k].ModelLevelType.split(".")[1];
							}
							else {
								dataJson.modelLevelType = businessTransactions[k].ModelLevelType;
							}
							dataJson.btId =businessTransactions[k].btid;
							data.push(dataJson);
						}
					}
				}
			}

			let tableBody = (
                <tbody>
                    {transactionsToVerify}
                </tbody>
            );

			let tablePanel = '';
			if(this.state.transaction.result) {
				tablePanel = (<div style={ {paddingLeft: '22px'}} >
				
				<TablePagination 
					headers={ Header } 
					data={ data } 
					columns="radio.modelLevelType.btId"
					perPageItemCount={ 5 }
					totalCount={ data.length } 
					arrayOption={ [[ "size", 'all', ' ']] }
				/>
				<Link  to="/listTransactions"><button  disabled={this.state.verifyDisabled} style = {fieldProps.button} onClick={this.loadTransactionsIntoStore.bind(this)} className="btn btn-primary" type="button">Select</button></Link>
			   </div>);
			}
			
			let panelHeader = (<div><div style={fieldProps.panelHeader}>Backchain Verify</div></div>);
			
			let panelBody = (<div>
								<Row style={fieldProps.panelBodyTitle}>Search by Business Transaction</Row><br/>
								<Row style={fieldProps.panelPadding}>
									<Col><FormControl type="text" onKeyPress={this.businessTransactionTextSearch.bind(this)}  onChange={this.businessTransactionTextSearch.bind(this)} placeholder="Business Transaction" /></Col><br/>
								</Row>
								{tablePanel}
							</div>);
	
			return (<div className={"panel panel-default"} onClick={this.props.action}>
					<HeaderView store={this.props.store}/>
						<div className={"panel-body"} style={fieldProps.panelBody}>
							<div>
								<Row>
									<Col md={2} style={{paddingLeft:'37px'}}>  
										<img src="/images/business-transaction-search.png" /> 
									</Col>
									<Col md={10} style={{paddingLeft:'0px', paddingTop: '13px'}}> 
										<span style={fieldProps.nameSpan}>
											<strong style={fieldProps.nameColor}> 
												Business Transaction Search
											</strong> 
										</span> <br/>
										<span style={fieldProps.subNameSpan}>
											This search is a free form search that returns all transactions associated with a Business Transaction. . This search will require the transactions to be existing in the local repository.
										</span>
									</Col>
								</Row> 
								<hr style={fieldProps.blankLine}/>
							</div>
							 
							<Row style={fieldProps.panelBodyTitle}> 
								<div> <span style={fieldProps.browse}> Search by entering a business transaction  </span>  </div>
							 	<br/>
								<FormControl type="text"   style={fieldProps.inputBox} onKeyPress={this.businessTransactionTextSearch.bind(this)}  onChange={this.businessTransactionTextSearch.bind(this)} placeholder="Business Transaction"  /><br/>
							</Row>
							{tablePanel}
							 
						</div>
					</div>
			);
		}
}