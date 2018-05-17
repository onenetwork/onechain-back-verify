import React from 'react';
import { observer } from 'mobx-react';
import { dbconnectionManager } from '../DBConnectionManager';
import BackChainActions from '../BackChainActions';


@observer
export default class EventsPopoverContent extends React.Component {

    render() {
        const { store, transaction } = this.props;
        const { events, eventsTransactionId } = store;

        let content = <div>Loading...</div>;

        if(transaction.id === eventsTransactionId) {
            let eventList = [];
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                if(typeof event !== 'number') {
                    eventList.push(
                        <li key={i} style={{
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            maxWidth: 800,
                            marginLeft: 10,
                            marginRight: 10
                        }}>
                            <span style={{color:'#990000', marginRight: 8}}>{event.date}</span>{" "}
                            <span>{event.actionName}</span>
                        </li>
                    );
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
