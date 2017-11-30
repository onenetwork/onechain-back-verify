import React, {Component} from 'react';
import {Row,Col,Button,Panel,ListGroupItem,ListGroup} from 'react-bootstrap';
import JSZip from 'jszip';
import filesaver from '../FileSaver';
import HeaderView from "./HeaderView";
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Redirect,Link } from 'react-router-dom';
import '../../public/css/payload.css';

@observer export default class PayloadView extends React.Component {
	constructor(props) {
			super(props);
			this.state = {
					validTransactions: [],
					fileUpload:[],
					redirect : false,
					verifyDisabled:true
			}
	}
	
	handleSubmit(e) {
		e.preventDefault();
		const _this = this;

		if(!this.state.actualFile){
			alert('Please select the payload file');
			return;
		}
	
		JSZip.loadAsync(this.state.actualFile)
			.then(function(zip) {
				let current = _this;
				for (let key in zip.files) {
					let me = current;
					zip.files[key].async('binarystring').then(function(data) {
						const _this = me;
						let dataArr = JSON.parse("[" + data + "]")[0];
						BackChainActions.mergeUploadedPayloadWithDb(dataArr, function() {
							_this.setState({
								redirect: true
							});
						});
					})
				}
			})
	}
	handleFile(e) {
			const reader = new FileReader();
			const file = e.target.files[0];
			document.getElementById('fileName').innerHTML = file.name;
			reader.onload = (upload) => {
				this.setState({
						actualFile: file,
						verifyDisabled : false
				});
			};
			reader.readAsDataURL(file);
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
		
		if (this.state.redirect) {
            return <Redirect push to="/listTransactions" />;
		} 
		else {
				let fieldProps = {
					panelHeader: {
							fontWeight: 'bold',
							display: 'inline-block'
					},
					panelPadding: {
							paddingLeft: '35px'
					},
					panelBodyTitle: {
							paddingLeft: '50px',
							fontSize: '13px'
					},
					panelBody: {
						paddingTop: 20,
						backgroundColor: 'white',
						height: '460px'
					},
					button: {
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
						left: '-13%',
						fontFamily:'Open Sans'
					},
					blankLine : {
						marginLeft: '20px',
					},
					browse : {
						fontSize: '20px',
						color: 'rgb(94, 93, 93)',
						fontFamily: 'Open Sans'
					}	
			};
			let validTransactions = [];
			for (let i = 0; i < this.state.validTransactions.length; i++) {
					validTransactions.push(<ListGroupItem key={i}>
							<Row>
								Transaction Id: {
									this.state.validTransactions[i]['Transaction Id']
								} 
							</Row> 
						</ListGroupItem>);
			}
			let panelHeader = (<div style = {fieldProps.panelHeader}> Backchain Verify </div>);

				return (<div className={"panel panel-default"} onClick={this.props.action}>
							<HeaderView store={this.props.store}/>
							<div className={"panel-body"} style={fieldProps.panelBody}>
							<div>
								<Row>   <img src="/images/payload-file.png" style={fieldProps.logo}/> 
										<span style={fieldProps.nameSpan}>
											<strong style={fieldProps.nameColor}> 
												Payload File 
											</strong> 
										</span> 
										<span style={fieldProps.subNameSpan}>Some descriptive text to be added here. Some descriptive text to be added here. Some descriptive text here.</span>
								</Row> 

								<hr style={fieldProps.blankLine}/>
								
								<br/>

								<Row style = {fieldProps.panelPadding} >
									<div> <span style={fieldProps.browse}> Browse for a payload to verify  </span>  </div>
									<br/>
									<div sm={12}>
										<form onSubmit = {this.handleSubmit.bind(this)} 	encType = "multipart/form-data" >
											<label className="fileContainer">
												<span className="fileContainerSpan">Choose file</span>
												<input className="inputfile" type = "file" onChange = {this.handleFile.bind(this)} accept="application/zip" /> 
											</label>	 
											<div id="fileName" className="fileName">No file chosen</div>
											< br /> < br /> 
											<Button  className="btn btn-primary" disabled={this.state.verifyDisabled}  style = {fieldProps.button} type="submit">Verify</Button> 
											&nbsp; &nbsp; <Link  to="/index"><Button style = {fieldProps.cancelButton} >Cancel</Button></Link>
										</form>
									</div> 
								</Row > 
							</div><br/ >
							<ListGroup > { validTransactions } </ListGroup> 
							</div>
						</div>
				);
		}
	}
}