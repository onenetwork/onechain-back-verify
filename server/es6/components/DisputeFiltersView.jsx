import { observer } from "mobx-react";
import React from 'react';
import { Button, FormControl } from 'react-bootstrap';
import '../../public/css/disputeFiltersView.css';
import Datetime from 'react-datetime';
import moment from 'moment';
import BackChainActions from '../BackChainActions';
import { disputeHelper } from '../DisputeHelper';
import { toJS } from 'mobx';

const fieldProps = {
    filterDiv: {
        borderWidth: '0px',
        background: 'inherit',
        backgroundColor: 'rgba(242, 242, 242, 1)',
        border: 'none',
        borderRadius: '10px',
        boxShadow: 'none',
        fontSize: '12px',
        textAlign: 'left',
        display: 'inline',
        paddingLeft: '6px',
        paddingRight: '6px'
    },
    closeDiv: {
        borderWidth: '0px',
        width: '11px',
        height: '13px',
        background: 'inherit',
        backgroundColor: 'rgba(242, 242, 242, 1)',
        border: 'none',
        borderRadius: '0px',
        boxShadow: 'none',
        fontWeight: '400',
        fontStyle: 'normal',
        fontSize: '11px',
        color: '#A1A1A1',
        textAlign: 'left',
        display: 'inline'
    }
};
@observer export default class DisputeFiltersView extends React.Component {

    constructor(props) {
        super(props);
        this.filterApplied = false;
        this.state = {
            showFilterTable: false,
            displayFilters:false,
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
            raisedByAddress: [],
            transactionRelatedFilter: false,
            reasonCodes: null
        };
    }

    componentWillMount = () => {
        this.selectedCheckboxes = new Set();
        this.selectedCheckboxes.add("DRAFT");
        this.selectedCheckboxes.add("OPEN");
    }

    componentDidMount() {      
        let disputingPartyAddress = this.getDisputingPartyAddress(this.props.store.entNameOfLoggedUser);
        this.disputeFilters = {
            status: ["DRAFT", "OPEN"],
            transactionRelatedFilter: false,
            raisedByAddress: disputingPartyAddress
        }
        BackChainActions.loadDisputes(this.disputeFilters); //Make sure to pass default filters for the initial fetch. 
    }

    getDisputingPartyAddress(entName) {
        let backChainAddressMapping = toJS(this.props.store.backChainAddressMapping);
        let backChainAddressesOfEnt = [];
        for (let key in backChainAddressMapping) {
            if (backChainAddressMapping.hasOwnProperty(key)) {
                let entNameInMapping = backChainAddressMapping[key];
                if(entNameInMapping == entName) {
                    backChainAddressesOfEnt.push(key);
                }
            }
        }
        return backChainAddressesOfEnt;
    }

    showHideAdvancedFilters(value) {
        let me = this;
        me.setState({ showFilterTable: value });
    }

    toggleCheckboxChange(event) {
        let value = event.target.value;
        let status = [];

        if (event.target.checked) {
            if (value == "DRAFT") {
                this.setState({ draftChkBox: true });
            } else if (value == "OPEN") {
                this.setState({ openChkBox: true });
            } else if (value == "CLOSED") {
                this.setState({ closedChkBox: true });
            }
            this.selectedCheckboxes.add(value);
        } else {
            if (value == "DRAFT") {
                this.setState({ draftChkBox: false });
            } else if (value == "OPEN") {
                this.setState({ openChkBox: false });
            } else if (value == "CLOSED") {
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
            raisedByAddress: [],
            transactionRelatedFilter: false
        };
    }

    applyFilters(filterApplied) {
        let me = this;
        this.filterApplied = filterApplied;
        if (!this.disputeFilters.status) {
            let status = [];
            for (let checkBoxValue of this.selectedCheckboxes.values()) {
                status.push(checkBoxValue);
            }
            this.disputeFilters.status = status;
        }
        if (this.refs && this.refs.transactionId) {
            this.disputeFilters.searchTnxId = this.refs.transactionId.value.trim().length>0?this.refs.transactionId.value.trim() : null;
        }
        if (this.disputeFilters.tnxFromDate || this.disputeFilters.tnxToDate) {
            this.disputeFilters.transactionRelatedFilter = true;
        }
        else {
            this.disputeFilters.transactionRelatedFilter = false;
        }
        if(this.disputeFilters.raisedBy) {
            this.disputeFilters.raisedByAddress = this.getDisputingPartyAddress(this.disputeFilters.raisedBy);
        }
        BackChainActions.loadDisputes(this.disputeFilters);
        this.showHideAdvancedFilters(false);
    }

    resetFilters() {
        this.clearDisputeFilters();
        this.showHideAdvancedFilters(false);
        this.applyFilters(false);
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
            },
            resetButton: {
                width: '80px',
                height: '26px',
                boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
                textAlign: 'center',
                lineHeight: '0px',
                padding: '7px 23px',
                borderColor: 'rgb(0, 120, 215)',
                color: 'rgb(0, 120, 215)',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                position: 'absolute',
                right: '143px'
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
                display: 'inline', fontWeight: '400', fontStyle: 'normal', fontSize: '12px', width: '70%', float: 'right', paddingRight: '15px'
            }} className="checkBox-div">
                Show :
                &nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.draftChkBox} value="DRAFT" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Draft
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.openChkBox} value="OPEN" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Open
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" checked={this.state.closedChkBox} value="CLOSED" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp; Closed
               
                <Button style={fieldProps.resetButton} className="btn btn-primary resetButton" onClick={this.resetFilters.bind(this)}>Reset</Button>   
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
            <div>
                <DisplayFilters disputeFilters={this.disputeFilters} applyFilters={this.applyFilters.bind(this)} filterApplied={this.filterApplied}/>
                <div className="filter-div">
                    {filterUI}
                    {this.state.showFilterTable ? <FilterTable disputeFilters={this.disputeFilters} store={this.props.store}/> : ''}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {searchBox}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {checkBox}
                </div>
            </div>    
        );
    }
}

@observer class FilterTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hashNotFound: false,
            inputDisputed: false,
            tnxDateDisputed: false,
            tnxPartiesDisputed: false,
            bisputeBt: false,
            financialDispute: false,
            raisedBy: null,
            searchBtId: null,
            searchDisputeId: null,
            tnxFromDate: null,
            tnxToDate: null,
            disputeSubmitFromDate: null,
            disputeSubmitToDate: null,
            disputeCloseFromDate: null,
            disputeCloseToDate : null
        };
    }

    componentWillMount = () => { 
        this.reasonCodeCheckboxes = new Set();
    }

    componentDidMount = () => {
        this.props.disputeFilters.raisedBy = this.props.disputeFilters.raisedBy ? this.props.disputeFilters.raisedBy : this.props.store.entNameOfLoggedUser;
        this.setAllStateValues()
    }

    setAllStateValues() {
        let me = this;
        let localState = {}
        if (this.props.disputeFilters.reasonCodes) {
            let reasonCodeArray = this.props.disputeFilters.reasonCodes; 
            localState.hashNotFound = reasonCodeArray.indexOf("HASH_NOT_FOUND") > -1 ? true : false;
            localState.inputDisputed = reasonCodeArray.indexOf("INPUT_DISPUTED") > -1 ? true : false;
            localState.tnxDateDisputed = reasonCodeArray.indexOf("TRANSACTION_DATE_DISPUTED") > -1 ? true : false;
            localState.tnxPartiesDisputed = reasonCodeArray.indexOf("TRANSACTION_PARTIES_DISPUTED") > -1 ? true : false;
            localState.bisputeBt = reasonCodeArray.indexOf("DISPUTE_BUSINESS_TRANSACTIONS") > -1 ? true : false;
            localState.financialDispute = reasonCodeArray.indexOf("FINANCIAL_DISPUTED") > -1 ? true : false;

            for (let i = 0; i < reasonCodeArray.length; i++) {
                me.reasonCodeCheckboxes.add(reasonCodeArray[i]);
            }
        }

        // added to localState, if we want to set value depends on some condition
        localState.raisedBy = this.props.disputeFilters.raisedBy ? this.props.disputeFilters.raisedBy:this.props.store.entNameOfLoggedUser;
        localState.searchBtId = this.props.disputeFilters.searchBtId;
        localState.searchDisputeId = this.props.disputeFilters.searchDisputeId;
        localState.tnxFromDate = this.props.disputeFilters.tnxFromDate ? moment(new Date(this.props.disputeFilters.tnxFromDate)).format('MM/DD/YYYY'): '' ;
        localState.tnxToDate = this.props.disputeFilters.tnxToDate ? moment(new Date(this.props.disputeFilters.tnxToDate)).format('MM/DD/YYYY') :'';
        localState.disputeSubmitFromDate = this.props.disputeFilters.disputeSubmitFromDate ? moment(new Date(this.props.disputeFilters.disputeSubmitFromDate)).format('MM/DD/YYYY') : '';
        localState.disputeSubmitToDate = this.props.disputeFilters.disputeSubmitToDate ? moment(new Date(this.props.disputeFilters.disputeSubmitToDate)).format('MM/DD/YYYY') : '';
        localState.disputeCloseFromDate = this.props.disputeFilters.disputeCloseFromDate ? moment(new Date(this.props.disputeFilters.disputeCloseFromDate)).format('MM/DD/YYYY') : '';
        localState.disputeCloseToDate = this.props.disputeFilters.disputeCloseToDate ? moment(new Date(this.props.disputeFilters.disputeCloseToDate)).format('MM/DD/YYYY') : '';
        

        this.setState({
            hashNotFound: localState.hashNotFound,
            inputDisputed: localState.inputDisputed,
            tnxDateDisputed: localState.tnxDateDisputed,
            tnxPartiesDisputed: localState.tnxPartiesDisputed,
            bisputeBt: localState.bisputeBt,
            financialDispute: localState.financialDispute,
            raisedBy: localState.raisedBy,
            searchBtId: localState.searchBtId,
            searchDisputeId: localState.searchDisputeId,
            tnxFromDate: localState.tnxFromDate,
            tnxToDate: localState.tnxToDate,
            disputeSubmitFromDate: localState.disputeSubmitFromDate,
            disputeSubmitToDate: localState.disputeSubmitToDate,
            disputeCloseFromDate: localState.disputeCloseFromDate,
            disputeCloseToDate: localState.disputeCloseToDate
        });
    }
    
    toggleCheckboxChange(event) {
        let value = event.target.value;
    let resonCodes = null;
    
     
        if (event.target.checked) {
            if (value == "HASH_NOT_FOUND") {
                this.setState({ hashNotFound: true });
            } else if (value == "INPUT_DISPUTED") {
                this.setState({ inputDisputed: true });
            } else if (value == "TRANSACTION_DATE_DISPUTED") {
                this.setState({ tnxDateDisputed: true });
            } else if (value == "TRANSACTION_PARTIES_DISPUTED") {
                this.setState({ tnxPartiesDisputed: true });
            } else if (value == "DISPUTE_BUSINESS_TRANSACTIONS") {
                this.setState({ bisputeBt: true });
            } else if (value == "FINANCIAL_DISPUTED") {
                this.setState({ financialDispute: true });
            }
            this.reasonCodeCheckboxes.add(value);
        } else {
            if (value == "HASH_NOT_FOUND") {
                this.setState({ hashNotFound: false });
            } else if (value == "INPUT_DISPUTED") {
                this.setState({ inputDisputed: false });
            } else if (value == "TRANSACTION_DATE_DISPUTED") {
                this.setState({ tnxDateDisputed: false });
            } else if (value == "TRANSACTION_PARTIES_DISPUTED") {
                this.setState({ tnxPartiesDisputed: false });
            } else if (value == "DISPUTE_BUSINESS_TRANSACTIONS") {
                this.setState({ bisputeBt: false });
            } else if (value == "FINANCIAL_DISPUTED") {
                this.setState({ financialDispute: false });
            }

            if (this.reasonCodeCheckboxes.has(value)) {
                this.reasonCodeCheckboxes.delete(value);
            }
        }
        if(this.reasonCodeCheckboxes.size > 0) {
            resonCodes = [];
            for (let reasonCodeValue of this.reasonCodeCheckboxes.values()) {
                resonCodes.push(reasonCodeValue);
            }
        }
        this.props.disputeFilters.reasonCodes = resonCodes;
    }

    listenBtKeyPress(event) {
        this.setState({ searchBtId: event.target.value.trim() });
        this.props.disputeFilters.searchBtId = event.target.value.trim().length> 0 ? event.target.value.trim() : null;
    }

    listenDisputeKeyPress(event) {
        this.setState({ searchDisputeId: event.target.value.trim() });
        this.props.disputeFilters.searchDisputeId = event.target.value.trim().length> 0 ? event.target.value.trim() : null;
    }

    listenTnxFromDate(date) {
        this.props.disputeFilters.tnxFromDate = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf();
    }

    listenTnxToDate(date) {
        this.props.disputeFilters.tnxToDate  = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf();
    }

    listenDisuputeSubmitFromDate(date) {
        this.props.disputeFilters.disputeSubmitFromDate = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf() ;
    }

    listenDisuputeSubmitToDate(date) {
        this.props.disputeFilters.disputeSubmitToDate = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf() ;
    }

    listenDisuputeCloseFromDate(date) {
        this.props.disputeFilters.disputeCloseFromDate = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf() ;
    }

    listenDisuputeCloseToDate(date) {
        this.props.disputeFilters.disputeCloseToDate = isNaN(moment(date).valueOf()) ? null : moment(date).valueOf() ;
    }

    listenRaisedByKeyPress(event) {
        let raisedByValue = event.target.value.trim().length > 0 ? event.target.value.trim() : null;
        this.setState({ raisedBy: raisedByValue });        
        this.props.disputeFilters.raisedBy = raisedByValue;
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
                    <FormControl type="text" value={this.state.searchBtId || ''} style={fieldProps.textBox} onKeyPress={this.listenBtKeyPress.bind(this)} onChange={this.listenBtKeyPress.bind(this)}/>
                </div>
                <div>
                    <div style={fieldProps.text}>Transaction Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '193px', top: '73px', fontSize: '12px' }}>
                        From &nbsp; <Datetime closeOnSelect={true} value={this.state.tnxFromDate || ''} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenTnxFromDate.bind(this)} className="date-control"  />&nbsp;&nbsp;
                            &nbsp;&nbsp;
                            To &nbsp; <Datetime closeOnSelect={true} value={this.state.tnxToDate || ''} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenTnxToDate.bind(this)} className="date-control"  />
                        </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Reason Code: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '193px', top: '126px', fontSize: '12px' }}>
                            <FormControl type="checkbox" checked={this.state.hashNotFound || false} value="HASH_NOT_FOUND" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Hash Not Found <br />
                            <FormControl type="checkbox" checked={this.state.inputDisputed || false} value="INPUT_DISPUTED" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Incorrect Data Input <br />
                            <FormControl type="checkbox" checked={this.state.tnxDateDisputed || false} value="TRANSACTION_DATE_DISPUTED" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Incorrect Transaction Date <br />
                            <FormControl type="checkbox" checked={this.state.tnxPartiesDisputed || false} value="TRANSACTION_PARTIES_DISPUTED" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Incorrect Transaction Participants <br />
                            <FormControl type="checkbox" checked={this.state.bisputeBt || false} value="DISPUTE_BUSINESS_TRANSACTIONS" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Incorrect Transaction Events <br />
                            <FormControl type="checkbox" checked={this.state.financialDispute || false} value="FINANCIAL_DISPUTED" style={fieldProps.checkbox} onChange={this.toggleCheckboxChange.bind(this)} />&nbsp;Financial Issue
                        </div>
                </div>
            </div>
        );

        let filterRightMenus = (
            <div style={{ width: '50%', right: '0px', top: '23px', position: 'absolute' }}>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Dispute ID: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '5px' }}>
                    <FormControl type="text" value={this.state.searchDisputeId || ''}  style={fieldProps.textBox} onKeyPress={this.listenDisputeKeyPress.bind(this)} onChange={this.listenDisputeKeyPress.bind(this)}/>
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Submitted Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '50px', fontSize: '12px' }}>
                        From &nbsp;&nbsp;<Datetime closeOnSelect={true} value={this.state.disputeSubmitFromDate || false} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenDisuputeSubmitFromDate.bind(this)} className="date-control"  />
                        &nbsp;&nbsp;
                            To &nbsp;<Datetime closeOnSelect={true} value={this.state.disputeSubmitToDate || false} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenDisuputeSubmitToDate.bind(this)} className="date-control" />
                    </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Closed Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '100px', fontSize: '12px' }}>
                        From &nbsp;&nbsp;<Datetime closeOnSelect={true} value={this.state.disputeCloseFromDate || false} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenDisuputeCloseFromDate.bind(this)} className="date-control"  />
                        &nbsp;&nbsp;
                            To &nbsp;<Datetime closeOnSelect={true} value={this.state.disputeCloseToDate || false} dateFormat="MM/DD/YYYY" timeFormat={true} onChange={this.listenDisuputeCloseToDate.bind(this)} className="date-control" />
                    </div>
                </div>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Raised By: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '145px' }}>
                    <FormControl type="text" value={this.state.raisedBy || ''} style={fieldProps.textBox} onKeyPress={this.listenRaisedByKeyPress.bind(this)} onChange={this.listenRaisedByKeyPress.bind(this)} />
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

@observer class DisplayFilters extends React.Component { 
    constructor(props) { 
        super(props);
        this.displayTransactionDate = true;
        this.displaySubmittedDate = true;
        this.displayCloseDate = true;

        this.reasonCodeNameValueMap = {
            HASH_NOT_FOUND: "Hash Not Found",
            INPUT_DISPUTED: "Incorrect Data Input" ,
            TRANSACTION_DATE_DISPUTED: "Incorrect Transaction Date",
            TRANSACTION_PARTIES_DISPUTED: "Incorrect Transaction Participants",
            DISPUTE_BUSINESS_TRANSACTIONS: "Incorrect Transaction Events",
            FINANCIAL_DISPUTED: "Financial Issue",
        }

        this.map = {
            searchBtId: "Bus Trans",
            tnxFromDate: "Trans Date",
            tnxToDate: "Trans Date",
            reasonCodes: "Reason",
            searchDisputeId: "Dispute ID",
            disputeSubmitFromDate: "Submit Date",
            disputeSubmitToDate: "Submit Date",
            disputeCloseFromDate: "Close Date",
            disputeCloseToDate: "Close Date",
            raisedBy: "Raised By"
        };
    }

    componentDidUpdate = () => {
        this.displayTransactionDate = true;
        this.displaySubmittedDate = true;
        this.displayCloseDate = true;
    }

    closeFilter(filterName, reasonCode) {
        switch (filterName) {
            case "tnxFromDate":
            case "tnxToDate":
                this.props.disputeFilters.tnxFromDate = null;
                this.props.disputeFilters.tnxToDate = null;
                break;
            case "disputeSubmitFromDate":
            case "disputeSubmitToDate":
                this.props.disputeFilters.disputeSubmitFromDate = null;
                this.props.disputeFilters.disputeSubmitToDate = null;
                break;
            case "disputeCloseFromDate":
            case "disputeCloseToDate":
                this.props.disputeFilters.disputeCloseFromDate = null;
                this.props.disputeFilters.disputeCloseToDate = null;
                break;
            case "reasonCodes":
                let selectedReasonCodes = [];
                for (let i = 0; i < this.props.disputeFilters["reasonCodes"].length; i++) { 
                    if (reasonCode != this.props.disputeFilters["reasonCodes"][i]) {
                        selectedReasonCodes.push(this.props.disputeFilters["reasonCodes"][i]);
                    }
                }
                if(selectedReasonCodes.length == 0) {
                    selectedReasonCodes = null;
                }
                this.props.disputeFilters.reasonCodes = selectedReasonCodes;
                break;
            default:
                this.props.disputeFilters[filterName] = null;
                break;
        }
        this.props.applyFilters(true);
    }

    renderFilterDivs(disputeFilters) {        
        let filters = [];
        for (let filterName in disputeFilters) { 
            if (disputeHelper.isValueNotNull(disputeFilters[filterName])
                && this.map.hasOwnProperty(filterName)) {
                filters.push(this.createFilterDivs(this.map[filterName], disputeFilters, filterName));
            }
        }
        return filters;
    }

    createFilterDivs(name, disputeFilters, filterName) {
        switch (filterName) { 
            case "tnxFromDate":
            case "tnxToDate":
                if (this.displayTransactionDate && disputeFilters[filterName]) {
                    this.displayTransactionDate = false;
                    return this.dateDiv(name, disputeFilters, "tnxFromDate", "tnxToDate", filterName);
                }
                break;
            case "disputeSubmitFromDate":
            case "disputeSubmitToDate":
                if (this.displaySubmittedDate && disputeFilters[filterName]) {
                    this.displaySubmittedDate = false;
                    return this.dateDiv(name, disputeFilters, "disputeSubmitFromDate", "disputeSubmitToDate", filterName);
                }    
                break;
            case "disputeCloseFromDate":
            case "disputeCloseToDate":
                if (this.displayCloseDate && disputeFilters[filterName]) {
                    this.displayCloseDate = false;
                    return this.dateDiv(name, disputeFilters, "disputeCloseFromDate", "disputeCloseToDate", filterName); 
                }
                break;
            case "reasonCodes" :
                return this.reasonDiv(name, disputeFilters, filterName);
                break;
            default:
                return this.defaultDiv(name, disputeFilters, filterName);
                break; 
        }
    }

    reasonDiv(name, disputeFilters, filterName) {
        let reasons = [];
            for (let i = 0; i < disputeFilters[filterName].length; i++) {
                if (disputeFilters[filterName][i]) {
                    reasons.push(this.reasonCodesDiv(name, disputeFilters[filterName][i], filterName,i));
                }
            }    
            return reasons;
    }

    reasonCodesDiv(name, value, filterName, count) {
        return (<div key={name + count} style={{ display: 'inline-block' } }>
            <div style={fieldProps.filterDiv} >{name}:&nbsp;{this.reasonCodeNameValueMap[value]} &nbsp;&nbsp;&nbsp; <div style={fieldProps.closeDiv} onClick={this.closeFilter.bind(this, filterName, value)}><i className="fa fa-times" aria-hidden="true"></i></div> </div>
                     &nbsp;&nbsp;
            </div>
        );
    }

    getDateDisplayValue(disputeFilters,filterName) {
       return disputeFilters[filterName] ? moment(new Date(disputeFilters[filterName])).format('MM/DD/YYYY') : '';
    }

    dateDiv(name, disputeFilters, fromDateFilterName, toDateFilterName, filterName) {
        return (
            <div key={name + filterName + disputeFilters} style={{ display: 'inline-block' }}>
                <div style={fieldProps.filterDiv} >{name}:&nbsp;{this.getDateDisplayValue(disputeFilters, fromDateFilterName)}&nbsp;-&nbsp;{this.getDateDisplayValue(disputeFilters, toDateFilterName)}&nbsp;&nbsp;&nbsp; <div style={fieldProps.closeDiv} onClick={this.closeFilter.bind(this, filterName)}><i className="fa fa-times" aria-hidden="true"></i></div> </div>
                    &nbsp;&nbsp;
                </div>
            );
    }

    defaultDiv(name,disputeFilters,filterName ) {
        return (
            <div key={filterName + disputeFilters} style={{ display: 'inline-block'}}>
                    <div style={fieldProps.filterDiv} >{name}:&nbsp; {disputeFilters[filterName]}&nbsp;&nbsp;&nbsp; <div style={fieldProps.closeDiv} onClick={this.closeFilter.bind(this, filterName)}><i className="fa fa-times" aria-hidden="true"></i></div> </div>
                    &nbsp;&nbsp;
                </div>
            );
    }

    render() {
        return (
            <div style={{ paddingBottom: '5px', position: 'relative'}}>
                {this.props.filterApplied ? this.renderFilterDivs(this.props.disputeFilters) : ''}
            </div>
        );
    }
}