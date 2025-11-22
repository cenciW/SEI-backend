#!/bin/bash
# Script to install SWI-Prolog on Render

echo "Installing SWI-Prolog..."

# Update package list
apt-get update

# Install SWI-Prolog
apt-get install -y swi-prolog

# Verify installation
swipl --version

echo "SWI-Prolog installed successfully!"
