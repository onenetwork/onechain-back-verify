import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel} from 'react-bootstrap';
import BackChainActions from '../BackChainActions';

@observer export default class DisplaySyncView extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		let	verificationPopupBody = <DisplayMsg msg = {this.props.msg}/>;
		
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
                padding: '10px 21px',
			},
			panelTitle : {
				fontWeight: 'bold',
				display: 'inline-block',
				color: '#646464'
			},
			panelBody: {
				paddingBottom: 40,
				backgroundColor: 'white',
				borderRadius: '8px'
            },
            button : {
                padding: '7px 23px',
                fontSize: '16px',
                boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
                borderColor: 'rgb(0, 120, 215)',
                width: '104px'
            }
		};

		return (
			<div className={"panel panel-default"} style={fieldProps.panel}>
				<div style={fieldProps.panelHeading}>
				<div className="panel-title" style={fieldProps.panelTitle}>
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

const DisplayMsg = (props) => {
	return (
        <div>
		<Row style={{paddingLeft:'50px'}}>
			<Col style={{color:'#E85E5A',fontSize:'48px'}} md={1}><i className="fa fa-exclamation-circle"  ></i></Col>
			<Col style={{paddingLeft:'30px', fontSize:'20px', color:'#515151', paddingTop: '8px'}} md={10}>
                To verify transactions, please sync with One Network's Chain Of Custody.
			</Col>
		</Row>
        <Row style={{textAlign: 'center',paddingTop: '26px'}}>
            <Button className="btn btn-primary" style={{width: '170px',height: '40px'}}>Start Data Sync</Button>
        </Row>
        </div>
	)
}