#!/bin/bash

npm version prepatch --preid beta -f
npm publish --tag=beta
npm login
sudo npm install -g homebridge-tivo-channels@beta