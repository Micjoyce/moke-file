#!/bin/bash

docker_registry="docker.micjoyce.com"
namespace="moke-ng"
appname=`cut -d "=" -f 2 <<< $(npm run env | grep "npm_package_name")`

commit_tag=`git rev-parse HEAD`
echo $commit_tag
# package_version=`git describe`
package_version=$(cat package.json | grep version | head -1 | awk -F= "{ print $2 }" | sed 's/[version:,\",]//g' | tr -d '[[:space:]]')
echo $package_version

commit_image="${docker_registry}/${namespace}/${appname}:${commit_tag}"
app_image="${docker_registry}/${namespace}/${appname}:v${package_version}"
app_latest_image="${docker_registry}/${namespace}/${appname}:latest"

echo $commit_image
echo $app_image

docker build -t ${app_image} .

echo "push image ${app_image}"
docker push ${app_image}

docker tag $app_image $app_latest_image
echo "push latest image ${app_latest_image}"
docker push ${app_latest_image}

