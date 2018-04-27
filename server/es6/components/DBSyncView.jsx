import { observer } from "mobx-react";
import React from 'react';
import {Button} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import BackChainActions from '../BackChainActions';

@observer export default  class DBSyncView extends React.Component {
    constructor(props) {
        super(props);
       
    }

    render() {

       if(this.props.syncType == 'gap'){
        return(
            <div>
				<PartialSynPopUp  />
			</div>
        );
       } else if(this.props.syncType == 'full') {
        return(
            <div>
				<FullSynPopUp />
			</div>
        );
       } else if (this.props.syncType == 'notConnected') {
        return (
            <div>
                <NotConnectedPopUp />
              </div>
        );
       }
    }
}

const PartialSynPopUp = (props) => {
    
    function closeModal() {
		BackChainActions.toggleDBSyncModalViewActive();
	}

    let fieldProps = {
		panel : {
			backgroundColor: 'rgba(250, 250, 250, 1)',
			border:'none',
			marginBottom: 'unset',
			borderRadius: '8px'
		},
		
		panelBody: {
			paddingTop: 40,
			paddingBottom: 40,
			backgroundColor: 'white',
			borderRadius: '8px'
        },
        button : {
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
            borderColor: 'rgb(0, 120, 215)',
            width: '120px'
        },
        cancelButton: {
            padding: '7px 23px',
            color: 'rgb(0, 120, 215)',
            borderColor: 'rgb(0, 120, 215)',
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
        },
        panelTitle: {
            display: 'inline-block',
            color: '#FFFFFF',
            fontWeight: '700'
        }
	};
    return (
        <div className={"panel panel-default"} style={fieldProps.panel}>
            <div className={"panel-heading"} style={fieldProps.panelHeading} style={{ backgroundColor: '#ef941b' }}>
                <div className="panel-title" style={fieldProps.panelTitle} >
                    Warning
                </div>
                <i onClick={BackChainActions.toggleDBSyncModalViewActive}  className="fa fa-times" style={{ float: 'right', cursor: 'pointer', color: '#FFFFFF', fontSize: '21px' }} />
            </div>     
			<div className={"panel-body"} style={fieldProps.panelBody}>
                <span style={{display:'inline',paddingLeft: '20px',paddingRight: '15px'}}><i style ={{color: '#ef941b', fontSize: '2.2em'}} className="fa fa-exclamation-circle" aria-hidden="true"></i> </span>
                <span style={{ display: 'inline', color: '#ef941b', fontSize: '20px', fontWeight: '700', verticalAlign: 'top'}}>Your database is synced with some data missing!</span>
                <span style={{display:'block',paddingLeft: '68px',paddingRight: '10px'}}>You can still verify transactions using Business Transaction ID and Transaction ID but accuracy may not be the highest. Click Sync My DB to sync to current or past date or to close any sequence gaps in your data.</span>
                <div style={{paddingTop:'30px',paddingLeft:'150px'}}>
                    <Button style = {fieldProps.cancelButton} onClick={closeModal} >Close</Button> 
                    &nbsp; &nbsp;<Link to="/startSync"> <Button  className="btn btn-primary" style={fieldProps.button}>Sync My DB</Button></Link>
                </div>
			</div>
		</div>
    );
}

const FullSynPopUp = (props) => {
    
    function closeModal() {
		BackChainActions.toggleDBSyncModalViewActive();
	}

    let fieldProps = {
		panel : {
			backgroundColor: 'rgba(250, 250, 250, 1)',
			border:'none',
			marginBottom: 'unset',
			borderRadius: '8px'
		},
		
		panelBody: {
			paddingTop: 40,
			paddingBottom: 40,
			backgroundColor: 'white',
			borderRadius: '8px'
        },
        button : {
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
            borderColor: 'rgb(0, 120, 215)',
            width: '120px'
        },
        cancelButton: {
            padding: '7px 23px',
            color: 'rgb(0, 120, 215)',
            borderColor: 'rgb(0, 120, 215)',
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
        },
        panelTitle: {
            display: 'inline-block',
            color: '#FFFFFF',
            fontWeight: '700'
        }
	};
    return (
        <div className={"panel panel-default"} style={fieldProps.panel}>
            <div className={"panel-heading"} style={fieldProps.panelHeading} style={{ backgroundColor: '#229978' }}>
                <div className="panel-title" style={fieldProps.panelTitle} >
                    Success
                </div>
                <i onClick={closeModal} className="fa fa-times" style={{ float: 'right', cursor: 'pointer', color: '#FFFFFF', fontSize: '21px' }} />
            </div>      
			<div className={"panel-body"} style={fieldProps.panelBody}>
                <span style={{display:'inline',paddingLeft: '20px',paddingRight: '15px'}}><i style ={{color: '#229978', fontSize: '2.2em'}} className="fa fa-check-circle" aria-hidden="true"></i> </span>
                <span style={{ display: 'inline', color: '#229978', fontSize: '20px', fontWeight: '700',verticalAlign: 'top'}}>Your DB is fully synced. You are good to go!</span>
                <span style={{display:'block',paddingLeft: '68px',paddingRight: '10px'}}>If you would like to sync to a past date, click Sync My Data.</span>
                <div style={{paddingTop:'30px',paddingLeft:'150px'}}>
                    <Button style = {fieldProps.cancelButton} onClick={closeModal} >Close</Button> 
                    &nbsp; &nbsp;<Link to="/startSync"> <Button  className="btn btn-primary" style={fieldProps.button}>Sync My DB</Button></Link>
                </div>
			</div>
		</div>
    );
}

const NotConnectedPopUp = (props) => {

    function closeModal() {
        BackChainActions.toggleDBSyncModalViewActive();
    }

    let fieldProps = {
        panel: {
            backgroundColor: 'rgba(250, 250, 250, 1)',
            border: 'none',
            marginBottom: 'unset',
            borderRadius: '8px'
        },

        panelBody: {
            paddingTop: 40,
            paddingBottom: 40,
            backgroundColor: 'white',
            borderRadius: '8px'
        },
        button: {
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
            borderColor: 'rgb(0, 120, 215)',
            width: '120px'
        },
        cancelButton: {
            padding: '7px 23px',
            color: 'rgb(0, 120, 215)',
            borderColor: 'rgb(0, 120, 215)',
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
        },
        panelTitle: {
            display: 'inline-block',
            color: '#FFFFFF',
            fontWeight: '700'
        }
    };
    return (
        <div className={"panel panel-default"} style={fieldProps.panel}>
            <div className={"panel-heading"} style={fieldProps.panelHeading} style={{ backgroundColor: '#CC0000' }}>
                <div className="panel-title" style={fieldProps.panelTitle} >
                    Error
                </div>
                <i onClick={closeModal} className="fa fa-times" style={{ float: 'right', cursor: 'pointer', color: '#FFFFFF', fontSize: '21px' }} />
            </div>     
            <div className={"panel-body"} style={fieldProps.panelBody}>
                <span style={{ display: 'inline', paddingLeft: '70px', paddingRight: '7px' }}><i style={{ color: '#CC0000', fontSize: '2.2em' }} className="fa fa-ban" aria-hidden="true"></i> </span>
                <span style={{ display: 'inline', color: '#CC0000', fontSize: '20px', fontWeight: '700', verticalAlign: 'top' }}>Your database is not synced!</span>
                <span style={{ display: 'block', paddingLeft: '109px', paddingRight: '10px' }}>A database sync is required to verify transactions using a Business Transaction ID and Transaction ID.</span>
                <div style={{ paddingTop: '30px', paddingLeft: '150px' }}>
                    <Button style={fieldProps.cancelButton} onClick={closeModal} >Close</Button>
                    &nbsp; &nbsp;<Link to="/startSync"> <Button className="btn btn-primary" style={fieldProps.button}>Sync My DB</Button></Link>
                </div>
            </div>
        </div>
    );
}