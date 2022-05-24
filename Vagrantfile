# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "centos/8"
   
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.auto_update = false
  end
 
  #Required for local environment and Internet Explorer
  config.vm.network "forwarded_port", guest: 8081, host: 8081
  config.vm.network "private_network", ip: "55.55.55.5"

  config.vm.synced_folder "/GitHub/onechain-back-verify", "/vagrant"

  config.vm.provider "virtualbox" do |vb|
     vb.memory = "2048"
  end

  config.vm.provision :shell, inline: <<-SHELL
	sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*
	sudo sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
	sudo yum update -y
	sudo yum -y install wget
	
	# Install g++
    sudo yum install -y centos-release-scl
	sudo yum install -y devtoolset-8-gcc devtoolset-8-gcc-c++
	
    # Install go
	wget https://storage.googleapis.com/golang/getgo/installer_linux
	chmod +x ./installer_linux
	./installer_linux 

	# Install git
	sudo yum install -y git
	
    # Install node.js
    curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
	sudo yum install -y nodejs

    # Install mongodb
	sudo chmod 777 /etc/yum.repos.d/
    sudo printf  "[mongodb-org-3.4]\nname=MongoDB Repository\nbaseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/3.4/x86_64/\ngpgcheck=1\nenabled=1\ngpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc" >> /etc/yum.repos.d/mongodb-org.repo
	
	sudo yum install -y mongodb-org
	sudo systemctl start mongod
    sudo sed -i 's/bindIp: 127.0.0.1/#bindIp: 127.0.0.1/g' /etc/mongod.conf #in order to access the db using 55.55.55.5:27017 outside the 

    # Install npm packages
	mkdir /vagrant/node_modules
	mkdir ~/vagrant_node_modules
	sudo mount --bind ~/vagrant_node_modules /vagrant/node_modules

    cd /vagrant
    sudo npm config set bin-links false
	
	sudo chown -R vagrant /usr/local/bin /usr/local/lib /usr/local/include /usr/local/share /usr/lib /vagrant/node_modules/
	npm install
	npm install gulp-cli@2.0.1 -g
   
    printf ". ~/.bashrc\ncd /vagrant\n. .env.sh\n" >> /home/vagrant/.bash_profile   
    mkdir /home/vagrant/log
    
    sudo chown -R vagrant /home/vagrant

    #Workaround for packages node-gyp-build and gulp-cli are not installed. Run below commands after vagrant ssh
	#sudo chown -R vagrant /usr/local/bin /usr/local/lib /usr/local/include /usr/local/share /usr/lib /vagrant/node_modules/
    #npm install node-gyp-build@3.4.0
	#npm install
	#mkdir ~/.npm-global
	#npm config set prefix '~/.npm-global'
	#vi ~/.profile
	#add "export PATH=~/.npm-global/bin:$PATH" to ~/.profile
	#source ~/.profile
	#npm install gulp-cli@2.0.1 -g

    echo '=== Provisioning Complete ==='
  SHELL
end
