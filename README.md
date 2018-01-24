# onechain-back-verify

Standalone application which can connect to One Network Enterprises' Backchain and verify individual transactions in the distributed ledger.

Licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

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
 
 ## Developing
 
 After you are set up and have ssh-ed into vagrant, you're ready to start developing.
 
 * Run `gulp transpile && gulp build`, then run `node server/es5/server.js`.
 * After the server initializes, you can access it at: http://55.55.55.5:8081/
 
 **Note:** The first time you load BCV, it will display a Setup page asking for a Blockchain URL, Contract Address and Private Key. You should replace http://localhost with http://10.0.2.2 for the Blockchain URL when running the server inside vagrant.
