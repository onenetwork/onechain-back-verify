# onechain-back-verify

Standalone application which can connect to One Network Enterprises' Backchain and verify individual transactions in the distributed ledger.

Licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

## Docker image

If you have docker installed, you can pull it from here:
https://hub.docker.com/r/onenetwork/onechain-back-verify/

## Setup

Setup for Windows environments:

 * install [VirtualBox](https://www.virtualbox.org/)
 * install [Vagrant](https://www.vagrantup.com/)
 * Run `vagrant plugin install vagrant-vbguest`
 * Clone the onechain-back-verify repo using `git clone https://github.com/onenetwork/onechain-back-verify.git`
 * cd to the `onechain-back-verify` directory in the cloned folder
 * Modify the file `Vagrant`, repointing "E:/views/onechain-back-verify" to your cloned onechain-back-verify directory in the line: `config.vm.synced_folder "E:/views/onechain-back-verify", "/vagrant", type: "virtualbox"`
 * Run `vagrant up` to provision and start the VM
 * Run `vagrant ssh` to connect to the VM
 * This will put you in `/vagrant`, which is bound to your local `onechain-back-verify` directory, and should be your location for executing commands and doing work
 * Run `gulp init`.

## Commands

Commands are provided to help testing. You must run the server before executing the commands.

* **deletedata** command provides ways to wipe out application data with the given options. deletedata  [-all] [-transactions] [-settings] [-bcSettings] [-ccSettings]
  * **all**           It will delete Settings, Transaction, fs.chunks and fs.files and SyncStatistics collections
  * **transactions**  It will delete Transaction, fs.chunks and fs.files and SyncStatistics collections
  * **settings**      It will delete Settings collection including both blockChain and chainOfCustody
  * **bcSettings**    It will delete blockChain settings only
  * **ccSettings**    It will delete chainOfCustody(plt/kafa) settings

## Developing

After you are set up and have ssh-ed into vagrant, you're ready to start developing.

 * Run `gulp transpile && gulp build`, then run `node server/es5/server.js`.
 * After the server initializes, you can access it at: http://55.55.55.5:8081/

#### Command-line arguments

There are a couple supported command-line arguments for the server:

```
  Arg name          Default    Description
 ------------------------------------------------------
  mode              'dev'      Either 'dev' or 'prod'.
  create-sync-gaps  false      Test mode that causes the server to discard
                               a percentage of messages received to quickly
                               create sync gaps.
```

Example usage:

```
node server/es5/server.js -mode=dev -create-sync-gaps=false
```

**Note:** When you sync BCV with PLT, it will display a Sync My Database page asking for a URL, OAuth Token and Date. You should replace http://localhost with http://10.0.2.2 for the URL when running the server inside vagrant.
