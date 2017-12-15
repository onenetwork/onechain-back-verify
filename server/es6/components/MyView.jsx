import React from 'react';
import ReactDOM from 'react-dom';
import {Row,  Col, Button, Panel} from 'react-bootstrap';
import JsonCommon from '../JsonCommon';
import JSZip from 'jszip';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';

export default class MyView extends React.Component {
  
  componentDidMount() {
		JsonCommon.showCommon(this.props.store.viewTransactions.enterprise);
  }

  downloadZip() {
		let zip = new JSZip();
		let file = zip.file("payload.json", JSON.stringify(this.props.store.payload));
		file.generateAsync({
			type: "blob"
		}).then(function(blob) {
			filesaver.saveAs(blob, "payload.zip");
		}, function(err) {
			console.log("error occurred while generating zip file " + err);
		});
  }

	render() {
		let fieldProps = {
			panelHeading: {
				borderTopRightRadius: '10px',
				borderTopLeftRadius: '10px',
				backgroundColor: 'white'
			},
			panelTitle: {
				fontWeight: 'bold',
				display: 'inline-block',
				color: '#646464'
			},
			panel: {
				backgroundColor: 'rgba(250, 250, 250, 1)',
				marginBottom: '0px',
				borderRadius: '10px'
			},
			panelBody: {
				padding: 20,
				borderBottomRightRadius: '10px',
				borderBottomLeftRadius: '10px'
			},
			jsonPanel: {
				marginRight: '40px',
				marginLeft: '40px',
				marginBottom: '20px',
				backgroundColor: 'white',
				paddingLeft: '1.5em',
				height: '500px'
			},
			viewname: {
				float: 'right'
			}
		};
  
    return (<div className={"panel panel-default"} style={fieldProps.panel}>
			  <div className={"panel-heading"} style={fieldProps.panelHeading}>
				<div className="panel-title" style={fieldProps.panelTitle}>Event Details: My View</div>
				<i onClick={BackChainActions.toggleMyAndDiffView} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
			  </div>
			  <div className={"panel-body"} style={fieldProps.panelBody}>
				<p style={{fontSize: '12px', color: '#646464'}}>
					<strong>Transactional ID:</strong> <span>{this.props.store.viewTransactions.enterprise.id}</span>
					<span style={fieldProps.viewname}>
						<i style={{color: '#229978', fontSize: '16px', cursor: 'pointer'}} className="fa fa-paperclip" aria-hidden="true" onClick={this.downloadZip.bind(this)}/>
						<strong> My View</strong>
					</span>
				</p>
				<br></br>
				<pre id="json-renderer" style={fieldProps.jsonPanel}></pre>
			  </div>
		   </div>);
  }
}