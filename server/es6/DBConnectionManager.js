import {MongoClient} from 'mongodb';

/*
 Singleton class which provides single database connection to allover the application
*/
class DBConnectionManager {
    constructor() {
        this.createCollectionAndIndex = this.createCollectionAndIndex.bind(this);
        this.state = {
            db: null
        };
    }

    connect(url, done) {
        let me = this;
        if (this.state.db) {
            return done();
        }

        MongoClient.connect(url, function(err, db) {
            if (err) {
                return done(err);
            }
            me.state.db = db;
            me.createCollectionAndIndex();
            done();
        })
    }

    getConnection() {
        return this.state.db;
    }

    closeConnection(done) {
        if (this.state.db) {
            this.state.db.close(function(err, result) {
                this.state.db = null;
                done(err);
            })
        }
    }

    createCollectionAndIndex() {
        let me = this;
        me.state.db.listCollections({
                name: 'Transactions'
            })
            .next(function(err, collinfo) {
                if (collinfo) {
                    me.state.db.collection(collinfo.name).createIndex({
                        "transactionSlices.businessTransactions.btId": 1
                    });
                    me.state.db.collection(collinfo.name).createIndex({
                        tnxId: 1
                    });
                    me.state.db.collection(collinfo.name).createIndex({
                        "$**":"text"
                    });
                } else {
                    me.state.db.createCollection("Transactions", {}, function(error, collection) {
                        if (error) {
                            console.error("error while creating collection");
                        } else {
                            collection.createIndex({
                                "transactionSlices.businessTransactions.btId": 1
                            });
                            collection.createIndex({
                                tnxId: 1
                            });
                            collection.createIndex({
                                 "$**":"text" 
                            });
                            console.log('collection and Index created');
                        }
                    });
                }
            });
    }
}
export const dbconnectionManager = new DBConnectionManager();