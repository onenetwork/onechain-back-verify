#
# Ubuntu Dockerfile
#
# https://github.com/dockerfile/ubuntu
#

# Pull base image.
FROM scratch
ADD ubuntu-trusty-core-cloudimg-amd64-root.tar.gz /

RUN set -xe \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L40-L48
	&& echo '#!/bin/sh' > /usr/sbin/policy-rc.d \
	&& echo 'exit 101' >> /usr/sbin/policy-rc.d \
	&& chmod +x /usr/sbin/policy-rc.d \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L54-L56
	&& dpkg-divert --local --rename --add /sbin/initctl \
	&& cp -a /usr/sbin/policy-rc.d /sbin/initctl \
	&& sed -i 's/^exit.*/exit 0/' /sbin/initctl \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L71-L78
	&& echo 'force-unsafe-io' > /etc/dpkg/dpkg.cfg.d/docker-apt-speedup \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L85-L105
	&& echo 'DPkg::Post-Invoke { "rm -f /var/cache/apt/archives/*.deb /var/cache/apt/archives/partial/*.deb /var/cache/apt/*.bin || true"; };' > /etc/apt/apt.conf.d/docker-clean \
	&& echo 'APT::Update::Post-Invoke { "rm -f /var/cache/apt/archives/*.deb /var/cache/apt/archives/partial/*.deb /var/cache/apt/*.bin || true"; };' >> /etc/apt/apt.conf.d/docker-clean \
	&& echo 'Dir::Cache::pkgcache ""; Dir::Cache::srcpkgcache "";' >> /etc/apt/apt.conf.d/docker-clean \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L109-L115
	&& echo 'Acquire::Languages "none";' > /etc/apt/apt.conf.d/docker-no-languages \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L118-L130
	&& echo 'Acquire::GzipIndexes "true"; Acquire::CompressionTypes::Order:: "gz";' > /etc/apt/apt.conf.d/docker-gzip-indexes \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L134-L151
	&& echo 'Apt::AutoRemove::SuggestsImportant "false";' > /etc/apt/apt.conf.d/docker-autoremove-suggests

# delete all the apt list files since they're big and get stale quickly
RUN rm -rf /var/lib/apt/lists/*
# this forces "apt-get update" in dependent images, which is also good

# enable the universe
RUN sed -i 's/^#\s*\(deb.*universe\)$/\1/g' /etc/apt/sources.list

# make systemd-detect-virt return "docker"
# See: https://github.com/systemd/systemd/blob/aa0c34279ee40bce2f9681b496922dedbadfca19/src/basic/virt.c#L434
RUN mkdir -p /run/systemd && echo 'docker' > /run/systemd/container

# Install
RUN apt-get update
RUN apt-get -y install g++
RUN apt-get -y install golang
RUN apt-get -y install git
RUN apt-get -y install curl
RUN apt-get -y install node-gyp

# Install node.js
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash --
RUN apt-get -y install nodejs

    # Install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
RUN apt-get update
RUN apt-get install -y mongodb-org

#Install nodejs web server related packages
RUN npm install --no-bin-links express
RUN npm install --no-bin-links body-parser
RUN npm install --no-bin-links cookie-parser
RUN npm install --no-bin-links multer
RUN npm install --no-bin-links mongodb
   
    #Install react packages
RUN npm install --no-bin-links react
RUN npm install --no-bin-links react-dom
RUN npm install --no-bin-links react-bootstrap
RUN npm install --no-bin-links react-router-dom

    #Install babel packages
RUN npm install --no-bin-links babel
RUN npm install --no-bin-links babel-core
RUN npm install --no-bin-links babel-eslint
RUN npm install --no-bin-links babel-plugin-dev-expression
RUN npm install --no-bin-links babel-plugin-lodash
RUN npm install --no-bin-links babel-plugin-transform-class-properties
RUN npm install --no-bin-links babel-plugin-transform-decorators-legacy
RUN npm install --no-bin-links babel-plugin-transform-es2015-modules-amd
RUN npm install --no-bin-links babel-polyfill
RUN npm install --no-bin-links babel-preset-es2015
RUN npm install --no-bin-links babel-preset-react
RUN npm install --no-bin-links babel-preset-stage-0
RUN npm install --no-bin-links babel-preset-stage-1
   
    #Install babelify
RUN npm install --no-bin-links babelify
   
    #Install browserify packages
RUN npm install --no-bin-links browserify
RUN npm install --no-bin-links browserify-shim
RUN npm install --no-bin-links browserify-transform-tools
RUN npm install --no-bin-links browserify-css
   
    #Install gulp and required vinyl
RUN npm install -g gulp
RUN npm install --no-bin-links gulp
RUN npm install --no-bin-links vinyl-source-stream
RUN npm install --no-bin-links gulp-babel
   
    #Install mobx packages
RUN npm install --no-bin-links mobx
RUN npm install --no-bin-links mobx-react
   
    #Install fetch packages
RUN npm install --no-bin-links whatwg-fetch
   
    #Install Jquery json viewer
RUN npm install --no-bin-links jquery.json-viewer
   
    #Install jszip for ZIP files
RUN npm install --no-bin-links jszip

    #Install moment
RUN npm install moment

    #Install datepicker it has dependancy on moment
RUN npm install react-datetime

	#Table Pagination
RUN npm install react-pagination-table
	
	#Install onechain-back-client
RUN npm install -P --no-bin-links @onenetwork/one-backchain-client

RUN mkdir app && cd /app && git clone https://github.com/onenetwork/onechain-back-verify.git
RUN cd /app/onechain-back-verify && gulp init && gulp transpile && gulp build

WORKDIR /app

VOLUME /data/db

# Define default command.
CMD mongod --fork --logpath /var/log/mongod.log && node onechain-back-verify/server/es5/server.js
#CMD ["/bin/bash"]