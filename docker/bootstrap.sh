#!/bin/bash
set -e

echo "Running command: $1"

pwd
ls -la

NEW_PROJECT_DIR=/evidence/new-project

case $1 in
    demo)
        echo "Running demo from: $NEW_PROJECT_DIR"
        cd $NEW_PROJECT_DIR
        npm run dev
        ;;
    init)
        cp -r $NEW_PROJECT_DIR/* .
        echo "Files copied successfully."
        ;;
    dev)
        npm run dev
        ;;
    bash)
        bash
        ;;
    *)
        echo "Command(s) not recognized: #@"
        exit 1
        ;;
esac

