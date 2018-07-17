import React from 'react';
import { Row, Col, Modal } from 'react-bootstrap'; 
import { observer } from "mobx-react";

@observer export default class MetamaskPopupView extends React.Component {
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
                paddingTop: 30,
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

      return(<Modal dialogClassName = {"metamask-modal"} show={this.props.store.metamaskPopupViewActive}>
                <div className={"panel panel-default"} style={fieldProps.panel}>
                    <div className={"panel-heading"} style={fieldProps.panelHeading} style={{ backgroundColor: "#75b3df" }}>
                        <div className="panel-title" style={fieldProps.panelTitle} >
                            Next Steps
                        </div>
                    </div>
                    <div className={"panel-body"} style={fieldProps.panelBody}>
                        <Row style={{ paddingLeft: '30px' }}>
                            <Col style={{ color: '#75b3df' }} md={1}><i className={'fa fa-info-circle fa-3x fa-fw'}></i></Col>
                            <Col style={{ paddingLeft: '35px', paddingTop: '5px', fontSize: '24px', color: '#333333', fontWeight: '600', lineHeight:'24px' }} md={10}>
                                Please Follow Metamask Prompts
                            </Col>
                            <Col style={{ paddingLeft: '35px', paddingTop: '5px', fontSize: '17px', color: '#333333', fontWeight: '400', lineHeight: '24px', marginBottom: '25px' }} md={10}>
                                Please follow Metamask prompts to submit your transaction. The communication between Metamask and blockchain may take few minutes. Please don't close this browser window. You can come back to this window in a little bit to check the results.
                            </Col>
                        </Row>
                    </div>
                </div>
            </Modal>);
    }
  }