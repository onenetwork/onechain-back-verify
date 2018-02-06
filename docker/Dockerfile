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
RUN apt-get update && apt-get -y install g++ \
&& apt-get -y install golang \
&& apt-get -y install git \
&& apt-get -y install curl \
&& apt-get -y install build-essential

# Install node.js
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -- \
&& apt-get update && apt-get -y install nodejs

# Install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 \
&& echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list \
&& apt-get update && apt-get install -y mongodb-org

RUN mkdir app && cd /app && git clone https://github.com/onenetwork/onechain-back-verify.git && cd /app/onechain-back-verify && echo {} > package.json

    #Install nodejs web server related packages
RUN cd /app/onechain-back-verify \
&& npm install --no-bin-links express --save \
&& npm install --no-bin-links body-parser --save \
&& npm install --no-bin-links cookie-parser --save \
&& npm install --no-bin-links multer --save \
&& npm install --no-bin-links mongodb@2.2.33 --save \
   
    #Install react packages
&& npm install --no-bin-links react --save \ 
&& npm install --no-bin-links react-dom --save \ 
&& npm install --no-bin-links react-bootstrap --save \ 
&& npm install --no-bin-links react-router-dom --save \ 

    #Install babel packages
&& npm install --no-bin-links babel --save-dev \ 
&& npm install --no-bin-links babel-core --save-dev \ 
&& npm install --no-bin-links babel-eslint --save-dev \ 
&& npm install --no-bin-links babel-plugin-dev-expression --save-dev \ 
&& npm install --no-bin-links babel-plugin-lodash --save-dev \ 
&& npm install --no-bin-links babel-plugin-transform-class-properties --save-dev \ 
&& npm install --no-bin-links babel-plugin-transform-decorators-legacy --save-dev \ 
&& npm install --no-bin-links babel-plugin-transform-es2015-modules-amd --save-dev \ 
&& npm install --no-bin-links babel-polyfill --save-dev \ 
&& npm install --no-bin-links babel-preset-es2015 --save-dev \ 
&& npm install --no-bin-links babel-preset-react --save-dev \
&& npm install --no-bin-links babel-preset-stage-0 --save-dev \
&& npm install --no-bin-links babel-preset-stage-1 --save-dev \
   
    #Install babelify
&& npm install --no-bin-links babelify --save-dev \ 
   
    #Install browserify packages
&& npm install --no-bin-links browserify --save-dev \ 
&& npm install --no-bin-links browserify-shim --save-dev \ 
&& npm install --no-bin-links browserify-transform-tools --save-dev \ 
&& npm install --no-bin-links browserify-css --save-dev \ 
   
    #Install gulp and required vinyl
&& npm install -g gulp \
&& npm install --no-bin-links gulp --save-dev \ 
&& npm install --no-bin-links vinyl-source-stream --save-dev \ 
&& npm install --no-bin-links gulp-babel --save-dev \ 
   
    #Install mobx packages
&& npm install --no-bin-links mobx --save \ 
&& npm install --no-bin-links mobx-react --save \ 
   
    #Install fetch packages
&& npm install --no-bin-links whatwg-fetch --save \ 

    #Install object.intersect library
&& npm install --no-bin-links object.intersect --save \ 
   
    #Install jszip for ZIP files
&& npm install --no-bin-links jszip --save \ 

    #Install moment
&& npm install moment --save \

    #Install datepicker it has dependancy on moment
&& npm install react-datetime --save \ 

    #custom Scrollbar
&& npm install react-custom-scrollbars --save \ 

    #library for unsafe integers
&& npm install bignumber.js@6.0.0 --save \ 

	#Table Pagination
&& npm install react-pagination-table --save-dev \ 

	# IE support
&& npm install --no-bin-links isomorphic-fetch es6-promise --save-dev \ 
&& npm install --no-bin-links es6-object-assign --save-dev \

	#Install onechain-back-client
&& npm install -P --no-bin-links @onenetwork/one-backchain-client --save

RUN cd /app/onechain-back-verify && gulp init && gulp transpile && gulp build

WORKDIR /app

VOLUME /data/db

# Define default command.
CMD mongod --fork --logpath /var/log/mongod.log && node onechain-back-verify/server/es5/server.js
#CMD ["/bin/bash"]