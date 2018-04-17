import { observer } from "mobx-react";
import React from 'react';
import BackChainActions from '../BackChainActions';
import { Row, Col,  Panel, Modal } from 'react-bootstrap';
 

@observer export default class AlertPopupView extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
            return (
                <div>
                    <DisplayErrorMsgView title={this.props.store.alertPopupTitle} msg={this.props.store.alertPopupContent} store={this.props.store}/>
                </div>
            )
        
    }
}

class DisplayErrorMsgView extends React.Component {
    render() {
        let verificationPopupBody = <DisplayErrorMsg msg={this.props.msg} store={this.props.store}/>;

        return (
            <div>
                <DisplayMessagePopup title={this.props.title} body={verificationPopupBody}  />
            </div>
        )
    }
}


const DisplayErrorMsg = (props) => {
    let colorCode = "#229978";
    let className = "fa fa-check-circle fa-3x fa-fw";
    if (props.store.alertPopupLevel == 'ERROR') { 
        colorCode = "#bb0400";
        className = "fa fa-times-circle fa-3x fa-fw";
    } else if (props.store.alertPopupLevel == 'WARN') {
        colorCode = "#f19500";
        className = "fa fa-info-circle fa-3x fa-fw";
    }

    return (
        <Row style={{ paddingLeft: '50px' }}>
            <Col style={{ color: colorCode }} md={1}><i className={className}></i></Col>
            <Col style={{ paddingLeft: '30px', fontSize: '20px', color: '#515151' }} md={10}>
                {props.msg}
            </Col>
        </Row>
    )
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
                backgroundColor: 'white',
            },
            panelTitle: {
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
                    <i onClick={BackChainActions.toggleDisplayAlertPopup} className="fa fa-times" style={{ float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px' }} />
                </div>
                <div className={"panel-body"} style={fieldProps.panelBody}>
                    {this.props.body}
                </div>
            </div>
        );
    }
}

@observer export class DisplayAlertPopupView extends React.Component {
    render() {
        return (<Modal dialogClassName={"display-msg-modal"} show={this.props.store.displayAlertPopup} onHide={BackChainActions.toggleDisplayAlertPopup}>
            <AlertPopupView store={this.props.store} />
        </Modal>);
    }
}

