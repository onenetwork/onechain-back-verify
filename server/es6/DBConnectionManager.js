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

    connect(url, dbName, mode, done) {
        let me = this;
        if (this.state.db) {
            return done();
        }

        MongoClient.connect(url, function(err, client) {
            if (err) {
                return done(err);
            }
            me.state.db = client.db(dbName);
            me.createCollectionAndIndex();
            me.setMode(mode);
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
                console.log('Creating Index/Collection for Transactions');
                if (collinfo) {
                    me.state.db.collection(collinfo.name).createIndex({
                        "transactionSlices.businessTransactions.btId": 1
                    });
                    me.state.db.collection(collinfo.name).createIndex({
                        tnxId: 1
                    });
                    console.log('Index created');
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
                            console.log('collection and Index created');
                        }
                    });
                }
            });

            me.state.db.listCollections({
                name: 'Settings'
            })
            .next(function(err, collinfo) {
                if (!collinfo) {
                    me.state.db.createCollection("Transactions", {}, function(error, collection) {
                        if (error) {
                            console.error("error while creating Settings collection");
                        } else {
                            console.log("Settings collection created successfully.")
                        }
                    }) 
                }  
            });
    }

    setMode(mode) {
        let me = this;
        me.state.db.collection('Settings').findOne({ type: 'applicationSettings' }, function (err, exist) {
            let data = '';
            if(exist) {
                data = exist;
                data.mode = mode;
            } else {
                data = {
                    mode : mode,
                    type: 'applicationSettings',
                };
            }
            var result =  me.state.db.collection('Settings').update({ type: 'applicationSettings' }, data, { upsert: true }).then(function (result) {
                if (result) {
                    console.log("Mode has been set successfully");
                }
            }).catch(function (err) {
                console.error("While setting mode in Settings collection" + err);
                
            });
        })
    }
}
export const dbconnectionManager = new DBConnectionManager();