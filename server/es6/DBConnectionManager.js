import {
    MongoClient,
    GridStore,
    ObjectID
} from 'mongodb';

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
        console.log("pk1: " + mode);
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
                        "transactionSlices.businessTransactionIds": 1
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
                                "transactionSlices.businessTransactionIds": 1
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
                    me.state.db.createCollection("Settings", {}, function(error, collection) {
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

    saveSlice(slice, hash) {
        const me = this;
        return new Promise((resolve, reject) => {
            let gridStore = new GridStore(me.state.db, new ObjectID(), hash, "w");
            gridStore.open((err, _) => {
                if(err) {
                    reject(err);
                    return;
                }

                let buffer = new Buffer(slice);
                gridStore.write(buffer, (err, _) => {
                    if(err) {
                        reject(err);
                        return;
                    }

                    gridStore.close((err, file) => {
                        if(err) {
                            reject(err);
                            return;
                        }

                        resolve(file._id);
                    });
                });
            });
        });
    }

    fetchSlice(payloadId) {
        const me = this;
        return new Promise((resolve, reject) => {
            let gridStore = new GridStore(me.state.db, new ObjectID(payloadId), "r");
            gridStore.open((err, _) => {
                if(err) {
                    reject(err);
                    return;
                }

                gridStore.read((err, buffer) => {
                    if(err) {
                        reject(err);
                        return;
                    }

                    resolve(buffer.toString());
                });
            });
        });
    }

}
export const dbconnectionManager = new DBConnectionManager();
