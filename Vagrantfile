# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.network "private_network", ip: "55.55.55.5"

  config.vm.synced_folder "C:/views/onechain-back-verify", "/vagrant", type: "virtualbox"

  config.vm.provider "virtualbox" do |vb|
     vb.memory = "2048"
  end

  config.vm.provision :shell, inline: <<-SHELL
    sudo apt-get -y install g++
    sudo apt-get -y install golang
    sudo apt-get -y install git

    # Install node.js
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get -y install nodejs
    sudo apt-get -y install npm

    # Install mongodb
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo service mongod start
    sudo sed -i 's/bindIp: 127.0.0.1/#bindIp: 127.0.0.1/g' /etc/mongod.conf #in order to access the db using 55.55.55.5:27017 outside the virtual box
    sudo service mongod restart

    #Install nodejs web server related packages
    cd /vagrant
    echo {} > package.json
    sudo npm install --no-bin-links express --save
    sudo npm install --no-bin-links body-parser --save
    sudo npm install --no-bin-links cookie-parser --save
    sudo npm install --no-bin-links multer --save
    sudo npm install --no-bin-links mongodb@2.2.33 --save
   
    #Install react packages
    sudo npm install --no-bin-links react --save
    sudo npm install --no-bin-links react-dom --save
    sudo npm install --no-bin-links react-bootstrap --save
    sudo npm install --no-bin-links react-router-dom --save

    #Install babel packages
    sudo npm install --no-bin-links babel --save-dev
    sudo npm install --no-bin-links babel-core --save-dev
    sudo npm install --no-bin-links babel-eslint --save-dev
    sudo npm install --no-bin-links babel-plugin-dev-expression --save-dev
    sudo npm install --no-bin-links babel-plugin-lodash --save-dev
    sudo npm install --no-bin-links babel-plugin-transform-class-properties --save-dev
    sudo npm install --no-bin-links babel-plugin-transform-decorators-legacy --save-dev
    sudo npm install --no-bin-links babel-plugin-transform-es2015-modules-amd --save-dev
    sudo npm install --no-bin-links babel-polyfill --save-dev
    sudo npm install --no-bin-links babel-preset-es2015 --save-dev
    sudo npm install --no-bin-links babel-preset-react --save-dev
    sudo npm install --no-bin-links babel-preset-stage-0 --save-dev
    sudo npm install --no-bin-links babel-preset-stage-1 --save-dev
   
    #Install babelify
    sudo npm install --no-bin-links babelify --save-dev
   
    #Install browserify packages
    sudo npm install --no-bin-links browserify --save-dev
    sudo npm install --no-bin-links browserify-shim --save-dev
    sudo npm install --no-bin-links browserify-transform-tools --save-dev
    sudo npm install --no-bin-links browserify-css --save-dev
   
    #Install gulp and required vinyl
    sudo npm install -g gulp
    sudo npm install --no-bin-links gulp --save-dev
    sudo npm install --no-bin-links vinyl-source-stream --save-dev
    sudo npm install --no-bin-links gulp-babel --save-dev
   
    #Install mobx packages
    sudo npm install --no-bin-links mobx --save
    sudo npm install --no-bin-links mobx-react --save
   
    #Install fetch packages
    sudo npm install --no-bin-links whatwg-fetch --save
   
    #Install Jquery json viewer
    sudo npm install --no-bin-links jquery.json-viewer --save
   
    #Install jszip for ZIP files
    sudo npm install --no-bin-links jszip --save
	
    #Install onechain-back-client
    sudo npm install -P --no-bin-links @onenetwork/one-backchain-client --save

    #Install moment
    sudo npm install moment --save

    #Install datepicker it has dependancy on moment
    sudo npm install react-datetime --save

    #custom Scrollbar
	  sudo npm install react-custom-scrollbars --save
	
	#Table Pagination
	sudo npm install --no-bin-links react-pagination-table --save-dev
	
	# IE support
	sudo npm install --no-bin-links isomorphic-fetch es6-promise --save-dev
	sudo npm install --no-bin-links es6-object-assign --save-dev
   
    printf ". ~/.bashrc\ncd /vagrant\n. .env.sh\n" >> /home/vagrant/.bash_profile   
    mkdir /home/vagrant/log
     
    sudo chown -R vagrant /home/vagrant

    echo '=== Provisioning Complete ==='
  SHELL
end
