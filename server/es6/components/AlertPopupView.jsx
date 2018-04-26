import { observer } from "mobx-react";
import React from 'react';
import BackChainActions from '../BackChainActions';
import { Row, Col, Panel, Modal, Button } from 'react-bootstrap'; 

@observer export default class AlertPopupView extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal dialogClassName={"display-msg-modal"} show={this.props.store.displayAlertPopup} onHide={BackChainActions.closeAlertPopup}>
                <div>
                    <DisplayMessagePopup store={this.props.store} />
                </div>
            </Modal>
            )
    }
}

class DisplayMessagePopup extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let fieldProps = {
            panel: {
                backgroundColor: 'rgba(250, 250, 250, 1)',
                border: 'none',
                marginBottom: 'unset',
                borderRadius: '8px'
            },
            panelHeading: {
                borderTopLeftRadius: '7px',
                borderTopRightRadius: '7px',
            },
            panelTitle: {
                display: 'inline-block',
                color: '#FFFFFF',
                fontWeight: '700'
            },
            panelBody: {
                paddingTop: 40,
                paddingBottom: 20,
                backgroundColor: 'white',
                borderRadius: '8px'
            },
            applyButton: {
                fontWeight: '700',
                width: '85px',
                height: '42px',
                position: 'absolute',
                left:'200px',
                top: '30px'
            }
        };

        let title = null;
        let backgroundColor = null;
        let colorCode = null;
        let className = null;

        switch (this.props.store.alertPopupLevel) {
            case 'ERROR':
                title = "Error";
                backgroundColor = "#d9443f";
                colorCode = "#d9443f";
                className = "fa fa-times-circle fa-3x fa-fw";
                break;
            case 'WARN':
                title = "Warning";
                backgroundColor = "#ffbf55";
                colorCode = "#ffbf55";
                className = "fa fa-info-circle fa-3x fa-fw";    
                break;
            case 'SUCCESS':
                title = "Success";
                backgroundColor = "#73d5a4";
                colorCode = "#73d5a4";
                className = "fa fa-check-circle fa-3x fa-fw"; 
                break;
            case 'CONFIRM':
                title = "?";
                backgroundColor = "#75b3df";
                colorCode = "#75b3df";
                className = "fa fa-question-circle fa-3x fa-fw"; 
                break;
            default:
                title = "Info";
                backgroundColor = "#75b3df";
                colorCode = "#75b3df";
                className = "fa fa-info-circle fa-3x fa-fw";
                break;          
        }

        return (
            <div className={"panel panel-default"} style={fieldProps.panel}>
                <div className={"panel-heading"} style={fieldProps.panelHeading} style={{ backgroundColor: backgroundColor }}>
                    <div className="panel-title" style={fieldProps.panelTitle} >
                        {title}
                    </div>
                    <i onClick={BackChainActions.closeAlertPopup} className="fa fa-times" style={{ float: 'right', cursor: 'pointer', color: '#FFFFFF', fontSize: '21px' }} />
                </div>
                <div className={"panel-body"} style={fieldProps.panelBody}>
                    <Row style={{ paddingLeft: '30px' }}>
                        <Col style={{ color: colorCode }} md={1}><i className={className}></i></Col>
                        <Col style={{ paddingLeft: '35px', paddingTop: '5px', fontSize: '24px', color: '#333333', fontWeight: '600', lineHeight:'21px' }} md={10}>
                            {this.props.store.alertPopupTitle}    
                        </Col>
                        <Col style={{ paddingLeft: '35px', paddingTop: '5px', fontSize: '17px', color: '#333333', fontWeight: '400', lineHeight: '21px' }} md={10}>
                            {this.props.store.alertPopupContent}
                        </Col>
                        <Col style={{ paddingLeft: '35px', height: '80px', fontSize: '17px', color: '#333333', fontWeight: '400', lineHeight: '21px' }} md={10}>
                            <Button style={fieldProps.applyButton} className="btn btn-primary" onClick={BackChainActions.closeAlertPopup}>OK</Button> 
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

