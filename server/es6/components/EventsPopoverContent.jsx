import React from 'react';
import { observer } from 'mobx-react';
import { dbconnectionManager } from '../DBConnectionManager';
import { transactionHelper } from '../TransactionHelper';
import BackChainActions from '../BackChainActions';
import {utils} from '../Utils';


@observer
export default class EventsPopoverContent extends React.Component {

    render() {
        const { store, transaction } = this.props;
        const { events, eventsTransactionId } = store;
        let {selectedBtIds } = this.props; //only passed from Disputes View
        selectedBtIds = selectedBtIds || [];
        let content = <div>Loading...</div>;

        if(transaction.id === eventsTransactionId) {
            let eventList = [];
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                if(typeof event !== 'number') {
                    if(selectedBtIds.length == 0 || selectedBtIds.indexOf(event.btid) > -1) {
                        let processedBtRef = transactionHelper.processBtRef(event.btref);
                        let timeInMillis = utils.convertPlatformDateToMillis(event.date);
                        let formattedDate = utils.formatDate(timeInMillis);
                        eventList.push(
                            <li key={i} style={{
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                maxWidth: 800,
                                marginLeft: 10,
                                marginRight: 10
                            }}>
                                <span style={{color:'#990000', marginRight: 8}}>{formattedDate}</span>{" "}
                                <span>{processedBtRef.naturalKeys}&nbsp;&ndash;&nbsp;{processedBtRef.modelLevel}&nbsp;{'from'}&nbsp;<a href={processedBtRef.pltUrl} target="_blank">{processedBtRef.pltUrl}</a></span>
                            </li>
                        )
                    }
                }
                else {
                    // The number of events displayed is limited, so the last
                    // entry in the array might be a number of how many remain.
                    eventList.push(
                        <li key={i} style={{marginLeft: 10}}>And {event} more...</li>
                    );
                }
            }

            content = (
                <ul style={{
                    marginTop: 10,
                    marginBottom: 10,
                    paddingLeft: 0,
                    listStyleType: 'none',
                    height: "auto",
                    maxHeight: 200,
                    overflow: "auto"
                }}>
                    {eventList}
                </ul>
            );
        }

        return <div>{content}</div>;
    }

    componentDidMount() {
        setTimeout(() => {
            BackChainActions.loadEventsForTransaction(this.props.transaction);
        }, 100);
    }

}
