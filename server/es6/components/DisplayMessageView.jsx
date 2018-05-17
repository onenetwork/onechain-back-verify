import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl} from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';

@observer export default class DisplayMessageView extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		let	verificationPopupBody = <DisplayFailedMsg msg = {this.props.msg}/>;
		
		return (
			<div>
				<DisplayMessagePopup title = {this.props.title} body = {verificationPopupBody} />
			</div>
		)
	}
}

class DisplayMessagePopup extends React.Component {
	constructor(props) {
		super(props);
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
			}
		};

		return (
			<div className={"panel panel-default"} style={fieldProps.panel}>
				<div className={"panel-heading"} style={fieldProps.panelHeading}>
				<div className="panel-title" style={fieldProps.panelTitle}>
					<i className="fa fa-envelope-open" aria-hidden="true"></i>&nbsp;&nbsp;
					{this.props.title}
				</div>
					<i onClick={BackChainActions.toggleDisplayMessageView} className="fa fa-times" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
				</div>
				<div className={"panel-body"} style={fieldProps.panelBody}>
					{this.props.body}
				</div>
			</div>
		);
	}
}

const DisplayFailedMsg = (props) => {
	return (
		<Row style={{paddingLeft:'50px'}}>
			<Col style={{color:'#bb0400'}} md={1}><i className="fa fa-times fa-3x fa-fw"></i></Col>
			<Col style={{paddingLeft:'30px', fontSize:'20px', color:'#515151', paddingTop: '8px'}} md={10}>
				{props.msg}
			</Col>
		</Row>
	)
}