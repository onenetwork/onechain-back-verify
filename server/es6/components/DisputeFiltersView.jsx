import { observer } from "mobx-react";
import React from 'react';
import { Button, FormControl } from 'react-bootstrap';
import '../../public/css/disputeFiltersView.css';
import Datetime from 'react-datetime';
import moment from 'moment';
import BackChainActions from '../BackChainActions';

@observer export default class DisputeFiltersView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showFilterTable: false,
            draftChkBox: true,
            openChkBox: true,
            closedChkBox: false
        };
        
        this.disputeFilters = {
            status: null,
            searchTnxId: null,
            searchBtId: null,
            searchDisputeId: null,
            tnxFromDate: null,
            tnxToDate: null,
            disputeSubmitFromDate: null,
            disputeSubmitToDate: null,
            disputeCloseFromDate: null,
            disputeCloseToDate: null,
            raisedBy: null,
            transactionRelatedFilter: false,
            reasonCodes: null
        };
    }

    componentWillMount = () => {
        this.selectedCheckboxes = new Set();
        this.selectedCheckboxes.add('Draft');
        this.selectedCheckboxes.add('Open');
    }

    componentDidMount() {
        let status = [];
        let disputeFilter = {
        	status: ["Draft", "Open"],
        	transactionRelatedFilter: false
        }
        BackChainActions.loadDisputes(disputeFilter); //Make sure to pass default filters for the initial fetch. 
    }

    showHideAdvancedFilters(value) {
        let me = this;
        me.setState({ showFilterTable: value });
    }

    toggleCheckboxChange(event) {
        let value = event.target.value;
        let status = [];

        if (event.target.checked) {
            if (value == "Draft") {
                this.setState({ draftChkBox: true });
            } else if (value == "Open") {
                this.setState({ openChkBox: true });
            } else if (value == "Closed") {
                this.setState({ closedChkBox: true });
            }
            this.selectedCheckboxes.add(value);
        } else {
            if (value == "Draft") {
                this.setState({ draftChkBox: false });
            } else if (value == "Open") {
                this.setState({ openChkBox: false });
            } else if (value == "Closed") {
                this.setState({ closedChkBox: false });
            }

            if (this.selectedCheckboxes.has(value)) {
                this.selectedCheckboxes.delete(value);
            }
        }
        for (let checkBoxValue of this.selectedCheckboxes.values()) {
            status.push(checkBoxValue);
        }
        this.disputeFilters.status = status;
    }

    clearDisputeFilters() {
        this.refs.transactionId.value = '';
        this.disputeFilters = {
            status: null,
            searchTnxId: null,
            searchBtId: null,
            searchDisputeId: null,
            tnxFromDate: null,
            tnxToDate: null,
            disputeSubmitFromDate: null,
            disputeSubmitToDate: null,
            disputeCloseFromDate: null,
            disputeCloseToDate: null,
            raisedBy: null,
            transactionRelatedFilter: false
        };
    }

    applyFilters() {
        let me = this;
        if (!this.disputeFilters.status) {
            let status = [];
            for (let checkBoxValue of this.selectedCheckboxes.values()) {
                status.push(checkBoxValue);
            }
            this.disputeFilters.status = status;
        }
        this.disputeFilters.searchTnxId = this.refs.transactionId.value.trim();

        BackChainActions.loadDisputes(this.disputeFilters);
        this.clearDisputeFilters();
        this.showHideAdvancedFilters(false);
    }

    render() {

        const fieldProps = {
            checkbox: {
                display: 'inline',
                width: '16px',
                height: '15px'
            },
            applyButton: {
                width: '80px',
                height: '26px',
                backgroundColor: '#1d85c6',
                boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
                textAlign: 'center',
                lineHeight: '0px',
                float:'right'
            }
        };


        let filterUI = null;
        if (!this.state.showFilterTable) {
            filterUI = (<div className="more-link-div" onClick={this.showHideAdvancedFilters.bind(this, true)}>
                <i className="fa fa-filter" aria-hidden="true" ></i>
                &nbsp;&nbsp;More
                    &nbsp;&nbsp;<i className="fa fa-angle-down" aria-hidden="true" style={{ fontSize: '16px' }}></i>
            </div>);
        } else {
            filterUI = (<div className="more-link-div" onClick={this.showHideAdvancedFilters.bind(this, false)}>
                <i className="fa fa-filter" aria-hidden="true" ></i>
                &nbsp;&nbsp;Less
                    &nbsp;&nbsp;<i className="fa fa-angle-up" aria-hidden="true" style={{ fontSize: '16px' }}></i>
            </div>);
        }

        let checkBox = (
            <div style={{
                display: 'inline', fontWeight: '400', fontStyle: 'normal', fontSize: '12px', width: '70%', float: 'right', paddingRight: '15px' }}>
                Show :
                &nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.draftChkBox} value="Draft" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Draft
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.openChkBox} value="Open" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Open
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.closedChkBox} value="Closed" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Closed
               
                <Button style={fieldProps.applyButton} className="btn btn-primary" onClick={this.applyFilters.bind(this)}>Apply</Button> 
            </div>
        );

        let searchBox = (
            <div style={{ display: 'inline' }}>
                <input className="filter-input" type="text" ref="transactionId" placeholder="Search by Transaction ID"  />
                <i className="fa fa-search" aria-hidden="true" style={{ position: 'relative', left: '-17px', color: '#A1A1A1' }}></i>
            </div>
        );

        return (
            <div className="filter-div">
                {filterUI}
                {this.state.showFilterTable ? <FilterTable disputeFilters={this.disputeFilters} /> : ''}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {searchBox}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {checkBox}
            </div>
        );
    }
}

@observer class FilterTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            wrongDataChkBox: false,
            sentToWrongLocationChkBox: false,
            enteredWrongDataChkBox: false
        };
    }

    componentWillMount = () => { 
        this.reasonCodeCheckboxes = new Set();
    }

    toggleCheckboxChange(event) {
        let value = event.target.value;
        let resonCodes = [];

        if (event.target.checked) {
            if (value == "wrongData") {
                this.setState({ wrongDataChkBox: true });
            } else if (value == "sentToWrongLocation") {
                this.setState({ sentToWrongLocationChkBox: true });
            } else if (value == "enteredWrongData") {
                this.setState({ enteredWrongDataChkBox: true });
            }
            this.reasonCodeCheckboxes.add(value);
        } else {
            if (value == "wrongData") {
                this.setState({ wrongDataChkBox: false });
            } else if (value == "sentToWrongLocation") {
                this.setState({ sentToWrongLocationChkBox: false });
            } else if (value == "enteredWrongData") {
                this.setState({ enteredWrongDataChkBox: false });
            }

            if (this.reasonCodeCheckboxes.has(value)) {
                this.reasonCodeCheckboxes.delete(value);
            }
        }
        for (let reasonCodeValue of this.reasonCodeCheckboxes.values()) {
            resonCodes.push(reasonCodeValue);
        }
        this.props.disputeFilters.reasonCodes = resonCodes;
    }

    listenBtKeyPress(event) {
        this.props.disputeFilters.searchBtId = event.target.value.trim();
        this.props.disputeFilters.transactionRelatedFilter = true;
    }

    listenDisputeKeyPress(event) {
        this.props.disputeFilters.searchDisputeId = event.target.value.trim();
    }

    listenTnxFromDate(date) {
        this.props.disputeFilters.tnxFromDate = moment(date).valueOf();
        this.props.disputeFilters.transactionRelatedFilter = true;
    }

    listenTnxToDate(date) {
        this.props.disputeFilters.tnxToDate = moment(date).valueOf();
        this.props.disputeFilters.transactionRelatedFilter = true;
    }

    listenDisuputeSubmitFromDate(date) {
        this.props.disputeFilters.disputeSubmitFromDate = moment(date).valueOf();
    }

    listenDisuputeSubmitToDate(date) {
        this.props.disputeFilters.disputeSubmitToDate = moment(date).valueOf();
    }

    listenDisuputeCloseFromDate(date) {
        this.props.disputeFilters.disputeCloseFromDate = moment(date).valueOf();
    }

    listenDisuputeCloseToDate(date) {
        this.props.disputeFilters.disputeCloseToDate = moment(date).valueOf();
    }

    listenRaisedByKeyPress(event) {
        this.props.disputeFilters.raisedBy = event.target.value.trim();
    }

    render() {

        const fieldProps = {
            text: {
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: '12px',
                textAlign: 'left',
                width: '140px',
                paddingTop: '10px'
            },
            textBox: {
                width: '337px',
                height: '30px',
                background: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxSizing: 'border-box',
                borderStyle: 'solid',
                borderColor: 'rgba(153,153,153,1)',
                borderRadius: '3px',
                boxShadow: 'none',
                borderWidth: '1px'
            },
            dateTextBox: {
                display: 'inline',
                left: '36px',
                top: '0px',
                width: '100px',
                height: '30px',
                background: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxSizing: 'border-box',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(153, 153, 153, 1)',
                borderRadius: '3px',
            },
            checkbox: {
                display: 'inline',
                width: '16px',
                height: '15px'
            },
            faCalender: {
                color: '#0085C8',
                fontSize: '16px'
            }

        };

        let filterLeftMenus = (
            <div style={{ width: "50%", display: 'inline' }}>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Businees Transaction ID: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '193px', top: '26px' }}>
                    <FormControl type="text" style={fieldProps.textBox} onKeyPress={this.listenBtKeyPress.bind(this)} onChange={this.listenBtKeyPress.bind(this)}/>
                </div>
                <div>
                    <div style={fieldProps.text}>Transaction Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '193px', top: '73px', fontSize: '12px' }}>
                            From &nbsp; <Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" onChange={this.listenTnxFromDate.bind(this)} timeFormat={false} className="date-control"  />&nbsp;&nbsp;
                            &nbsp;&nbsp;
                            To &nbsp; <Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" timeFormat={false} onChange={this.listenTnxToDate.bind(this)} className="date-control"  />
                        </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Reason Code: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '193px', top: '126px', fontSize: '12px' }}>
                        <FormControl type="checkbox" checked={this.state.wrongDataChkBox} value="wrongData" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)}/>&nbsp;Data is wrong <br />
                        <FormControl type="checkbox" checked={this.state.sentToWrongLocationChkBox} value="sentToWrongLocation" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)}/>&nbsp;Sent to wrong location <br />
                        <FormControl type="checkbox" checked={this.state.enteredWrongDataChkBox} value="enteredWrongData" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)}/>&nbsp;Entered wrong data 
                        </div>
                </div>
            </div>
        );

        let filterRightMenus = (
            <div style={{ width: '50%', right: '0px', top: '23px', position: 'absolute' }}>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Dispute ID: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '5px' }}>
                    <FormControl type="text" style={fieldProps.textBox} onKeyPress={this.listenDisputeKeyPress.bind(this)} onChange={this.listenDisputeKeyPress.bind(this)}/>
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Submitted Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '50px', fontSize: '12px' }}>
                        From &nbsp; <Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" timeFormat={false} onChange={this.listenDisuputeSubmitFromDate.bind(this)} className="date-control"  />
                        &nbsp;&nbsp;
                            To &nbsp;<Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" timeFormat={false} onChange={this.listenDisuputeSubmitToDate.bind(this)} className="date-control" />
                    </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Closed Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '100px', fontSize: '12px' }}>
                        From &nbsp;<Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" timeFormat={false} onChange={this.listenDisuputeCloseFromDate.bind(this)} className="date-control"  />
                        &nbsp;&nbsp;
                            To &nbsp;<Datetime closeOnSelect={true} dateFormat="MM/DD/YYYY" timeFormat={false} onChange={this.listenDisuputeCloseToDate.bind(this)} className="date-control" />
                    </div>
                </div>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Raised By: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '145px' }}>
                    <FormControl type="text" style={fieldProps.textBox} onKeyPress={this.listenRaisedByKeyPress.bind(this)} onChange={this.listenRaisedByKeyPress.bind(this)}/>
                </div>
            </div>
        );

        return (
            <div className="filter-table-div">
                {filterLeftMenus}
                {filterRightMenus}
            </div>
        );
    }
}